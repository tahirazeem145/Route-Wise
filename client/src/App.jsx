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
import ReportIncidentModal from './components/ReportIncidentModal';
import AuthorityDashboard from './components/AuthorityDashboard';
import { Map } from 'lucide-react';
import { recommendRoutes, refreshRoutes, getHealth, getStoredApiKey } from './services/api';


export default function App() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
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
  const [showTomTomModal, setShowTomTomModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAuthorityModal, setShowAuthorityModal] = useState(false);
  const [reportCoords, setReportCoords] = useState({ lat: 11.0168, lng: 76.9660 });
  const [incidentRefreshTrigger, setIncidentRefreshTrigger] = useState(0);
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

  // Auto-refresh 60-second countdown timer
  useEffect(() => {
    if (!autoRefreshEnabled || routes.length === 0) return;

    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          return 0; // Signal trigger
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, routes.length]);

  // Trigger refresh when countdown reaches 0 outside of state updater
  useEffect(() => {
    if (autoRefreshEnabled && refreshCountdown === 0 && routes.length > 0) {
      handleRefresh();
      setRefreshCountdown(60);
    }
  }, [refreshCountdown, autoRefreshEnabled, routes.length]);

  const handleKeyUpdated = (newKey) => {
    setApiKeyPrefix(newKey ? newKey.slice(0, 8) + '...' : '');
    handleRefresh();
  };

  const handleOpenReportModal = (coords) => {
    if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      setReportCoords(coords);
    } else if (sourceMeta?.coordinates) {
      setReportCoords(sourceMeta.coordinates);
    } else {
      setReportCoords({ lat: 11.0168, lng: 76.9660 });
    }
    setShowReportModal(true);
  };

  const handleIncidentReported = () => {
    setIncidentRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="d-flex flex-column min-vh-100 text-light">
      <Navbar
        onOpenDocs={() => setShowDocsModal(true)}
        onOpenApiKey={() => setShowApiKeyModal(true)}
        onOpenReportModal={() => handleOpenReportModal()}
        onOpenAuthorityDashboard={() => setShowAuthorityModal(true)}
        serverHealthy={serverHealthy}
        apiKeyPrefix={apiKeyPrefix}
        currentTheme={theme}
        onSelectTheme={handleSelectTheme}
      />

      <div className="container-fluid py-3 px-3 flex-grow-1">
        <StatusBanner
          serverHealthy={serverHealthy}
          error={error}
          isStale={isStale}
          dataSource={dataSource}
          onDismissError={() => setError(null)}
          onOpenTomTomKey={() => setShowTomTomModal(true)}
          onOpenDocs={() => setShowDocsModal(true)}
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
              origin={sourceMeta?.coordinates}
              destination={destinationMeta?.coordinates}
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
                  <Map size={15} color="#38bdf8" />
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
                showTomTomModal={showTomTomModal}
                setShowTomTomModal={setShowTomTomModal}
                onSetLocation={(type, val) => {
                  if (type === 'source') setSource(val);
                  if (type === 'destination') setDestination(val);
                }}
                onOpenReportModal={handleOpenReportModal}
                incidentRefreshTrigger={incidentRefreshTrigger}
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

      <ReportIncidentModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        defaultCoords={reportCoords}
        onIncidentReported={handleIncidentReported}
      />

      <AuthorityDashboard
        isOpen={showAuthorityModal}
        onClose={() => setShowAuthorityModal(false)}
        onIncidentResolved={() => setIncidentRefreshTrigger(prev => prev + 1)}
      />
    </div>
  );
}
