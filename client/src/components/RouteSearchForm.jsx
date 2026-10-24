import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  LocateFixed,
  ArrowUpDown,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Search,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { searchLocationsApi } from '../services/api';

const PRESETS = [
  { label: 'Trichy → Coimbatore', src: 'Tiruchirappalli', dst: 'Coimbatore' },
  { label: 'Gandhipuram → RS Puram', src: 'Gandhipuram, Coimbatore', dst: 'RS Puram, Coimbatore' },
  { label: 'Indiranagar → Whitefield', src: 'Indiranagar, Bengaluru', dst: 'Whitefield, Bengaluru' },
  { label: 'Salem → Bangalore', src: 'Salem', dst: 'Bangalore' },
  { label: 'Chennai → Madurai', src: 'Chennai', dst: 'Madurai' }
];

export default function RouteSearchForm({
  source,
  setSource,
  destination,
  setDestination,
  onSubmit,
  onRefresh,
  loading,
  refreshing,
  hasResults,
  autoRefreshEnabled,
  setAutoRefreshEnabled,
  refreshCountdown,
  weights,
  setWeights
}) {
  const [showWeights, setShowWeights] = useState(false);

  // Autocomplete states for Origin
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [sourceSelectedIndex, setSourceSelectedIndex] = useState(-1);

  // Autocomplete states for Destination
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [destLoading, setDestLoading] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [destSelectedIndex, setDestSelectedIndex] = useState(-1);

  // Geolocation state
  const [locating, setLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState(null);

  const sourceContainerRef = useRef(null);
  const destContainerRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (sourceContainerRef.current && !sourceContainerRef.current.contains(event.target)) {
        setShowSourceDropdown(false);
      }
      if (destContainerRef.current && !destContainerRef.current.contains(event.target)) {
        setShowDestDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for Origin
  useEffect(() => {
    if (!source || source.trim().length < 2) {
      setSourceSuggestions([]);
      setSourceLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSourceLoading(true);
      const results = await searchLocationsApi(source);
      setSourceSuggestions(results);
      setSourceLoading(false);
      setSourceSelectedIndex(-1);
      if (results.length > 0) {
        setShowSourceDropdown(true);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [source]);

  // Debounced search for Destination
  useEffect(() => {
    if (!destination || destination.trim().length < 2) {
      setDestSuggestions([]);
      setDestLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setDestLoading(true);
      const results = await searchLocationsApi(destination);
      setDestSuggestions(results);
      setDestLoading(false);
      setDestSelectedIndex(-1);
      if (results.length > 0) {
        setShowDestDropdown(true);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [destination]);

  // Geolocation trigger
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser.');
      setTimeout(() => setGeoNotice(null), 3000);
      return;
    }

    setLocating(true);
    setGeoNotice('Detecting GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setSource(`${lat}, ${lng}`);
        setGeoNotice(`GPS locked: ${lat}, ${lng}`);
        setTimeout(() => setGeoNotice(null), 2500);
      },
      (err) => {
        setLocating(false);
        setGeoNotice(`GPS failed: ${err.message}`);
        setTimeout(() => setGeoNotice(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
    setShowSourceDropdown(false);
    setShowDestDropdown(false);
  };

  const handlePreset = (preset) => {
    setSource(preset.src);
    setDestination(preset.dst);
    setShowSourceDropdown(false);
    setShowDestDropdown(false);
  };

  const handleSelectSource = (loc) => {
    setSource(loc.name);
    setShowSourceDropdown(false);
  };

  const handleSelectDest = (loc) => {
    setDestination(loc.name);
    setShowDestDropdown(false);
  };

  // Keyboard navigation for Origin
  const handleSourceKeyDown = (e) => {
    if (!showSourceDropdown || sourceSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSourceSelectedIndex((prev) => (prev + 1) % sourceSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSourceSelectedIndex((prev) => (prev <= 0 ? sourceSuggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (sourceSelectedIndex >= 0 && sourceSelectedIndex < sourceSuggestions.length) {
        e.preventDefault();
        handleSelectSource(sourceSuggestions[sourceSelectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSourceDropdown(false);
    }
  };

  // Keyboard navigation for Destination
  const handleDestKeyDown = (e) => {
    if (!showDestDropdown || destSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDestSelectedIndex((prev) => (prev + 1) % destSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDestSelectedIndex((prev) => (prev <= 0 ? destSuggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (destSelectedIndex >= 0 && destSelectedIndex < destSuggestions.length) {
        e.preventDefault();
        handleSelectDest(destSuggestions[destSelectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDestDropdown(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowSourceDropdown(false);
    setShowDestDropdown(false);
    if (source.trim() && destination.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="glass-panel p-3 mb-3">
      {/* Panel Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="card-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
          <span
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: 28,
              height: 28,
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid rgba(56, 189, 248, 0.4)'
            }}
          >
            <Navigation size={15} color="#38bdf8" />
          </span>
          <span>Plan & Rank Route</span>
        </h6>
        <span className="badge font-monospace d-flex align-items-center gap-1" style={{ fontSize: '0.68rem', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
          <Sparkles size={11} color="#38bdf8" />
          <span>AI Engine</span>
        </span>
      </div>

      <form onSubmit={handleFormSubmit}>
        {/* Source Input with Autocomplete & GPS */}
        <div className="mb-2 autocomplete-container" ref={sourceContainerRef}>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <label className="form-label small text-secondary mb-0 fw-semibold d-flex align-items-center gap-1">
              <span
                className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
                style={{ width: 18, height: 18, fontSize: '0.65rem', background: '#22c55e', fontWeight: 'bold' }}
              >
                A
              </span>
              <span className="text-light">Origin Location</span>
            </label>

            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-decoration-none d-flex align-items-center gap-1"
              style={{ fontSize: '0.68rem', color: '#38bdf8' }}
              onClick={handleLocateMe}
              disabled={locating || loading}
              title="Use current GPS position as Origin"
            >
              <LocateFixed size={12} className={locating ? 'spinner-border spinner-border-sm' : ''} />
              <span>{locating ? 'Locating...' : 'Use My GPS'}</span>
            </button>
          </div>

          {geoNotice && (
            <div className="small mb-1 text-info font-monospace" style={{ fontSize: '0.66rem' }}>
              ℹ {geoNotice}
            </div>
          )}

          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control glass-input"
              placeholder="e.g. Gandhipuram, Whitefield, or 10.79, 78.70"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setShowSourceDropdown(true);
              }}
              onFocus={() => {
                if (sourceSuggestions.length > 0) setShowSourceDropdown(true);
              }}
              onKeyDown={handleSourceKeyDown}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSourceDropdown}
              required
              disabled={loading}
              autoComplete="off"
            />
            {source && (
              <button
                type="button"
                className="btn glass-btn-secondary"
                onClick={() => {
                  setSource('');
                  setSourceSuggestions([]);
                  setShowSourceDropdown(false);
                }}
                title="Clear origin"
              >
                &times;
              </button>
            )}
          </div>

          {/* Source Autocomplete Dropdown */}
          {showSourceDropdown && sourceSuggestions.length > 0 && (
            <div className="autocomplete-dropdown" role="listbox">
              {sourceSuggestions.map((loc, idx) => (
                <div
                  key={idx}
                  className={`autocomplete-item ${idx === sourceSelectedIndex ? 'is-selected' : ''}`}
                  onClick={() => handleSelectSource(loc)}
                  role="option"
                  aria-selected={idx === sourceSelectedIndex}
                >
                  <div className="autocomplete-title d-flex align-items-center gap-1.5">
                    <MapPin size={13} color="#22c55e" />
                    <span>{loc.name}</span>
                  </div>
                  <div className="autocomplete-sub">
                    <span>{loc.municipality || 'Location'}{loc.country ? `, ${loc.country}` : ''}</span>
                    <span className="autocomplete-coord">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Swap Button */}
        <div className="text-center my-2">
          <button
            type="button"
            className="btn glass-swap-btn d-inline-flex align-items-center gap-1.5"
            onClick={handleSwap}
            title="Swap origin and destination"
            disabled={loading}
          >
            <ArrowUpDown size={13} color="#38bdf8" />
            <span>Swap</span>
          </button>
        </div>

        {/* Destination Input with Autocomplete */}
        <div className="mb-2 autocomplete-container" ref={destContainerRef}>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <label className="form-label small mb-0 fw-semibold d-flex align-items-center gap-1" style={{ color: '#e2e8f0' }}>
              <span
                className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
                style={{ width: 18, height: 18, fontSize: '0.65rem', background: '#ef4444', fontWeight: 'bold' }}
              >
                B
              </span>
              <span className="text-light">Destination Location</span>
            </label>
            {destLoading && (
              <span className="spinner-border spinner-border-sm text-info" style={{ width: 11, height: 11 }} />
            )}
          </div>

          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control glass-input"
              placeholder="e.g. RS Puram, Coimbatore Airport, or 11.01, 76.95"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setShowDestDropdown(true);
              }}
              onFocus={() => {
                if (destSuggestions.length > 0) setShowDestDropdown(true);
              }}
              onKeyDown={handleDestKeyDown}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showDestDropdown}
              required
              disabled={loading}
              autoComplete="off"
            />
            {destination && (
              <button
                type="button"
                className="btn glass-btn-secondary"
                onClick={() => {
                  setDestination('');
                  setDestSuggestions([]);
                  setShowDestDropdown(false);
                }}
                title="Clear destination"
              >
                &times;
              </button>
            )}
          </div>

          {/* Destination Autocomplete Dropdown */}
          {showDestDropdown && destSuggestions.length > 0 && (
            <div className="autocomplete-dropdown" role="listbox">
              {destSuggestions.map((loc, idx) => (
                <div
                  key={idx}
                  className={`autocomplete-item ${idx === destSelectedIndex ? 'is-selected' : ''}`}
                  onClick={() => handleSelectDest(loc)}
                  role="option"
                  aria-selected={idx === destSelectedIndex}
                >
                  <div className="autocomplete-title d-flex align-items-center gap-1.5">
                    <MapPin size={13} color="#ef4444" />
                    <span>{loc.name}</span>
                  </div>
                  <div className="autocomplete-sub">
                    <span>{loc.municipality || 'Location'}{loc.country ? `, ${loc.country}` : ''}</span>
                    <span className="autocomplete-coord">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Click Guidance Helper */}
        <div className="mb-3 d-flex align-items-center gap-1.5 text-muted" style={{ fontSize: '0.70rem' }}>
          <Sparkles size={12} color="#38bdf8" />
          <span>Click anywhere on the map to set Origin (A) or Destination (B).</span>
        </div>

        {/* Quick Presets */}
        <div className="mb-3">
          <span className="d-block mb-1 fw-semibold" style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
            Quick Route Presets:
          </span>
          <div className="d-flex flex-wrap gap-1.5">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="glass-preset-pill"
                onClick={() => handlePreset(p)}
                disabled={loading}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-grid gap-2 mb-3">
          <button
            type="submit"
            className="btn glass-btn-primary d-flex align-items-center justify-content-center gap-2 py-2"
            disabled={loading || !source.trim() || !destination.trim()}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Evaluating Live Routes...</span>
              </>
            ) : (
              <>
                <Search size={15} />
                <span>Find & Rank Best Route</span>
              </>
            )}
          </button>

          {hasResults && (
            <button
              type="button"
              className="btn glass-btn-secondary btn-sm d-flex align-items-center justify-content-center gap-2 py-1"
              onClick={onRefresh}
              disabled={refreshing || loading}
            >
              {refreshing ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Refreshing Delays...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={13} />
                  <span>Refresh Traffic Now</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Auto Refresh Toggle */}
        {hasResults && (
          <div
            className="pt-2 d-flex align-items-center justify-content-between"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="autoRefreshSwitch"
                checked={autoRefreshEnabled}
                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              />
              <label className="form-check-label small text-secondary" htmlFor="autoRefreshSwitch">
                Live Auto-Refresh (60s)
              </label>
            </div>
            {autoRefreshEnabled && (
              <span
                className="badge font-monospace"
                style={{
                  fontSize: '0.68rem',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                {refreshCountdown}s
              </span>
            )}
          </div>
        )}

        {/* Ranking Weights Toggle */}
        <div className="mt-2 text-center">
          <button
            type="button"
            className="btn btn-link btn-sm text-decoration-none p-0 fw-semibold d-inline-flex align-items-center gap-1"
            style={{ fontSize: '0.74rem', color: '#38bdf8' }}
            onClick={() => setShowWeights(!showWeights)}
          >
            <SlidersHorizontal size={12} />
            <span>{showWeights ? 'Hide Ranking Weights' : 'Customize Criteria Weights'}</span>
          </button>
        </div>

        {/* Collapsible Weights Sliders */}
        {showWeights && (() => {
          const totalW = ((weights.weightTime || 0) + (weights.weightDelay || 0) + (weights.weightDistance || 0)) || 1.0;
          const effTime = Math.round(((weights.weightTime || 0) / totalW) * 100);
          const effDelay = Math.round(((weights.weightDelay || 0) / totalW) * 100);
          const effDist = Math.max(0, 100 - effTime - effDelay);

          return (
            <div
              className="mt-2 p-3 rounded-3"
              style={{
                background: 'rgba(14, 14, 18, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-white fw-semibold">Multi-Criteria Weights</span>
                <span
                  className="badge font-monospace"
                  style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.12)', color: '#e2e8f0' }}
                >
                  Normalized (100%)
                </span>
              </div>

              {/* Travel Time Weight */}
              <div className="mb-2">
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.74rem', color: '#e2e8f0' }}>
                  <span className="fw-medium">Travel Time</span>
                  <span className="text-info fw-bold font-monospace">{effTime}%</span>
                </div>
                <input
                  type="range"
                  className="form-range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weights.weightTime}
                  onChange={(e) => setWeights({ ...weights, weightTime: parseFloat(e.target.value) })}
                />
              </div>

              {/* Traffic Delay Weight */}
              <div className="mb-2">
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.74rem', color: '#e2e8f0' }}>
                  <span className="fw-medium">Traffic Congestion Delay</span>
                  <span className="text-warning fw-bold font-monospace">{effDelay}%</span>
                </div>
                <input
                  type="range"
                  className="form-range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weights.weightDelay}
                  onChange={(e) => setWeights({ ...weights, weightDelay: parseFloat(e.target.value) })}
                />
              </div>

              {/* Distance Weight */}
              <div>
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.74rem', color: '#e2e8f0' }}>
                  <span className="fw-medium">Geographic Distance</span>
                  <span className="text-success fw-bold font-monospace">{effDist}%</span>
                </div>
                <input
                  type="range"
                  className="form-range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weights.weightDistance}
                  onChange={(e) => setWeights({ ...weights, weightDistance: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          );
        })()}
      </form>
    </div>
  );
}
