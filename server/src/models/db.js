const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Supported incident types per Section 4 & Section 7
 */
const VALID_TYPES = [
  'congestion',
  'roadblock',
  'roadwork',
  'procession',
  'signal_failure',
  'waterlogging'
];

/**
 * Tunable default lifetimes in seconds per Section 4.1
 */
const DEFAULT_EXPIRIES = {
  congestion: 15 * 60,         // 15 minutes
  signal_failure: 60 * 60,     // 60 minutes
  roadblock: 120 * 60,         // 120 minutes (recheck at 30m)
  procession: 120 * 60,        // 120 minutes
  waterlogging: 90 * 60,       // 90 minutes
  roadwork: 24 * 3600          // 24 hours
};

/**
 * Haversine formula: Calculates distance between two coordinates in meters
 */
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Initializes and wraps the SQLite database
 */
function createDatabase(customPath) {
  let dbPath = customPath;
  if (!dbPath) {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    dbPath = path.join(dataDir, 'routewise.db');
  }

  const rawDb = new DatabaseSync(dbPath);

  // Enable WAL mode and busy timeout for concurrent access robustness
  rawDb.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
  `);

  // Initialize schema
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS incident_reports (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('congestion', 'roadblock', 'roadwork', 'procession', 'signal_failure', 'waterlogging')),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Unverified', 'Verified', 'Resolved', 'Expired')),
      verificationReason TEXT CHECK(verificationReason IN ('telemetry_match', 'community_confirmations', NULL)),
      confirmationCount INTEGER NOT NULL DEFAULT 0,
      denialCount INTEGER NOT NULL DEFAULT 0,
      estimatedImpactMinutes INTEGER DEFAULT NULL,
      resolvedAt TEXT DEFAULT NULL,
      resolvedBy TEXT DEFAULT NULL,
      source TEXT NOT NULL CHECK(source IN ('user', 'seeded', 'simulated'))
    );

    CREATE TABLE IF NOT EXISTS incident_votes (
      id TEXT PRIMARY KEY,
      reportId TEXT NOT NULL,
      anonymousUserKey TEXT NOT NULL,
      vote TEXT NOT NULL CHECK(vote IN ('yes', 'no', 'not_sure')),
      createdAt TEXT NOT NULL,
      FOREIGN KEY(reportId) REFERENCES incident_reports(id) ON DELETE CASCADE,
      UNIQUE(reportId, anonymousUserKey)
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incident_reports(status);
    CREATE INDEX IF NOT EXISTS idx_incidents_coords ON incident_reports(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_incidents_expires ON incident_reports(expiresAt);
    CREATE INDEX IF NOT EXISTS idx_incidents_created ON incident_reports(createdAt);
    CREATE INDEX IF NOT EXISTS idx_votes_report ON incident_votes(reportId);
  `);

  const api = {
    rawDb,

    /**
     * Create an incident report
     */
    createReport(data) {
      if (!data || !VALID_TYPES.includes(data.type)) {
        throw new Error(`Invalid incident type: ${data?.type}. Must be one of: ${VALID_TYPES.join(', ')}`);
      }

      const id = data.id || `inc-${crypto.randomUUID().slice(0, 8)}`;
      const now = new Date();
      const createdAt = data.createdAt || now.toISOString();
      const updatedAt = data.updatedAt || now.toISOString();
      const defaultLifetime = DEFAULT_EXPIRIES[data.type] || 1800;
      const expiresAt = data.expiresAt || new Date(now.getTime() + defaultLifetime * 1000).toISOString();

      const status = data.status || 'Unverified';
      const source = data.source || 'user';
      const verificationReason = data.verificationReason || null;
      const confirmationCount = Number(data.confirmationCount) || 0;
      const denialCount = Number(data.denialCount) || 0;
      const estimatedImpactMinutes = data.estimatedImpactMinutes != null ? Number(data.estimatedImpactMinutes) : null;
      const resolvedAt = data.resolvedAt || null;
      const resolvedBy = data.resolvedBy || null;

      const stmt = rawDb.prepare(`
        INSERT INTO incident_reports (
          id, type, latitude, longitude, createdAt, updatedAt, expiresAt,
          status, verificationReason, confirmationCount, denialCount,
          estimatedImpactMinutes, resolvedAt, resolvedBy, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        data.type,
        Number(data.latitude),
        Number(data.longitude),
        createdAt,
        updatedAt,
        expiresAt,
        status,
        verificationReason,
        confirmationCount,
        denialCount,
        estimatedImpactMinutes,
        resolvedAt,
        resolvedBy,
        source
      );

      return api.getReportById(id);
    },

    /**
     * Retrieve report by ID
     */
    getReportById(id) {
      const stmt = rawDb.prepare('SELECT * FROM incident_reports WHERE id = ?');
      const row = stmt.get(id);
      return row ? { ...row } : null;
    },

    /**
     * List all currently active reports (Unverified or Verified and not expired)
     */
    listActiveReports() {
      const now = new Date().toISOString();
      const stmt = rawDb.prepare(`
        SELECT * FROM incident_reports
        WHERE status IN ('Unverified', 'Verified') AND expiresAt > ?
        ORDER BY createdAt DESC
      `);
      return stmt.all(now).map(r => ({ ...r }));
    },

    /**
     * Find nearby active reports within radiusMeters using bounding box + Haversine
     */
    findNearbyReports(lat, lng, radiusMeters = 1000, statusFilter = null) {
      const now = new Date().toISOString();
      const latDelta = radiusMeters / 111000;
      const lngDelta = radiusMeters / (111000 * Math.max(0.1, Math.cos(lat * Math.PI / 180)));

      let sql = `
        SELECT * FROM incident_reports
        WHERE latitude BETWEEN ? AND ?
          AND longitude BETWEEN ? AND ?
          AND expiresAt > ?
      `;
      const params = [lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta, now];

      if (statusFilter) {
        sql += ' AND status = ?';
        params.push(statusFilter);
      } else {
        sql += " AND status IN ('Unverified', 'Verified')";
      }

      const candidates = rawDb.prepare(sql).all(...params);

      // Compute exact Haversine distance and filter
      const results = [];
      for (const row of candidates) {
        const dist = haversineDistanceMeters(lat, lng, row.latitude, row.longitude);
        if (dist <= radiusMeters) {
          results.push({
            ...row,
            distanceMeters: dist
          });
        }
      }

      return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
    },

    /**
     * Deduplication: Check if an active report of same type exists within radiusMeters (default 100m)
     */
    findDuplicateReport(type, lat, lng, radiusMeters = 100, activeOnly = true) {
      const nearby = api.findNearbyReports(lat, lng, radiusMeters);
      const match = nearby.find(r => r.type === type && (!activeOnly || ['Unverified', 'Verified'].includes(r.status)));
      return match || null;
    },

    /**
     * Cast or update a vote on an incident report
     */
    castVote(reportId, anonymousUserKey, vote) {
      if (!['yes', 'no', 'not_sure'].includes(vote)) {
        throw new Error("Invalid vote. Must be 'yes', 'no', or 'not_sure'");
      }

      const report = api.getReportById(reportId);
      if (!report) {
        throw new Error(`Report not found: ${reportId}`);
      }

      const voteId = `v-${crypto.randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();

      // Upsert vote ensuring one vote per user per report
      const upsertStmt = rawDb.prepare(`
        INSERT INTO incident_votes (id, reportId, anonymousUserKey, vote, createdAt)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(reportId, anonymousUserKey) DO UPDATE SET
          vote = excluded.vote,
          createdAt = excluded.createdAt
      `);
      upsertStmt.run(voteId, reportId, anonymousUserKey, vote, now);

      // Recount yes and no votes
      const yesRow = rawDb.prepare("SELECT count(*) as count FROM incident_votes WHERE reportId = ? AND vote = 'yes'").get(reportId);
      const noRow = rawDb.prepare("SELECT count(*) as count FROM incident_votes WHERE reportId = ? AND vote = 'no'").get(reportId);

      const confirmationCount = yesRow?.count || 0;
      const denialCount = noRow?.count || 0;

      // Verification transition (Section 4.1): At least two distinct confirmations verify an unverified report
      let newStatus = report.status;
      let newReason = report.verificationReason;

      if (report.status === 'Unverified') {
        if (confirmationCount >= 2 && confirmationCount >= denialCount) {
          newStatus = 'Verified';
          newReason = 'community_confirmations';
        }
      }

      rawDb.prepare(`
        UPDATE incident_reports SET
          confirmationCount = ?,
          denialCount = ?,
          status = ?,
          verificationReason = ?,
          updatedAt = ?
        WHERE id = ?
      `).run(confirmationCount, denialCount, newStatus, newReason, now, reportId);

      return {
        reportId,
        anonymousUserKey,
        vote,
        createdAt: now
      };
    },

    /**
     * Get all votes for a report
     */
    getVotesForReport(reportId) {
      const stmt = rawDb.prepare('SELECT * FROM incident_votes WHERE reportId = ?');
      return stmt.all(reportId).map(v => ({ ...v }));
    },

    /**
     * Update status (e.g. via telemetry match or authority action)
     */
    updateReportStatus(id, { status, verificationReason, estimatedImpactMinutes, resolvedBy }) {
      const report = api.getReportById(id);
      if (!report) return null;

      const now = new Date().toISOString();
      const nextStatus = status || report.status;
      const nextReason = verificationReason !== undefined ? verificationReason : report.verificationReason;
      const nextImpact = estimatedImpactMinutes !== undefined ? estimatedImpactMinutes : report.estimatedImpactMinutes;
      const resolvedAt = nextStatus === 'Resolved' ? now : report.resolvedAt;
      const nextResolvedBy = resolvedBy || report.resolvedBy;

      rawDb.prepare(`
        UPDATE incident_reports SET
          status = ?,
          verificationReason = ?,
          estimatedImpactMinutes = ?,
          resolvedAt = ?,
          resolvedBy = ?,
          updatedAt = ?
        WHERE id = ?
      `).run(nextStatus, nextReason, nextImpact, resolvedAt, nextResolvedBy, now, id);

      return api.getReportById(id);
    },

    /**
     * Authority resolve action (Section 7 & 8.2)
     */
    resolveReport(id, resolvedBy = 'Traffic Authority Admin') {
      return api.updateReportStatus(id, {
        status: 'Resolved',
        resolvedBy
      });
    },

    /**
     * Expire stale reports whose expiresAt has passed
     */
    expireStaleReports() {
      const now = new Date().toISOString();
      const stmt = rawDb.prepare(`
        UPDATE incident_reports SET
          status = 'Expired',
          updatedAt = ?
        WHERE status IN ('Unverified', 'Verified') AND expiresAt <= ?
      `);
      const result = stmt.run(now, now);
      return result.changes;
    },

    /**
     * Authority Hotspots view (Section 4 & 7):
     * Returns active verified incidents ranked by:
     * 1. estimatedImpactMinutes DESC
     * 2. createdAt ASC (age)
     * 3. confirmationCount DESC
     * With 7-day spatial recurrence count.
     */
    getAuthorityHotspots(windowDays = 7) {
      const now = new Date().toISOString();
      const activeVerified = rawDb.prepare(`
        SELECT * FROM incident_reports
        WHERE status = 'Verified' AND expiresAt > ?
      `).all(now).map(r => ({ ...r }));

      const windowStart = new Date(Date.now() - windowDays * 86400000).toISOString();
      const allInWindow = rawDb.prepare(`
        SELECT * FROM incident_reports
        WHERE createdAt >= ?
      `).all(windowStart).map(r => ({ ...r }));

      // Calculate 7-day recurrence within ~150 meters for each hotspot
      const enriched = activeVerified.map(hotspot => {
        let recurrenceCount = 0;
        for (const past of allInWindow) {
          const dist = haversineDistanceMeters(hotspot.latitude, hotspot.longitude, past.latitude, past.longitude);
          if (dist <= 150) {
            recurrenceCount++;
          }
        }

        const ageMinutes = Math.max(0, Math.round((Date.now() - new Date(hotspot.createdAt).getTime()) / 60000));

        return {
          ...hotspot,
          ageMinutes,
          recurrenceCount: Math.max(1, recurrenceCount),
          recurrenceWindowDays: windowDays
        };
      });

      // Sort order per Section 4: estimatedImpactMinutes DESC, createdAt ASC (oldest first), confirmationCount DESC
      enriched.sort((a, b) => {
        const impactA = a.estimatedImpactMinutes != null ? a.estimatedImpactMinutes : -1;
        const impactB = b.estimatedImpactMinutes != null ? b.estimatedImpactMinutes : -1;
        if (impactA !== impactB) {
          return impactB - impactA;
        }

        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        if (timeA !== timeB) {
          return timeA - timeB; // oldest first
        }

        return (b.confirmationCount || 0) - (a.confirmationCount || 0);
      });

      return enriched;
    },

    /**
     * Preload realistic seed incidents along the primary Coimbatore corridor (Avinashi Road)
     */
    seedDemoIncidents() {
      // 1. Verified Roadblock at Hope College Junction (Avinashi Rd)
      const inc1 = api.createReport({
        id: 'inc-seed-hope-college',
        type: 'roadblock',
        latitude: 11.0335,
        longitude: 77.0135,
        status: 'Verified',
        verificationReason: 'community_confirmations',
        confirmationCount: 4,
        denialCount: 0,
        estimatedImpactMinutes: 15,
        source: 'seeded'
      });

      // 2. Verified Congestion at Gandhipuram Crosscut Junction
      const inc2 = api.createReport({
        id: 'inc-seed-gandhipuram',
        type: 'congestion',
        latitude: 11.0168,
        longitude: 76.9660,
        status: 'Verified',
        verificationReason: 'telemetry_match',
        confirmationCount: 3,
        denialCount: 0,
        estimatedImpactMinutes: 8,
        source: 'seeded'
      });

      // 3. Unverified Waterlogging at Peelamedu
      const inc3 = api.createReport({
        id: 'inc-seed-peelamedu-water',
        type: 'waterlogging',
        latitude: 11.0260,
        longitude: 77.0020,
        status: 'Unverified',
        verificationReason: null,
        confirmationCount: 1,
        denialCount: 0,
        estimatedImpactMinutes: 5,
        source: 'seeded'
      });

      // 4. Historical incident 3 days ago at Gandhipuram for 7-day recurrence calculation
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      const inc4 = api.createReport({
        id: 'inc-seed-gandhipuram-past',
        type: 'congestion',
        latitude: 11.0170,
        longitude: 76.9662,
        status: 'Resolved',
        createdAt: threeDaysAgo,
        resolvedAt: threeDaysAgo,
        resolvedBy: 'Traffic Authority Admin',
        source: 'seeded'
      });

      return [inc1, inc2, inc3, inc4];
    }
  };

  return api;
}

// Default singleton instance pointing to server/data/routewise.db
let defaultDbInstance = null;

function getDatabase() {
  if (!defaultDbInstance) {
    defaultDbInstance = createDatabase();
  }
  return defaultDbInstance;
}

module.exports = {
  createDatabase,
  getDatabase,
  haversineDistanceMeters,
  VALID_TYPES,
  DEFAULT_EXPIRIES
};
