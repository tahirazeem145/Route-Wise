import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  X,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Car,
  Ban,
  Cone,
  Users,
  LightbulbOff,
  CloudRain
} from 'lucide-react';
import { fetchAuthorityHotspots, resolveAuthorityIncident } from '../services/api';

const TYPE_META = {
  congestion: { label: 'Traffic Gridlock', icon: Car, color: '#ef4444' },
  roadblock: { label: 'Roadblock', icon: Ban, color: '#f97316' },
  roadwork: { label: 'Roadwork', icon: Cone, color: '#eab308' },
  procession: { label: 'Procession / Rally', icon: Users, color: '#a855f7' },
  signal_failure: { label: 'Signal Failure', icon: LightbulbOff, color: '#f43f5e' },
  waterlogging: { label: 'Waterlogging', icon: CloudRain, color: '#06b6d4' }
};

function formatAge(isoString) {
  if (!isoString) return 'just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

export default function AuthorityDashboard({
  isOpen,
  onClose,
  onIncidentResolved
}) {
  const dialogRef = useRef(null);
  const [windowDays, setWindowDays] = useState(7);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [officerId, setOfficerId] = useState('Officer-Admin');
  const [resolvingIds, setResolvingIds] = useState(new Set());
  const [resolutionNotice, setResolutionNotice] = useState(null);

  // Sync dialog showModal/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        loadHotspots(windowDays);
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Light-dismiss click handler
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isInside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isInside) {
        onClose();
      }
    };

    dialog.addEventListener('click', handleBackdropClick);
    return () => dialog.removeEventListener('click', handleBackdropClick);
  }, [onClose]);

  const loadHotspots = async (days = windowDays) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAuthorityHotspots(days, 'admin');
      if (data && Array.isArray(data.hotspots)) {
        setHotspots(data.hotspots);
      } else {
        setHotspots([]);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load authority hotspots.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (incidentId) => {
    if (resolvingIds.has(incidentId)) return;
    setResolvingIds(prev => new Set(prev).add(incidentId));
    setErrorMsg(null);

    try {
      const res = await resolveAuthorityIncident(incidentId, officerId, 'admin');
      setResolutionNotice(`Incident ${res.resolvedId} resolved by ${res.resolvedBy}`);
      // Remove resolved incident from current list
      setHotspots(prev => prev.filter(h => h.id !== incidentId));

      if (onIncidentResolved) {
        onIncidentResolved(incidentId);
      }

      setTimeout(() => {
        setResolutionNotice(null);
      }, 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resolve incident.');
    } finally {
      setResolvingIds(prev => {
        const next = new Set(prev);
        next.delete(incidentId);
        return next;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="authorityModalTitle"
      className="modern-dialog-overlay"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        maxWidth: 820,
        width: '94%',
        margin: 'auto'
      }}
    >
      <div
        className="glass-panel p-4"
        style={{
          background: 'rgba(10, 12, 18, 0.98)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          borderRadius: 16,
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.85), 0 0 35px rgba(168, 85, 247, 0.25)',
          color: '#f8fafc',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom border-white border-opacity-10">
          <div className="d-flex align-items-center gap-2.5">
            <span
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: 38,
                height: 38,
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.5)',
                color: '#c084fc'
              }}
            >
              <ShieldAlert size={20} />
            </span>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 id="authorityModalTitle" className="mb-0 fw-bold text-white fs-6">
                  Municipal Traffic Authority Console (F5)
                </h5>
                <span
                  className="badge rounded-pill fw-semibold"
                  style={{
                    background: 'rgba(34, 197, 94, 0.18)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    color: '#86efac',
                    fontSize: '0.66rem'
                  }}
                >
                  ● Admin Role Active
                </span>
              </div>
              <span className="text-secondary" style={{ fontSize: '0.72rem' }}>
                7-day corridor hotspot triage, spatial recurrence analytics & rapid incident resolution
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm text-secondary p-1"
            onClick={onClose}
            aria-label="Close authority console"
            style={{ background: 'transparent', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar & Window Selector */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-2.5 mb-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small fw-semibold" style={{ fontSize: '0.72rem' }}>
              Recurrence Window:
            </span>
            {[7, 14, 30].map(days => (
              <button
                key={days}
                type="button"
                className={`btn btn-sm px-2.5 py-0.5 rounded-pill ${windowDays === days ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={{ fontSize: '0.70rem' }}
                onClick={() => {
                  setWindowDays(days);
                  loadHotspots(days);
                }}
              >
                {days} Days
              </button>
            ))}
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="input-group input-group-sm" style={{ width: 170 }}>
              <span className="input-group-text bg-dark border-secondary text-secondary" style={{ fontSize: '0.68rem' }}>
                Officer:
              </span>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary font-monospace"
                value={officerId}
                onChange={e => setOfficerId(e.target.value)}
                style={{ fontSize: '0.70rem' }}
                title="Officer ID logged for resolution audit"
              />
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 py-1"
              style={{ fontSize: '0.72rem' }}
              onClick={() => loadHotspots(windowDays)}
              disabled={loading}
            >
              <RefreshCw size={12} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {resolutionNotice && (
          <div className="alert alert-success py-2 px-3 small mb-3 rounded-2 d-flex align-items-center gap-2" role="alert" style={{ fontSize: '0.75rem' }}>
            <CheckCircle size={15} />
            <span>{resolutionNotice}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-danger py-2 px-3 small mb-3 rounded-2" role="alert" style={{ fontSize: '0.75rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Hotspots Content List / Table */}
        <div className="flex-grow-1 overflow-auto pe-1" style={{ maxHeight: '52vh' }}>
          {loading ? (
            <div className="text-center py-5">
              <span className="spinner-border text-info" role="status" aria-hidden="true" />
              <div className="text-secondary small mt-2">Loading active corridor hotspots...</div>
            </div>
          ) : hotspots.length === 0 ? (
            <div className="text-center py-5">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: 50,
                  height: 50,
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  color: '#4ade80'
                }}
              >
                <CheckCircle size={26} />
              </div>
              <h6 className="fw-bold text-white mb-1">All Corridor Junctions Clear</h6>
              <p className="text-secondary small mb-0">
                No active verified incidents require municipal resolution in the selected {windowDays}-day window.
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2.5">
              {hotspots.map((spot, index) => {
                const meta = TYPE_META[spot.type] || { label: spot.type, icon: AlertTriangle, color: '#ef4444' };
                const IconComponent = meta.icon;
                const isResolving = resolvingIds.has(spot.id);

                return (
                  <div
                    key={spot.id}
                    className="p-3 rounded-3 d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    {/* Left: Type, Rank & Recurrence */}
                    <div className="d-flex align-items-start gap-2.5 flex-grow-1">
                      <span
                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 mt-0.5"
                        style={{
                          width: 34,
                          height: 34,
                          background: `${meta.color}22`,
                          border: `1.5px solid ${meta.color}66`,
                          color: meta.color
                        }}
                      >
                        <IconComponent size={16} />
                      </span>

                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                          <span className="fw-bold text-white" style={{ fontSize: '0.82rem' }}>
                            #{index + 1} {meta.label}
                          </span>

                          <span className="font-monospace text-secondary" style={{ fontSize: '0.68rem' }}>
                            ({spot.id})
                          </span>

                          {/* 7-Day Recurrence Pill */}
                          <span
                            className="badge rounded-pill fw-semibold"
                            style={{
                              background: 'rgba(168, 85, 247, 0.22)',
                              border: '1px solid rgba(168, 85, 247, 0.5)',
                              color: '#d8b4fe',
                              fontSize: '0.66rem'
                            }}
                          >
                            🔁 {spot.recurrenceCount}x in {spot.recurrenceWindowDays}d
                          </span>

                          {/* Delay Impact Pill */}
                          {spot.estimatedImpactMinutes != null && (
                            <span
                              className="badge rounded-pill fw-semibold"
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.45)',
                                color: '#fca5a5',
                                fontSize: '0.66rem'
                              }}
                            >
                              ⏱ +{spot.estimatedImpactMinutes}m delay
                            </span>
                          )}
                        </div>

                        {/* Location, Source, Verification & Age Details */}
                        <div className="d-flex align-items-center gap-3 text-secondary flex-wrap" style={{ fontSize: '0.70rem' }}>
                          <span className="d-flex align-items-center gap-1 font-monospace text-info">
                            <MapPin size={11} />
                            <span>{Number(spot.latitude).toFixed(4)}, {Number(spot.longitude).toFixed(4)}</span>
                          </span>

                          <span>
                            Verified via: <strong className="text-light">{spot.verificationReason || 'community_confirmations'}</strong>
                          </span>

                          <span>
                            Confirmations: <strong className="text-light">👍 {spot.confirmationCount || 0}</strong>
                          </span>

                          <span>
                            Age: <span className="text-light">{formatAge(spot.createdAt)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Resolve Button */}
                    <div className="flex-shrink-0 align-self-end align-self-md-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold"
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => handleResolve(spot.id)}
                        disabled={isResolving}
                      >
                        {isResolving ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                            <span>Clearing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={13} />
                            <span>Mark Resolved</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="d-flex align-items-center justify-content-between pt-3 mt-3 border-top border-white border-opacity-10">
          <div className="text-secondary small" style={{ fontSize: '0.70rem' }}>
            Resolving an incident removes it from live driver warnings and updates the SQLite audit log.
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm px-3"
            style={{ fontSize: '0.75rem' }}
            onClick={onClose}
          >
            Close Console
          </button>
        </div>
      </div>
    </dialog>
  );
}
