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
  {
    label: 'Central Bus Stand ⇄ Chathiram',
    shortLabel: 'CBS ⇄ Chathiram',
    src: 'Central Bus Stand, Trichy',
    dst: 'Chathiram Bus Stand, Trichy',
    tag: 'Arterial'
  },
  {
    label: 'Chathiram ⇄ Srirangam (Kaveri Bridge)',
    shortLabel: 'Chathiram ⇄ Srirangam',
    src: 'Chathiram Bus Stand, Trichy',
    dst: 'Srirangam Rajagopuram, Trichy',
    tag: 'Bottleneck'
  },
  {
    label: 'HPO Junction ⇄ Thillai Nagar',
    shortLabel: 'HPO ⇄ Thillai Nagar',
    src: 'Head Post Office Junction, Trichy',
    dst: 'Thillai Nagar, Trichy',
    tag: 'Artery'
  },
  {
    label: 'Palakkarai ⇄ Gandhi Market',
    shortLabel: 'Palakkarai ⇄ Gandhi Mkt',
    src: 'Palakkarai Junction, Trichy',
    dst: 'Gandhi Market, Trichy',
    tag: 'Hotspot'
  },
  {
    label: 'TVS Tollgate ⇄ Airport Junction',
    shortLabel: 'TVS ⇄ Airport',
    src: 'TVS Tollgate Junction, Trichy',
    dst: 'Tiruchirappalli International Airport',
    tag: 'Merge'
  },
  {
    label: 'Central Bus Stand ⇄ NIT Trichy',
    shortLabel: 'CBS ⇄ NIT Trichy',
    src: 'Central Bus Stand, Trichy',
    dst: 'NIT Trichy (Thuvakudi)',
    tag: 'Highway'
  }
];

const TRICHY_JUNCTIONS = [
  { name: 'Central Bus Stand, Trichy', short: 'Central Bus Stand' },
  { name: 'Chathiram Bus Stand, Trichy', short: 'Chathiram' },
  { name: 'Thillai Nagar, Trichy', short: 'Thillai Nagar' },
  { name: 'Head Post Office Junction, Trichy', short: 'HPO Junction' },
  { name: 'Palakkarai Junction, Trichy', short: 'Palakkarai' },
  { name: 'Gandhi Market, Trichy', short: 'Gandhi Market' },
  { name: 'Srirangam Rajagopuram, Trichy', short: 'Srirangam' },
  { name: 'TVS Tollgate Junction, Trichy', short: 'TVS Tollgate' },
  { name: 'Tiruchirappalli International Airport', short: 'Trichy Airport' },
  { name: 'NIT Trichy (Thuvakudi)', short: 'NIT Trichy' }
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

  // Local input values to decouple keystrokes from parent App re-renders (120 FPS typing)
  const [inputSource, setInputSource] = useState(source || '');
  const [inputDest, setInputDest] = useState(destination || '');

  // Keep local inputs in sync when parent props change (e.g. from preset or map-click)
  useEffect(() => {
    if (!userTypingSourceRef.current) {
      setInputSource(source || '');
    }
  }, [source]);

  useEffect(() => {
    if (!userTypingDestRef.current) {
      setInputDest(destination || '');
    }
  }, [destination]);

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
  const userTypingSourceRef = useRef(false);
  const userTypingDestRef = useRef(false);

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

  // Debounced search for Origin — triggers only when user actively types
  useEffect(() => {
    if (!userTypingSourceRef.current || !inputSource || inputSource.trim().length < 2) {
      setSourceSuggestions([]);
      setSourceLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSourceLoading(true);
      const results = await searchLocationsApi(inputSource);
      setSourceSuggestions(results);
      setSourceLoading(false);
      setSourceSelectedIndex(-1);
      if (results.length > 0) {
        setShowSourceDropdown(true);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [inputSource]);

  // Debounced search for Destination — triggers only when user actively types
  useEffect(() => {
    if (!userTypingDestRef.current || !inputDest || inputDest.trim().length < 2) {
      setDestSuggestions([]);
      setDestLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setDestLoading(true);
      const results = await searchLocationsApi(inputDest);
      setDestSuggestions(results);
      setDestLoading(false);
      setDestSelectedIndex(-1);
      if (results.length > 0) {
        setShowDestDropdown(true);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [inputDest]);

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
        const val = `${lat}, ${lng}`;
        userTypingSourceRef.current = false;
        setInputSource(val);
        setSource(val);
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
    userTypingSourceRef.current = false;
    userTypingDestRef.current = false;
    const temp = inputSource;
    setInputSource(inputDest);
    setInputDest(temp);
    setSource(inputDest);
    setDestination(temp);
    setShowSourceDropdown(false);
    setShowDestDropdown(false);
  };

  const handlePreset = (preset) => {
    userTypingSourceRef.current = false;
    userTypingDestRef.current = false;
    setInputSource(preset.src);
    setInputDest(preset.dst);
    setSource(preset.src);
    setDestination(preset.dst);
    setShowSourceDropdown(false);
    setShowDestDropdown(false);
  };

  const handleSelectSource = (loc) => {
    userTypingSourceRef.current = false;
    setInputSource(loc.name);
    setSource(loc.name);
    setSourceSuggestions([]);
    setShowSourceDropdown(false);
  };

  const handleSelectDest = (loc) => {
    userTypingDestRef.current = false;
    setInputDest(loc.name);
    setDestination(loc.name);
    setDestSuggestions([]);
    setShowDestDropdown(false);
  };

  const handleQuickJunction = (juncName) => {
    userTypingSourceRef.current = false;
    userTypingDestRef.current = false;
    if (!inputSource.trim()) {
      setInputSource(juncName);
      setSource(juncName);
    } else if (!inputDest.trim()) {
      setInputDest(juncName);
      setDestination(juncName);
    } else {
      setInputDest(juncName);
      setDestination(juncName);
    }
    setShowSourceDropdown(false);
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
    userTypingSourceRef.current = false;
    userTypingDestRef.current = false;
    setShowSourceDropdown(false);
    setShowDestDropdown(false);
    const s = inputSource.trim();
    const d = inputDest.trim();
    setSource(s);
    setDestination(d);
    if (s && d) {
      onSubmit(s, d);
    }
  };

  return (
    <div className="glass-panel p-3.5 p-md-4 mb-3.5">
      {/* Panel Header */}
      <div className="d-flex align-items-center justify-content-between mb-3.5 pb-1">
        <h6 className="card-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
          <span
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: 30,
              height: 30,
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid rgba(56, 189, 248, 0.4)'
            }}
          >
            <Navigation size={16} color="#38bdf8" />
          </span>
          <span style={{ fontSize: '0.98rem' }}>Plan & Rank Route</span>
        </h6>
        <span className="badge font-monospace d-flex align-items-center gap-1.5 px-2 py-1" style={{ fontSize: '0.70rem', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
          <Sparkles size={12} color="#38bdf8" />
          <span>AI Engine</span>
        </span>
      </div>

      <form onSubmit={handleFormSubmit}>
        {/* Source Input with Autocomplete & GPS */}
        <div className="mb-3 autocomplete-container" ref={sourceContainerRef}>
          <div className="d-flex align-items-center justify-content-between mb-1.5">
            <label className="form-label small text-secondary mb-0 fw-semibold d-flex align-items-center gap-1.5">
              <span
                className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
                style={{ width: 19, height: 19, fontSize: '0.66rem', background: '#22c55e', fontWeight: 'bold' }}
              >
                A
              </span>
              <span className="text-light">Origin Location</span>
              {sourceLoading && (
                <span className="spinner-border spinner-border-sm text-info ms-1" style={{ width: 11, height: 11 }} />
              )}
            </label>

            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-decoration-none d-flex align-items-center gap-1"
              style={{ fontSize: '0.70rem', color: '#38bdf8' }}
              onClick={handleLocateMe}
              disabled={locating}
              title="Use current GPS position as Origin"
            >
              <LocateFixed size={12} className={locating ? 'spinner-border spinner-border-sm' : ''} />
              <span>{locating ? 'Locating...' : 'Use My GPS'}</span>
            </button>
          </div>

          {geoNotice && (
            <div className="small mb-1.5 text-info font-monospace" style={{ fontSize: '0.68rem' }}>
              ℹ {geoNotice}
            </div>
          )}

          <div className="input-group">
            <input
              type="text"
              className="form-control glass-input py-2 px-3"
              style={{ fontSize: '0.86rem' }}
              placeholder="Search origin (e.g. Central Bus Stand, HPO Junction)..."
              value={inputSource}
              onChange={(e) => {
                userTypingSourceRef.current = true;
                setInputSource(e.target.value);
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
              autoComplete="off"
            />
            {inputSource && (
              <button
                type="button"
                className="btn glass-input-clear-btn px-2.5"
                onClick={() => {
                  userTypingSourceRef.current = false;
                  setInputSource('');
                  setSource('');
                  setSourceSuggestions([]);
                  setShowSourceDropdown(false);
                }}
                title="Clear origin"
                aria-label="Clear origin"
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSource(loc);
                  }}
                  role="option"
                  aria-selected={idx === sourceSelectedIndex}
                >
                  <div className="autocomplete-title">
                    <div className="d-flex align-items-center gap-1.5 text-truncate">
                      <MapPin size={13} color="#22c55e" className="flex-shrink-0" />
                      <span className="text-truncate">{loc.name}</span>
                    </div>
                    {loc.isJunction && (
                      <span
                        className="badge font-monospace flex-shrink-0"
                        style={{
                          fontSize: '0.62rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        ⚡ Junction
                      </span>
                    )}
                  </div>
                  <div className="autocomplete-sub">
                    <span>{loc.municipality || 'Tiruchirappalli'}{loc.country ? `, ${loc.country}` : ''}</span>
                    <span className="autocomplete-coord">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Swap Button */}
        <div className="text-center my-2.5">
          <button
            type="button"
            className="btn glass-swap-btn d-inline-flex align-items-center gap-1.5 shadow-sm"
            onClick={handleSwap}
            title="Swap origin and destination"
          >
            <ArrowUpDown size={13} color="#38bdf8" />
            <span>Swap Direction</span>
          </button>
        </div>

        {/* Destination Input with Autocomplete */}
        <div className="mb-3 autocomplete-container" ref={destContainerRef}>
          <div className="d-flex align-items-center justify-content-between mb-1.5">
            <label className="form-label small mb-0 fw-semibold d-flex align-items-center gap-1.5" style={{ color: '#e2e8f0' }}>
              <span
                className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
                style={{ width: 19, height: 19, fontSize: '0.66rem', background: '#ef4444', fontWeight: 'bold' }}
              >
                B
              </span>
              <span className="text-light">Destination Location</span>
            </label>
            {destLoading && (
              <span className="spinner-border spinner-border-sm text-info" style={{ width: 11, height: 11 }} />
            )}
          </div>

          <div className="input-group">
            <input
              type="text"
              className="form-control glass-input py-2 px-3"
              style={{ fontSize: '0.86rem' }}
              placeholder="Search destination (e.g. Chathiram, Thillai Nagar)..."
              value={inputDest}
              onChange={(e) => {
                userTypingDestRef.current = true;
                setInputDest(e.target.value);
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
              autoComplete="off"
            />
            {inputDest && (
              <button
                type="button"
                className="btn glass-input-clear-btn px-2.5"
                onClick={() => {
                  userTypingDestRef.current = false;
                  setInputDest('');
                  setDestination('');
                  setDestSuggestions([]);
                  setShowDestDropdown(false);
                }}
                title="Clear destination"
                aria-label="Clear destination"
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectDest(loc);
                  }}
                  role="option"
                  aria-selected={idx === destSelectedIndex}
                >
                  <div className="autocomplete-title">
                    <div className="d-flex align-items-center gap-1.5 text-truncate">
                      <MapPin size={13} color="#ef4444" className="flex-shrink-0" />
                      <span className="text-truncate">{loc.name}</span>
                    </div>
                    {loc.isJunction && (
                      <span
                        className="badge font-monospace flex-shrink-0"
                        style={{
                          fontSize: '0.62rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        ⚡ Junction
                      </span>
                    )}
                  </div>
                  <div className="autocomplete-sub">
                    <span>{loc.municipality || 'Tiruchirappalli'}{loc.country ? `, ${loc.country}` : ''}</span>
                    <span className="autocomplete-coord">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Click Guidance Helper */}
        <div
          className="mb-3 px-3 py-2 rounded-2 d-flex align-items-center gap-2"
          style={{
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.14)',
            fontSize: '0.72rem',
            color: '#94a3b8'
          }}
        >
          <Sparkles size={13} color="#38bdf8" className="flex-shrink-0" />
          <span>Click anywhere on the map to set Origin (A) or Destination (B).</span>
        </div>

        {/* Quick Presets & Junction Points */}
        <div className="mb-4 pt-1">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="fw-semibold d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              <Navigation size={12} color="#38bdf8" />
              <span>Trichy Corridor Presets:</span>
            </span>
          </div>

          <div className="d-flex flex-wrap gap-2 mb-3">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="glass-preset-pill"
                onClick={() => handlePreset(p)}
                title={`${p.label} (${p.tag})`}
              >
                {p.shortLabel || p.label}
              </button>
            ))}
          </div>

          <div className="d-flex align-items-center justify-content-between mb-2 mt-3">
            <span className="fw-semibold d-flex align-items-center gap-1.5" style={{ fontSize: '0.70rem', color: '#64748b' }}>
              <Sparkles size={11} color="#38bdf8" />
              <span>Junction Hotspots (Click to set):</span>
            </span>
          </div>

          <div className="d-flex flex-wrap gap-2 mb-1">
            {TRICHY_JUNCTIONS.map((j, idx) => (
              <button
                key={idx}
                type="button"
                className="junction-chip"
                onClick={() => handleQuickJunction(j.name)}
                title={`Click to set ${j.name}`}
              >
                + {j.short}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Guidance Banner */}
        {(!inputSource.trim() || !inputDest.trim()) ? (
          <div
            className="rounded-3 d-flex align-items-center gap-2.5"
            style={{
              marginTop: '1.25rem',
              marginBottom: '1.25rem',
              padding: '12px 16px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px dashed rgba(56, 189, 248, 0.3)',
              fontSize: '0.74rem',
              color: '#94a3b8',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}
          >
            <Sparkles size={15} color="#38bdf8" className="flex-shrink-0" />
            <span>
              {!inputSource.trim() && !inputDest.trim()
                ? 'Select a Trichy preset above or type Origin (A) & Destination (B) to rank routes.'
                : !inputSource.trim()
                ? 'Enter or select an Origin (A) location to continue.'
                : 'Enter or select a Destination (B) location to rank live alternatives.'}
            </span>
          </div>
        ) : (
          <div
            className="rounded-3 d-flex align-items-center gap-2.5"
            style={{
              marginTop: '1.25rem',
              marginBottom: '1.25rem',
              padding: '12px 16px',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              fontSize: '0.74rem',
              color: '#86efac',
              boxShadow: '0 2px 10px rgba(34, 197, 94, 0.1)'
            }}
          >
            <CheckCircle2 size={16} color="#22c55e" className="flex-shrink-0" />
            <span>Ready to evaluate live multi-criteria routes with TomTom & AI forecasting.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-grid gap-3 mb-4" style={{ marginTop: '0.25rem' }}>
          <button
            type="submit"
            className="btn glass-btn-primary d-flex align-items-center justify-content-center gap-2"
            style={{ fontSize: '0.92rem', padding: '12px 18px', borderRadius: '10px' }}
            disabled={loading || !inputSource.trim() || !inputDest.trim()}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Evaluating Live Routes...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>Find & Rank Best Route</span>
              </>
            )}
          </button>

          {hasResults && (
            <button
              type="button"
              className="btn glass-btn-secondary d-flex align-items-center justify-content-center gap-2"
              style={{ fontSize: '0.86rem', padding: '10px 16px', borderRadius: '10px' }}
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
                  <RefreshCw size={14} />
                  <span>Refresh Traffic Now</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Auto Refresh Toggle */}
        {hasResults && (
          <div
            className="pt-3 pb-1 d-flex align-items-center justify-content-between"
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
