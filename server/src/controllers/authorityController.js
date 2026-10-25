/**
 * Authority Controller (F5)
 * Manages traffic authority hotspot monitoring and incident resolution.
 */

const { getDatabase } = require('../models/db');

/**
 * GET /api/authority/hotspots
 * Query params: windowDays (default: 7)
 * Returns active verified incidents ranked by impact and age with 7-day spatial recurrence count.
 */
function getHotspots(req, res) {
  try {
    const db = getDatabase();
    const windowDays = Math.max(1, Math.min(30, parseInt(req.query.windowDays, 10) || 7));
    const hotspots = db.getAuthorityHotspots(windowDays);

    return res.json({
      success: true,
      count: hotspots.length,
      windowDays,
      hotspots
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message
      }
    });
  }
}

/**
 * POST /api/authority/reports/:id/resolve
 * Marks an incident as Resolved, updates audit fields (resolvedAt, resolvedBy).
 */
function resolveIncident(req, res) {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const resolvedBy = req.body?.resolvedBy || req.authorityUser?.officerId || 'Traffic Authority Officer';

    const existing = db.getReportById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: `Incident report with ID '${id}' was not found.`
        }
      });
    }

    const updated = db.resolveReport(id, resolvedBy);

    return res.json({
      success: true,
      resolvedId: id,
      status: updated.status,
      resolvedBy: updated.resolvedBy,
      resolvedAt: updated.resolvedAt
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message
      }
    });
  }
}

module.exports = {
  getHotspots,
  resolveIncident
};
