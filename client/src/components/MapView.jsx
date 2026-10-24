import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { getTrafficStatus, setTomTomApiKey, removeTomTomApiKey } from '../services/api';

export default function MapView({
  source,
  destination,
  routes,
  selectedRouteId,
  onSelectRoute,
  showTomTomModal,
  setShowTomTomModal,
  onSetLocation
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);
  const simulatedHeatmapGroupRef = useRef(null);
  const trafficFlowLayerRef = useRef(null);
  const incidentsLayerRef = useRef(null);
  const lastFittedSignatureRef = useRef('');
  const onSetLocationRef = useRef(onSetLocation);

  useEffect(() => {
    onSetLocationRef.current = onSetLocation;
  }, [onSetLocation]);


  // Traffic Heatmap Layer State
  const [showTrafficFlow, setShowTrafficFlow] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [trafficOpacity, setTrafficOpacity] = useState(0.85);
  const [showControls, setShowControls] = useState(true);
  const [realKeyConfigured, setRealKeyConfigured] = useState(false);
  const [tileBuster, setTileBuster] = useState(Date.now());

  // Modal State for configuring TomTom Live Key (local fallback or parent controlled)
  const [localShowKeyModal, setLocalShowKeyModal] = useState(false);
  const showKeyModal = showTomTomModal !== undefined ? showTomTomModal : localShowKeyModal;
  const setShowKeyModal = setShowTomTomModal || setLocalShowKeyModal;
  const [tomTomKeyInput, setTomTomKeyInput] = useState('');
  const [keyStatusMsg, setKeyStatusMsg] = useState(null);
  const [keyLoading, setKeyLoading] = useState(false);

  // Check backend traffic status on mount
  useEffect(() => {
    checkTrafficStatus();
  }, []);

  const checkTrafficStatus = async () => {
    try {
      const data = await getTrafficStatus();
      if (data && data.success) {
        setRealKeyConfigured(Boolean(data.realKeyConfigured));
      }
    } catch {
      setRealKeyConfigured(false);
    }
  };

  // Initialize Leaflet map instance once
  useEffect(() => {
    if (!mapRef.current) return;

    let resizeObserver = null;
    let handleScrollOrResize = null;
    let resizeTimer = null;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [10.7905, 78.7047],
        zoom: 8,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        wheelDebounceTime: 40,
        wheelPxPerZoomLevel: 60,
        trackResize: true
      });

      // Base OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        zIndex: 1
      }).addTo(map);

      // Dedicated layer groups
      simulatedHeatmapGroupRef.current = L.layerGroup().addTo(map);
      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Interactive map click listener: Pin location directly on map
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const latStr = lat.toFixed(5);
        const lngStr = lng.toFixed(5);

        const container = document.createElement('div');
        container.style.padding = '4px';
        container.style.textAlign = 'center';
        container.innerHTML = `
          <div style="font-weight: 700; font-size: 0.82rem; margin-bottom: 2px; color: #f8fafc;">
            📍 Picked Location
          </div>
          <div style="font-size: 0.72rem; color: #38bdf8; font-family: monospace; margin-bottom: 8px;">
            ${latStr}, ${lngStr}
          </div>
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button id="set-origin-btn" style="background: #22c55e; border: none; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; cursor: pointer;">
              Set Origin (A)
            </button>
            <button id="set-dest-btn" style="background: #ef4444; border: none; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; cursor: pointer;">
              Set Dest (B)
            </button>
          </div>
        `;

        L.popup({ minWidth: 170 })
          .setLatLng(e.latlng)
          .setContent(container)
          .openOn(map);

        container.querySelector('#set-origin-btn')?.addEventListener('click', () => {
          if (onSetLocationRef.current) onSetLocationRef.current('source', `${latStr}, ${lngStr}`);
          map.closePopup();
        });
        container.querySelector('#set-dest-btn')?.addEventListener('click', () => {
          if (onSetLocationRef.current) onSetLocationRef.current('destination', `${latStr}, ${lngStr}`);
          map.closePopup();
        });
      });


      // Invalidate map size on any container resize to prevent grey tiles, but NOT during zoom animations
      if (typeof ResizeObserver !== 'undefined' && mapRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current && !mapInstanceRef.current._animatingZoom) {
            mapInstanceRef.current.invalidateSize({ animate: false });
          }
        });
        resizeObserver.observe(mapRef.current);
      }

      handleScrollOrResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (mapInstanceRef.current && !mapInstanceRef.current._animatingZoom) {
            mapInstanceRef.current.invalidateSize({ animate: false });
          }
        }, 200);
      };
      window.addEventListener('resize', handleScrollOrResize);
    }

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (handleScrollOrResize) {
        window.removeEventListener('resize', handleScrollOrResize);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        lastFittedSignatureRef.current = ''; // Reset so remounted map in StrictMode fits bounds properly
      }
    };
  }, []);

  // Ensure map size is recalculated whenever routes change
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        if (mapInstanceRef.current && !mapInstanceRef.current._animatingZoom) {
          mapInstanceRef.current.invalidateSize({ animate: false });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [routes]);

  // Manage Live TomTom Traffic Flow Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (trafficFlowLayerRef.current) {
      map.removeLayer(trafficFlowLayerRef.current);
      trafficFlowLayerRef.current = null;
    }

    // Only mount TomTom raster tiles if user enabled it and real key exists
    if (showTrafficFlow && realKeyConfigured) {
      const flowLayer = L.tileLayer(`/api/traffic/tiles/{z}/{x}/{y}.png?b=${tileBuster}`, {
        opacity: trafficOpacity,
        maxZoom: 19,
        zIndex: 10,
        attribution: 'Traffic Flow &copy; TomTom'
      });

      flowLayer.addTo(map);
      trafficFlowLayerRef.current = flowLayer;
    }

    return () => {
      if (trafficFlowLayerRef.current && map) {
        map.removeLayer(trafficFlowLayerRef.current);
      }
    };
  }, [showTrafficFlow, realKeyConfigured, trafficOpacity, tileBuster]);

  // Manage TomTom Traffic Incidents Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (incidentsLayerRef.current) {
      map.removeLayer(incidentsLayerRef.current);
      incidentsLayerRef.current = null;
    }

    if (showIncidents && realKeyConfigured) {
      const incLayer = L.tileLayer(`/api/traffic/incidents/{z}/{x}/{y}.png?b=${tileBuster}`, {
        opacity: 0.95,
        maxZoom: 19,
        zIndex: 11
      });

      incLayer.addTo(map);
      incidentsLayerRef.current = incLayer;
    }

    return () => {
      if (incidentsLayerRef.current && map) {
        map.removeLayer(incidentsLayerRef.current);
      }
    };
  }, [showIncidents, realKeyConfigured, tileBuster]);

  // Render Regional Live Traffic Heatmap & Congestion Corridors
  useEffect(() => {
    const map = mapInstanceRef.current;
    const simGroup = simulatedHeatmapGroupRef.current;
    if (!map || !simGroup) return;

    simGroup.clearLayers();

    if (!showTrafficFlow) return;

    // When running without TomTom key, render realistic regional street traffic flow network
    if (!realKeyConfigured && Array.isArray(routes) && routes.length > 0) {
      routes.forEach((route) => {
        if (!Array.isArray(route.geometry) || route.geometry.length < 5) return;
        const pts = route.geometry;
        const len = pts.length;

        // Draw glowing traffic heatmap segments directly on top of road geometry
        // Segment 1: Origin approach (Free flow - Green)
        const seg1Pts = pts.slice(0, Math.floor(len * 0.35));
        L.polyline(seg1Pts, {
          color: '#22c55e',
          weight: 10,
          opacity: trafficOpacity * 0.7,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(simGroup);

        // Segment 2: Mid-corridor / bottleneck zone
        const seg2Pts = pts.slice(Math.floor(len * 0.3), Math.floor(len * 0.75));
        let midColor = '#22c55e';
        if (route.trafficSeverity === 'heavy') midColor = '#ef4444';
        else if (route.trafficSeverity === 'moderate') midColor = '#f59e0b';

        L.polyline(seg2Pts, {
          color: midColor,
          weight: 12,
          opacity: trafficOpacity * 0.85,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(simGroup);

        // Segment 3: Destination approach
        const seg3Pts = pts.slice(Math.floor(len * 0.7));
        L.polyline(seg3Pts, {
          color: route.trafficSeverity === 'heavy' ? '#f59e0b' : '#22c55e',
          weight: 10,
          opacity: trafficOpacity * 0.7,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(simGroup);

        // Bottleneck congestion glow marker
        const bottleneckIndex = Math.floor(len * 0.52);
        const bottleneckPt = pts[bottleneckIndex];
        if (bottleneckPt && route.trafficSeverity !== 'low') {
          const isHeavy = route.trafficSeverity === 'heavy';
          
          // Outer pulsating radiant glow
          L.circleMarker(bottleneckPt, {
            radius: isHeavy ? 32 : 24,
            color: isHeavy ? '#ef4444' : '#f59e0b',
            weight: 0,
            fillColor: isHeavy ? '#ef4444' : '#f59e0b',
            fillOpacity: trafficOpacity * 0.35
          }).addTo(simGroup);

          // Inner intense core
          L.circleMarker(bottleneckPt, {
            radius: isHeavy ? 18 : 14,
            color: '#ffffff',
            weight: 2,
            fillColor: isHeavy ? '#dc2626' : '#d97706',
            fillOpacity: trafficOpacity * 0.9
          })
            .bindTooltip(`<strong>${isHeavy ? '🔴 Heavy Congestion Bottleneck' : '🟡 Moderate Delay Zone'}</strong><br/>Delay: +${Math.round(route.trafficDelaySeconds / 60)} min slowdown`, { sticky: true })
            .addTo(simGroup);
        }
      });
    }
  }, [showTrafficFlow, showIncidents, realKeyConfigured, routes, trafficOpacity]);

  // Update map pins and route polylines when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Add Source Marker (Green Pin A)
    if (source && source.coordinates) {
      const srcLatLng = [source.coordinates.lat, source.coordinates.lng];
      bounds.extend(srcLatLng);

      const srcIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="radar-beacon" style="width: 36px; height: 36px;">
            <div class="radar-halo radar-halo-origin"></div>
            <div style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 2.5px solid white; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.6); font-size: 14px; position: relative; z-index: 2;">A</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      L.marker(srcLatLng, { icon: srcIcon, zIndexOffset: 500 })
        .bindPopup(`<strong>Origin (A)</strong><br/>${source.name || 'Start Point'}`)
        .addTo(group);
    }

    // 2. Add Destination Marker (Red Pin B with pulsing radar halo)
    if (destination && destination.coordinates) {
      const dstLatLng = [destination.coordinates.lat, destination.coordinates.lng];
      bounds.extend(dstLatLng);

      const dstIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="radar-beacon" style="width: 36px; height: 36px;">
            <div class="radar-halo radar-halo-dest"></div>
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 2.5px solid white; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.6); font-size: 14px; position: relative; z-index: 2;">B</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      L.marker(dstLatLng, { icon: dstIcon, zIndexOffset: 500 })
        .bindPopup(`<strong>Destination (B)</strong><br/>${destination.name || 'End Point'}`)
        .addTo(group);
    }


    // 3. Render Route Polylines with Vivid Traffic Colors
    if (Array.isArray(routes) && routes.length > 0) {
      // Sort routes so that non-selected are rendered first, and selected / recommended on top
      const sortedRoutes = [...routes].sort((a, b) => {
        if (a.id === selectedRouteId) return 1;
        if (b.id === selectedRouteId) return -1;
        if (a.isRecommended) return 1;
        if (b.isRecommended) return -1;
        return 0;
      });

      sortedRoutes.forEach((route) => {
        if (!Array.isArray(route.geometry) || route.geometry.length === 0) return;

        const isSelected = route.id === selectedRouteId;
        const isRecommended = route.isRecommended;

        // Vivid distinct traffic colors:
        // Rank 1 / Low Traffic: Bright Green (#22c55e)
        // Moderate: Warm Amber Yellow (#eab308)
        // Heavy: Vivid Crimson Red (#ef4444)
        let routeColor = route.trafficColor || '#22c55e';
        if (isRecommended && (!isSelected || route.trafficSeverity === 'low')) {
          routeColor = '#22c55e';
        } else if (route.trafficSeverity === 'heavy') {
          routeColor = '#ef4444';
        } else if (route.trafficSeverity === 'moderate') {
          routeColor = '#eab308';
        }

        // Selected Route Outer Glow Halo
        if (isSelected) {
          L.polyline(route.geometry, {
            color: '#0284c7',
            weight: 12,
            opacity: 0.45,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(group);
        }

        // Main Solid Route Line
        const polyline = L.polyline(route.geometry, {
          color: routeColor,
          weight: isSelected ? 8 : (isRecommended ? 6 : 5),
          opacity: isSelected ? 1.0 : 0.85,
          dashArray: null, // Fully solid lines for crisp visual distinction!
          lineCap: 'round',
          lineJoin: 'round'
        });

        polyline.on('click', () => {
          onSelectRoute(route.id);
        });

        polyline.bindTooltip(
          `<strong>${isRecommended ? '★ Recommended Route (#1)' : `Alternative Route #${route.rank}`}</strong><br/>` +
          `Traffic: <span style="color: ${routeColor}; font-weight: bold;">${route.trafficLabel}</span> (+${Math.round(route.trafficDelaySeconds / 60)} min delay)<br/>` +
          `Duration: ${Math.round(route.estimatedDurationSeconds / 60)} min | Distance: ${(route.distanceMeters / 1000).toFixed(1)} km`,
          { sticky: true }
        );

        polyline.addTo(group);

        // Add clean, non-overlapping clickable route badge pills
        let positionRatio = 0.50;
        if (route.rank === 1) positionRatio = 0.32;
        else if (route.rank === 2) positionRatio = 0.50;
        else if (route.rank === 3) positionRatio = 0.68;

        const badgeIdx = Math.floor(route.geometry.length * positionRatio);
        const badgePt = route.geometry[badgeIdx];
        if (badgePt) {
          let badgeText = '★ #1 Recommended';
          if (route.rank > 1) {
            const delayM = Math.round((route.trafficDelaySeconds || 0) / 60);
            const label = route.trafficLabel || (route.trafficSeverity === 'heavy' ? 'Heavy' : (route.trafficSeverity === 'moderate' ? 'Moderate' : 'Normal'));
            badgeText = `#${route.rank} ${label}${delayM > 0 ? ` (+${delayM}m)` : ''}`;
          }

          const badgeIcon = L.divIcon({
            className: 'route-label-badge',
            html: `<div style="background: ${routeColor}; color: #ffffff; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; border: 2px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.35); cursor: pointer; white-space: nowrap; text-align: center; letter-spacing: 0.2px;">
              ${badgeText}
            </div>`,
            iconSize: [130, 24],
            iconAnchor: [65, 12]
          });

          const badgeMarker = L.marker(badgePt, { icon: badgeIcon, zIndexOffset: isSelected ? 400 : 250 });
          badgeMarker.on('click', () => onSelectRoute(route.id));
          badgeMarker.addTo(group);
        }

        // Bottleneck radar beacon if significant congestion exists on selected route (> 4 min delay)
        if (isSelected && (route.trafficDelaySeconds || 0) >= 240 && route.geometry.length > 8) {
          const bottleneckIdx = Math.floor(route.geometry.length * 0.58);
          const bottleneckPt = route.geometry[bottleneckIdx];
          if (bottleneckPt) {
            const bottleneckIcon = L.divIcon({
              className: 'custom-bottleneck-pin',
              html: `
                <div class="radar-beacon" style="width: 32px; height: 32px;">
                  <div class="radar-halo radar-halo-bottleneck"></div>
                  <div style="background: #f59e0b; color: #000; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 2px solid white; box-shadow: 0 0 12px rgba(245, 158, 11, 0.85); font-size: 11px; position: relative; z-index: 2;" title="Bottleneck Corridor">
                    ⚠️
                  </div>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });
            const bMarker = L.marker(bottleneckPt, { icon: bottleneckIcon, zIndexOffset: 450 });
            bMarker.bindPopup(`<strong>Active Congestion Bottleneck</strong><br/>Estimated Delay: +${Math.round(route.trafficDelaySeconds / 60)} min<br/>Traffic Status: ${route.trafficLabel || 'Heavy Congestion'}`);
            bMarker.addTo(group);
          }
        }

        route.geometry.forEach(pt => bounds.extend(pt));
      });
    }


    const routeSignature = `${source?.coordinates?.lat || ''},${source?.coordinates?.lng || ''}->${destination?.coordinates?.lat || ''},${destination?.coordinates?.lng || ''}->${routes?.length || 0}`;
    if (bounds.isValid() && lastFittedSignatureRef.current !== routeSignature) {
      lastFittedSignatureRef.current = routeSignature;
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [source, destination, routes, selectedRouteId, onSelectRoute]);

  // TomTom Key Handlers
  const handleSaveTomTomKey = async () => {
    if (!tomTomKeyInput.trim()) return;
    setKeyLoading(true);
    setKeyStatusMsg(null);
    try {
      const res = await setTomTomApiKey(tomTomKeyInput.trim());
      if (res && res.success) {
        setRealKeyConfigured(true);
        setKeyStatusMsg({ success: true, text: 'TomTom Key verified! Live traffic raster tiles are now streaming.' });
        setTileBuster(Date.now());
        setTimeout(() => setShowKeyModal(false), 1400);
      } else {
        setKeyStatusMsg({ success: false, text: res.error?.message || 'Key rejected by TomTom API.' });
      }
    } catch (err) {
      setKeyStatusMsg({ success: false, text: err.message || 'Failed to connect to server.' });
    } finally {
      setKeyLoading(false);
    }
  };

  const handleResetToDemo = async () => {
    setKeyLoading(true);
    try {
      await removeTomTomApiKey();
      setRealKeyConfigured(false);
      setTomTomKeyInput('');
      setTileBuster(Date.now());
      setKeyStatusMsg({ success: true, text: 'Switched back to synthetic demo traffic mode.' });
      setTimeout(() => setShowKeyModal(false), 1200);
    } catch (err) {
      setKeyStatusMsg({ success: false, text: err.message });
    } finally {
      setKeyLoading(false);
    }
  };

  return (
    <div className="position-relative w-100 h-100 rounded-3 overflow-hidden" style={{ border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-glass)' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '480px' }} />

      {/* Floating Traffic Heatmap Overlay Controls */}
      <div
        className="position-absolute top-0 end-0 m-3 rounded-3 p-3"
        style={{
          zIndex: 1000,
          backgroundColor: 'rgba(11, 17, 32, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
          minWidth: 245,
          maxWidth: 285,
          color: '#f8fafc'
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <span
              className={`rounded-circle d-inline-block ${showTrafficFlow ? (realKeyConfigured ? 'bg-success' : 'bg-warning') : 'bg-secondary'}`}
              style={{ width: 8, height: 8, boxShadow: showTrafficFlow ? '0 0 8px currentColor' : 'none' }}
            />
            <strong style={{ fontSize: '0.82rem', letterSpacing: '0.2px' }} className="text-light">
              Traffic Heatmap
            </strong>
          </div>
          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="glass-btn-secondary px-2 py-0"
              style={{ fontSize: '0.68rem', lineHeight: '20px' }}
              onClick={() => {
                if (mapInstanceRef.current) {
                  const b = L.latLngBounds([]);
                  if (source?.coordinates) b.extend([source.coordinates.lat, source.coordinates.lng]);
                  if (destination?.coordinates) b.extend([destination.coordinates.lat, destination.coordinates.lng]);
                  if (Array.isArray(routes)) {
                    routes.forEach(r => r.geometry?.forEach(pt => b.extend(pt)));
                  }
                  if (b.isValid()) {
                    mapInstanceRef.current.fitBounds(b, { padding: [40, 40], maxZoom: 14 });
                  }
                }
              }}
              title="Recenter map to all routes"
            >
              ⛶ Recenter
            </button>
            <button
              type="button"
              className="glass-close-btn p-0 px-1"
              onClick={() => setShowControls(!showControls)}
              title="Toggle layer settings"
            >
              <span style={{ fontSize: '0.75rem' }}>{showControls ? '▲' : '▼'}</span>
            </button>
          </div>
        </div>

        {/* Live Provider Status Badge */}
        <div className="mb-2">
          {realKeyConfigured ? (
            <span className="badge rounded-pill d-inline-flex align-items-center gap-1" style={{ fontSize: '0.68rem', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#86efac' }}>
              <span className="pulse-active rounded-circle bg-success d-inline-block" style={{ width: 6, height: 6 }}></span> Live TomTom Tiles Active
            </span>
          ) : (
            <span className="badge rounded-pill d-inline-flex align-items-center gap-1" style={{ fontSize: '0.68rem', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fde047' }}>
              <span>●</span> Traffic Flow Heatmap Active
            </span>
          )}
        </div>

        {/* Quick Toggles */}
        <div className="form-check form-switch mb-1">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="trafficFlowSwitch"
            checked={showTrafficFlow}
            onChange={(e) => setShowTrafficFlow(e.target.checked)}
          />
          <label className="form-check-label text-light fw-semibold" htmlFor="trafficFlowSwitch" style={{ fontSize: '0.75rem' }}>
            Traffic Heatmap Layer
          </label>
        </div>

        <div className="form-check form-switch mb-2">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="incidentsSwitch"
            checked={showIncidents}
            onChange={(e) => setShowIncidents(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="incidentsSwitch" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Bottleneck Warnings
          </label>
        </div>

        {/* Layer Controls & TomTom Key Config */}
        {showControls && (
          <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                <span>Heatmap Opacity</span>
                <span className="fw-bold text-light">{Math.round(trafficOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                className="form-range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={trafficOpacity}
                onChange={(e) => setTrafficOpacity(parseFloat(e.target.value))}
              />
            </div>

            <button
              type="button"
              className="glass-btn-secondary w-100 py-1 d-flex align-items-center justify-content-center gap-1"
              style={{ fontSize: '0.72rem' }}
              onClick={() => {
                setKeyStatusMsg(null);
                setShowKeyModal(true);
              }}
            >
              <span>⚙️</span> {realKeyConfigured ? 'Update TomTom Key' : 'Connect Live TomTom Key'}
            </button>
          </div>
        )}
      </div>

      {/* TomTom Key Configuration Modal */}
      {showKeyModal && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 glass-modal-backdrop" style={{ zIndex: 2000 }}>
          <div className="glass-modal-content p-4 w-100" style={{ maxWidth: 440 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="m-0 fw-bold text-light d-flex align-items-center gap-2">
                <span style={{ color: 'var(--accent-cyan)' }}>⚡</span> TomTom Traffic Layer Setup
              </h6>
              <button type="button" className="glass-close-btn" onClick={() => setShowKeyModal(false)}>✕</button>
            </div>
            <p className="small mb-3" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              Enter your TomTom Developer API Key to stream real-time traffic flow raster tiles directly onto Leaflet.
              SmartRoute AI proxies all tile requests server-side to keep your key secure.
            </p>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-light mb-1">TomTom API Key</label>
              <input
                type="text"
                className="form-control form-control-sm font-monospace glass-input"
                placeholder="Paste your TomTom API Key here..."
                value={tomTomKeyInput}
                onChange={(e) => setTomTomKeyInput(e.target.value)}
              />
              <div className="form-text" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                Free keys are available at <a href="https://developer.tomtom.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>developer.tomtom.com</a>
              </div>
            </div>

            {keyStatusMsg && (
              <div className={`p-2 mb-3 small ${keyStatusMsg.success ? 'glass-alert-success' : 'glass-alert-danger'}`} style={{ fontSize: '0.75rem' }}>
                {keyStatusMsg.text}
              </div>
            )}

            <div className="d-flex gap-2 justify-content-end mt-4">
              {realKeyConfigured && (
                <button
                  type="button"
                  className="glass-btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', color: '#fca5a5' }}
                  onClick={handleResetToDemo}
                  disabled={keyLoading}
                >
                  Revert to Demo
                </button>
              )}
              <button
                type="button"
                className="glass-btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
                onClick={() => setShowKeyModal(false)}
                disabled={keyLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="glass-btn-primary btn-sm px-3"
                style={{ fontSize: '0.75rem' }}
                onClick={handleSaveTomTomKey}
                disabled={keyLoading || !tomTomKeyInput.trim()}
              >
                {keyLoading ? 'Validating...' : 'Activate Live Tiles'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
