import React, { useState } from 'react';
import { getStoredApiKey, setStoredApiKey, getDeveloperStatus } from '../services/api';

export default function ApiKeyModal({ show, onClose, onKeyUpdated }) {
  const [apiKeyInput, setApiKeyInput] = useState(getStoredApiKey());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!show) return null;

  const handleTestKey = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const data = await getDeveloperStatus(apiKeyInput.trim());
      if (data.success && data.auth?.authenticated) {
        setTestResult({
          success: true,
          message: `Authenticated successfully! (${data.auth.keyLabel})`
        });
      } else {
        setTestResult({
          success: false,
          message: data.error?.message || 'Invalid API Key. Authentication failed.'
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Connection to backend failed.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setStoredApiKey(apiKeyInput);
    if (onKeyUpdated) onKeyUpdated(apiKeyInput);
    onClose();
  };

  const handleResetDefault = () => {
    const defaultKey = 'sra_dev_hackathon_demo_key_2026';
    setApiKeyInput(defaultKey);
    setStoredApiKey(defaultKey);
    if (onKeyUpdated) onKeyUpdated(defaultKey);
    setTestResult({ success: true, message: 'Reset to default hackathon demo key.' });
  };

  return (
    <div className="modal show d-block glass-modal-backdrop" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content glass-modal-content border-0">
          <div className="modal-header py-3 px-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <h6 className="modal-title fw-bold text-light d-flex align-items-center gap-2">
              <span style={{ color: 'var(--accent-cyan)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              Developer API Key Management
            </h6>
            <button type="button" className="glass-close-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="modal-body p-4">
            <p className="small mb-3" style={{ color: '#94a3b8' }}>
              SmartRoute AI protects all route recommendation and refresh endpoints with 
              <strong className="text-light"> <code>X-API-Key</code></strong> header authentication. The backend stores only cryptographic 
              SHA-256 hashes of issued keys.
            </p>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-light">Active Client API Key</label>
              <input
                type="text"
                className="form-control font-monospace glass-input"
                placeholder="sra_dev_..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              <div className="form-text mt-1" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Stored locally in browser <code>localStorage</code>. Never shared with third parties.
              </div>
            </div>

            {testResult && (
              <div className={`p-2 mb-3 small ${testResult.success ? 'glass-alert-success' : 'glass-alert-danger'}`}>
                {testResult.message}
              </div>
            )}

            <div className="d-flex gap-2">
              <button
                type="button"
                className="glass-btn-secondary btn-sm flex-grow-1"
                onClick={handleTestKey}
                disabled={testing || !apiKeyInput.trim()}
              >
                {testing ? 'Testing...' : 'Test Key with Backend'}
              </button>
              <button
                type="button"
                className="glass-btn-secondary btn-sm"
                style={{ color: '#fde68a' }}
                onClick={handleResetDefault}
                title="Reset to default local hackathon key"
              >
                Reset Default
              </button>
            </div>

            <div className="mt-3 p-3 rounded text-light" style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.75rem' }}>
              <div className="fw-semibold text-info mb-1">CLI Key Generator:</div>
              <span style={{ color: '#94a3b8' }}>You can issue additional cryptographically signed keys with:</span>
              <div className="mt-1 font-monospace p-1 px-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--accent-cyan)' }}>
                npm run generate:key --prefix server
              </div>
            </div>
          </div>

          <div className="modal-footer py-3 px-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <button type="button" className="glass-btn-secondary btn-sm px-3" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="glass-btn-primary btn-sm px-4" onClick={handleSave}>
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
