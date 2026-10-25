import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  Car,
  Ban,
  Cone,
  Users,
  LightbulbOff,
  CloudRain,
  MapPin,
  CheckCircle2,
  Clock,
  Send
} from 'lucide-react';
import { submitIncidentReport } from '../services/api';
import { getAnonymousUserKey } from '../utils/userKey';

const INCIDENT_TYPES = [
  {
    type: 'congestion',
    label: 'Traffic Gridlock',
    desc: 'Severe bottleneck or stalled movement',
    icon: Car,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)'
  },
  {
    type: 'roadblock',
    label: 'Roadblock',
    desc: 'Barricade, closure, or police detour',
    icon: Ban,
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.4)'
  },
  {
    type: 'roadwork',
    label: 'Roadwork',
    desc: 'Construction or resurfacing work',
    icon: Cone,
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.15)',
    border: 'rgba(234, 179, 8, 0.4)'
  },
  {
    type: 'procession',
    label: 'Procession / Rally',
    desc: 'Public gathering, festival, or protest',
    icon: Users,
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.4)'
  },
  {
    type: 'signal_failure',
    label: 'Signal Failure',
    desc: 'Traffic light dark or blinking',
    icon: LightbulbOff,
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.15)',
    border: 'rgba(244, 63, 94, 0.4)'
  },
  {
    type: 'waterlogging',
    label: 'Waterlogging',
    desc: 'Flooded street or storm drain overflow',
    icon: CloudRain,
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.4)'
  }
];

export default function ReportIncidentModal({
  isOpen,
  onClose,
  defaultCoords,
  onIncidentReported
}) {
  const dialogRef = useRef(null);
  const [selectedType, setSelectedType] = useState('congestion');
  const [coords, setCoords] = useState({ lat: 11.0168, lng: 76.9660 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync coords from defaultCoords when modal opens
  useEffect(() => {
    if (defaultCoords && defaultCoords.lat && defaultCoords.lng) {
      setCoords({
        lat: Number(Number(defaultCoords.lat).toFixed(5)),
        lng: Number(Number(defaultCoords.lng).toFixed(5))
      });
    }
    setReceipt(null);
    setErrorMsg(null);
  }, [isOpen, defaultCoords]);

  // Native <dialog> lifecycle adhering to modern-web-guidance
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Fallback light-dismiss for browsers without native <dialog closedby>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const userKey = getAnonymousUserKey();
      const res = await submitIncidentReport({
        type: selectedType,
        latitude: coords.lat,
        longitude: coords.lng,
        anonymousUserKey: userKey,
        source: 'user'
      });

      setReceipt(res);
      if (onIncidentReported) {
        onIncidentReported(res);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Unable to submit incident report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="reportModalTitle"
      className="modern-dialog-overlay"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        maxWidth: 580,
        width: '92%',
        margin: 'auto'
      }}
    >
      <div
        className="glass-panel p-4"
        style={{
          background: 'rgba(12, 14, 22, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.25)',
          color: '#f8fafc'
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom border-white border-opacity-10">
          <div className="d-flex align-items-center gap-2">
            <span
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: 34,
                height: 34,
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                color: '#f87171'
              }}
            >
              <AlertTriangle size={18} />
            </span>
            <div>
              <h5 id="reportModalTitle" className="mb-0 fw-bold text-white fs-6">
                Report Traffic Incident (F4)
              </h5>
              <span className="text-secondary" style={{ fontSize: '0.70rem' }}>
                One-tap crowd reporting with real-time verification
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm text-secondary p-1"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ background: 'transparent', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile Driving Safety Warning */}
        <div
          className="p-2 mb-3 rounded-2 d-flex align-items-center gap-2"
          style={{
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            fontSize: '0.72rem',
            color: '#fde047'
          }}
        >
          <ShieldAlert size={16} className="flex-shrink-0" />
          <span>
            <strong>Safety Reminder:</strong> Do not report while driving. Report only when safely parked or as a passenger.
          </span>
        </div>

        {errorMsg && (
          <div className="alert alert-danger py-2 px-3 small mb-3 rounded-2" role="alert">
            {errorMsg}
          </div>
        )}

        {receipt ? (
          /* Submission Receipt State */
          <div className="text-center py-3">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: 52,
                height: 52,
                background: 'rgba(34, 197, 94, 0.2)',
                border: '2px solid #22c55e',
                color: '#4ade80'
              }}
            >
              <CheckCircle2 size={30} />
            </div>

            <h6 className="fw-bold text-white mb-1">
              {receipt.isDuplicateMerged ? 'Confirmation Vote Recorded!' : 'Incident Reported Successfully!'}
            </h6>

            <p className="text-secondary small mb-3">
              {receipt.isDuplicateMerged
                ? 'An active incident was already identified nearby. Your affirmative vote has been merged to accelerate verification.'
                : 'Your report has been logged and published to the live map with Unverified status.'}
            </p>

            {/* Receipt Summary Card */}
            <div
              className="card-field-box text-start p-3 mb-3 rounded-3"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="d-flex justify-content-between align-items-center mb-1.5">
                <span className="text-secondary small">Incident ID:</span>
                <span className="font-monospace text-info small fw-bold">{receipt.id}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-1.5">
                <span className="text-secondary small">Type:</span>
                <span className="badge font-monospace text-uppercase" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  {receipt.type}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-1.5">
                <span className="text-secondary small">Lifecycle Status:</span>
                <span
                  className="badge rounded-pill fw-bold"
                  style={{
                    background: receipt.status === 'Verified' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                    color: receipt.status === 'Verified' ? '#4ade80' : '#fde047',
                    border: `1px solid ${receipt.status === 'Verified' ? '#22c55e' : '#eab308'}`
                  }}
                >
                  ● {receipt.status} {receipt.verificationReason ? `(${receipt.verificationReason})` : ''}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-secondary small">Confirmations:</span>
                <span className="font-monospace text-light small fw-bold">
                  👍 {receipt.confirmationCount || 0} / 👎 {receipt.denialCount || 0}
                </span>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100 py-2 small"
                onClick={() => setReceipt(null)}
              >
                Report Another
              </button>
              <button
                type="button"
                className="btn btn-primary w-100 py-2 small fw-semibold"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit}>
            {/* 6 Structured Incident Types Grid */}
            <label className="form-label small text-secondary fw-semibold mb-2 d-block">
              Select Structured Incident Type:
            </label>

            <div className="row g-2 mb-3">
              {INCIDENT_TYPES.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedType === item.type;
                return (
                  <div key={item.type} className="col-6">
                    <button
                      type="button"
                      className="w-100 p-2.5 text-start rounded-3 d-flex flex-column transition-all"
                      onClick={() => setSelectedType(item.type)}
                      style={{
                        background: isSelected ? item.bg : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? `2px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <IconComponent size={16} color={item.color} />
                        <span className="fw-semibold text-white" style={{ fontSize: '0.78rem' }}>
                          {item.label}
                        </span>
                      </div>
                      <span className="text-secondary" style={{ fontSize: '0.64rem', lineHeight: '1.2' }}>
                        {item.desc}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Coordinates / Map Center Display */}
            <div className="mb-3">
              <label className="form-label small text-secondary fw-semibold mb-1 d-flex align-items-center justify-content-between">
                <span>Incident Coordinates (Map Anchor):</span>
                <span className="text-info font-monospace" style={{ fontSize: '0.66rem' }}>
                  Click map or edit manually
                </span>
              </label>

              <div className="d-flex gap-2">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-dark border-secondary text-secondary font-monospace" style={{ fontSize: '0.70rem' }}>
                    Lat
                  </span>
                  <input
                    type="number"
                    step="0.00001"
                    className="form-control bg-dark text-white border-secondary font-monospace"
                    value={coords.lat}
                    onChange={(e) => setCoords({ ...coords, lat: parseFloat(e.target.value) || 0 })}
                    style={{ fontSize: '0.75rem' }}
                    required
                  />
                </div>

                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-dark border-secondary text-secondary font-monospace" style={{ fontSize: '0.70rem' }}>
                    Lng
                  </span>
                  <input
                    type="number"
                    step="0.00001"
                    className="form-control bg-dark text-white border-secondary font-monospace"
                    value={coords.lng}
                    onChange={(e) => setCoords({ ...coords, lng: parseFloat(e.target.value) || 0 })}
                    style={{ fontSize: '0.75rem' }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Verification Lifecycle Note */}
            <div className="p-2 mb-3 rounded-2 bg-black bg-opacity-30 border border-white border-opacity-10 text-secondary" style={{ fontSize: '0.68rem', lineHeight: '1.3' }}>
              <span className="text-info fw-semibold">Verification Lifecycle:</span> New reports begin as <strong className="text-warning">Unverified</strong>. Reports auto-verify when 2 or more nearby community confirmations arrive or when matching speed drops (&gt;30%) occur on TomTom telemetry.
            </div>

            {/* Submit Action */}
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary py-2 px-3 small"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-danger flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold small"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    <span>Publishing Report...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Publish Incident Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
