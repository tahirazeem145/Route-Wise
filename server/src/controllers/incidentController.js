const { getDatabase, VALID_TYPES } = require('../models/db');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// In-memory rate limiting map for report submissions: anonymousUserKey -> timestamps[]
const submissionRateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REPORTS_PER_WINDOW = 10;

function checkRateLimit(userKey) {
  const now = Date.now();
  let timestamps = submissionRateLimits.get(userKey) || [];
  timestamps = timestamps.filter(ts => (now - ts) < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= MAX_REPORTS_PER_WINDOW) {
    return false;
  }

  timestamps.push(now);
  submissionRateLimits.set(userKey, timestamps);
  return true;
}

/**
 * POST /api/reports
 * Submit a structured community incident report
 */
async function createReport(req, res) {
  try {
    const { type, latitude, longitude, anonymousUserKey, source } = req.body || {};

    if (!type || !VALID_TYPES.includes(type)) {
      return errorResponse(
        res,
        'INVALID_INCIDENT_TYPE',
        `Invalid incident type "${type}". Supported types are: ${VALID_TYPES.join(', ')}`,
        400
      );
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      return errorResponse(
        res,
        'INVALID_COORDINATES',
        'Valid latitude (-90 to 90) and longitude (-180 to 180) are required.',
        400
      );
    }

    if (!anonymousUserKey || typeof anonymousUserKey !== 'string' || anonymousUserKey.trim().length === 0) {
      return errorResponse(
        res,
        'MISSING_USER_KEY',
        'An anonymousUserKey is required to submit and track community reports.',
        400
      );
    }

    // Rate limit check
    if (!checkRateLimit(anonymousUserKey.trim())) {
      return errorResponse(
        res,
        'RATE_LIMIT_EXCEEDED',
        'Too many reports submitted. Please wait a few minutes before reporting another incident.',
        429
      );
    }

    const db = getDatabase();

    // Check for duplicate reports of same type within 100m
    const duplicate = db.findDuplicateReport(type, lat, lng, 100);

    if (duplicate) {
      logger.info(`Merging duplicate incident report ${duplicate.id} of type "${type}" within 100m`);
      // Cast confirmation vote on existing report
      db.castVote(duplicate.id, anonymousUserKey.trim(), 'yes');
      const updated = db.getReportById(duplicate.id);

      return successResponse(res, {
        isDuplicateMerged: true,
        message: 'A report for this incident already exists nearby. Your confirmation vote was recorded.',
        ...updated
      }, 200);
    }

    // Create new unverified report
    const newReport = db.createReport({
      type,
      latitude: lat,
      longitude: lng,
      source: source || 'user'
    });

    logger.info(`Created new unverified incident report ${newReport.id} (${type}) at [${lat}, ${lng}]`);

    return successResponse(res, {
      isDuplicateMerged: false,
      message: 'Incident reported successfully. Currently unverified pending telemetry or community confirmation.',
      ...newReport
    }, 201);
  } catch (error) {
    logger.error('Error creating incident report:', error.message);
    return errorResponse(res, 'REPORT_CREATION_FAILED', error.message || 'Unable to create report.', 500);
  }
}

/**
 * GET /api/reports/nearby
 * Retrieve active reports within radius
 */
async function getNearbyReports(req, res) {
  try {
    const latParam = req.query.lat ?? req.query.latitude;
    const lngParam = req.query.lng ?? req.query.longitude;
    const radiusParam = req.query.radiusM ?? req.query.radiusMeters ?? req.query.radius;
    const status = req.query.status;

    const latitude = parseFloat(latParam);
    const longitude = parseFloat(lngParam);

    if (isNaN(latitude) || isNaN(longitude)) {
      return errorResponse(
        res,
        'INVALID_QUERY_COORDINATES',
        'Query parameters "lat" (or "latitude") and "lng" (or "longitude") are required numbers.',
        400
      );
    }

    const radius = Math.min(25000, Math.max(100, parseInt(radiusParam, 10) || 3000));
    const db = getDatabase();

    // Automatically expire any stale reports first
    db.expireStaleReports();

    const reports = db.findNearbyReports(latitude, longitude, radius, status);

    const enriched = reports.map(r => {
      const ageMinutes = Math.max(0, Math.round((Date.now() - new Date(r.createdAt).getTime()) / 60000));
      return {
        ...r,
        ageMinutes
      };
    });

    return successResponse(res, {
      reports: enriched,
      count: enriched.length
    });
  } catch (error) {
    logger.error('Error fetching nearby reports:', error.message);
    return errorResponse(res, 'FETCH_REPORTS_FAILED', error.message, 500);
  }
}

/**
 * POST /api/reports/:id/votes
 * Cast confirmation, denial, or not sure vote on an incident
 */
async function voteReport(req, res) {
  try {
    const { id } = req.params;
    const { vote, anonymousUserKey } = req.body || {};

    if (!vote || !['yes', 'no', 'not_sure'].includes(vote)) {
      return errorResponse(
        res,
        'INVALID_VOTE_VALUE',
        "Vote must be one of: 'yes', 'no', or 'not_sure'.",
        400
      );
    }

    if (!anonymousUserKey || typeof anonymousUserKey !== 'string' || anonymousUserKey.trim().length === 0) {
      return errorResponse(
        res,
        'MISSING_USER_KEY',
        'An anonymousUserKey is required to cast a vote.',
        400
      );
    }

    const db = getDatabase();
    const existing = db.getReportById(id);

    if (!existing) {
      return errorResponse(res, 'REPORT_NOT_FOUND', `Incident report ${id} not found.`, 404);
    }

    if (existing.status === 'Resolved' || existing.status === 'Expired') {
      return errorResponse(
        res,
        'REPORT_INACTIVE',
        `Cannot vote on an incident with status "${existing.status}".`,
        400
      );
    }

    db.castVote(id, anonymousUserKey.trim(), vote);
    const updated = db.getReportById(id);

    logger.info(`User ${anonymousUserKey.slice(0, 8)} voted "${vote}" on report ${id} -> Status: ${updated.status} (${updated.confirmationCount} yes, ${updated.denialCount} no)`);

    return successResponse(res, {
      ...updated,
      userVote: vote
    });
  } catch (error) {
    logger.error(`Error voting on report ${req.params.id}:`, error.message);
    return errorResponse(res, 'VOTE_FAILED', error.message, 500);
  }
}

function _resetRateLimits() {
  submissionRateLimits.clear();
}

module.exports = {
  createReport,
  getNearbyReports,
  voteReport,
  _resetRateLimits
};
