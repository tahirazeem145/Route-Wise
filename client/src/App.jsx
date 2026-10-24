import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import StatusBanner from './components/StatusBanner';
import RouteSearchForm from './components/RouteSearchForm';
import RouteCardList from './components/RouteCardList';
import MapView from './components/MapView';
import TrafficLegend from './components/TrafficLegend';
import ApiKeyModal from './components/ApiKeyModal';
import ApiDocsModal from './components/ApiDocsModal';
import { recommendRoutes, refreshRoutes, getHealth, getStoredApiKey } from './services/api';

export default function App() {
  const [source, setSource] = useState('Tiruchirappalli');
  const [destination, setDestination] = useState('Coimbatore');
  const [weights, setWeights] = useState({ weightTime: 0.5, weightDelay: 0.3, weightDistance: 0.2 });

  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [sourceMeta, setSourceMeta] = useState(null);
  const [destinationMeta, setDestinationMeta] = useState(null);
  const [dataSource, setDataSource] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);

  const [serverHealthy, setServerHealthy] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [apiKeyPrefix, setApiKeyPrefix] = useState('');

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(60);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('smartroute_theme') || 'indigo';
  });

  const inFlightRef = useRef(false);

  const handleSelectTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('smartroute_theme', newTheme);
    if (newTheme === 'indigo') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  // Initialize key prefix, theme, & verify backend health on startup
  useEffect(() => {
    if (theme && theme !== 'indigo') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    const rawKey = getStoredApiKey();
    setApiKeyPrefix(rawKey ? rawKey.slice(0, 8) + '...' : '');

    getHealth()
      .then((data) => {
        if (data && data.status === 'healthy') {
          setServerHealthy(true);
        }
      })
      .catch(() => setServerHealthy(false));

    // Automatically load initial route for instant visual demo
    handleFindRoutes('Tiruchirappalli', 'Coimbatore');
  }, []);

  // Primary route search handler
  const handleFindRoutes = async (src = source, dst = destination) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    setIsStale(false);

    try {
      const data = await recommendRoutes(src, dst, weights);
      setRoutes(data.routes || []);
      setSelectedRouteId(data.recommendedRouteId || (data.routes[0] && data.routes[0].id));
      setSourceMeta(data.source);
      setDestinationMeta(data.destination);
      setDataSource(data.dataSource || 'tomtom');
      setUpdatedAt(data.updatedAt || new Date().toISOString());
      setRefreshCountdown(60);
    } catch (err) {
      setError(err.message || 'Failed to calculate route recommendations.');
      setAutoRefreshEnabled(false);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  // Periodic refresh handler
  const handleRefresh = async () => {
    if (inFlightRef.current || routes.length === 0) return;
    inFlightRef.current = true;
    setRefreshing(true);

    try {
      const data = await refreshRoutes(source, destination, weights);
      setRoutes(data.routes || []);
      if (!selectedRouteId && data.recommendedRouteId) {
        setSelectedRouteId(data.recommendedRouteId);
      }
      setUpdatedAt(data.updatedAt || new Date().toISOString());
      setIsStale(false);
      setRefreshCountdown(60);
    } catch (err) {
      setIsStale(true);
      // If unauthorized, turn off auto-refresh to avoid polling loops
      if (err.status === 401) {
        setError(err.message);
        setAutoRefreshEnabled(false);
      }
    } finally {
      setRefreshing(false);
      inFlightRef.current = false;
    }
  };

  // Auto-refresh 60-second timer
  useEffect(() => {
    if (!autoRefreshEnabled || routes.length === 0) return;

    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          handleRefresh();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, routes, source, destination, weights]);

  const handleKeyUpdated = (newKey) => {
    setApiKeyPrefix(newKey ? newKey.slice(0, 8) + '...' : '');
    handleRefresh();
  };

  return (
    <div className="d-flex flex-column min-vh-100 text-light">
      <Navbar
        onOpenDocs={() => setShowDocsModal(true)}
        onOpenApiKey={() => setShowApiKeyModal(true)}
        serverHealthy={serverHealthy}
        apiKeyPrefix={apiKeyPrefix}
        currentTheme={theme}
        onSelectTheme={handleSelectTheme}
      />

      <div className="container-fluid py-3 px-3 flex-grow-1">
        <StatusBanner
          error={error}
          isStale={isStale}
          dataSource={dataSource}
          onDismissError={() => setError(null)}
        />

        <div className="row g-4">
          {/* Left Panel: Inputs & Route Cards */}
          <div className="col-lg-5 col-xl-5 d-flex flex-column">
            <RouteSearchForm
              source={source}
              setSource={setSource}
              destination={destination}
              setDestination={setDestination}
              onSubmit={() => handleFindRoutes(source, destination)}
              onRefresh={handleRefresh}
              loading={loading}
              refreshing={refreshing}
              hasResults={routes.length > 0}
              autoRefreshEnabled={autoRefreshEnabled}
              setAutoRefreshEnabled={setAutoRefreshEnabled}
              refreshCountdown={refreshCountdown}
              weights={weights}
              setWeights={setWeights}
            />

            <RouteCardList
              routes={routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={(id) => setSelectedRouteId(id)}
              updatedAt={updatedAt}
              loading={loading}
            />
          </div>

          {/* Right Panel: Interactive Map & Legend */}
          <div className="col-lg-7 col-xl-7 d-flex flex-column sticky-map-column">
            <div className="glass-panel p-3 mb-2 d-flex align-items-center justify-content-between">
              <h6 className="card-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                <span
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: 26,
                    height: 26,
                    background: 'rgba(56, 189, 248, 0.2)',
                    border: '1px solid rgba(56, 189, 248, 0.4)'
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                    <line x1="8" y1="2" x2="8" y2="18"/>
                    <line x1="16" y1="6" x2="16" y2="22"/>
                  </svg>
                </span>
                <span>Live Interactive Route & Heatmap</span>
              </h6>
              <span className="badge font-monospace" style={{ fontSize: '0.68rem', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                TomTom Telemetry
              </span>
            </div>

            <div className="map-panel-container flex-grow-1 mb-2">
              <MapView
                source={sourceMeta}
                destination={destinationMeta}
                routes={routes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={(id) => setSelectedRouteId(id)}
              />
            </div>

            <TrafficLegend />
          </div>
        </div>
      </div>

      <ApiKeyModal
        show={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onKeyUpdated={handleKeyUpdated}
      />

      <ApiDocsModal
        show={showDocsModal}
        onClose={() => setShowDocsModal(false)}
      />
    </div>
  );
}
