import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Polygon as LeafletPolygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Compass, Crosshair, ZoomIn, ZoomOut, Maximize2, MapPin, Copy, Check, Layers, Globe } from 'lucide-react';
import { DetectionItem } from '../types/detection';
import { INDIA_CENTER_COORDINATES, DEFAULT_INDIA_ZOOM, OSM_TILE_URL, OSM_ATTRIBUTION } from './leafletHelper';

// Global safeguard against Leaflet accessing detached/unmounted DOM elements during React 19 StrictMode transitions
if (typeof window !== 'undefined' && L && L.DomUtil) {
  const domUtil = L.DomUtil as unknown as {
    getPosition: (el?: HTMLElement | null) => L.Point;
    setPosition: (el?: HTMLElement | null, point?: L.Point) => void;
  };
  const originalGetPosition = domUtil.getPosition;
  domUtil.getPosition = function (el?: HTMLElement | null): L.Point {
    if (!el) {
      return new L.Point(0, 0);
    }
    try {
      return originalGetPosition.call(this, el) || new L.Point(0, 0);
    } catch {
      return ((el as unknown as { _leaflet_pos?: L.Point })._leaflet_pos) || new L.Point(0, 0);
    }
  };

  const originalSetPosition = domUtil.setPosition;
  domUtil.setPosition = function (el?: HTMLElement | null, point?: L.Point): void {
    if (!el || !point) return;
    try {
      originalSetPosition.call(this, el, point);
    } catch {
      // ignore detached elements
    }
  };
}

interface MarineMapProps {
  detections: DetectionItem[];
  selectedDetectionId: string | null;
  onSelectDetection: (id: string | null) => void;
  className?: string;
}

// Controller component to smoothly pan/fit bounds when detections or selection change
const MapViewController: React.FC<{
  detections: DetectionItem[];
  selectedDetectionId: string | null;
  indiaCenterTrigger: number;
}> = ({ detections, selectedDetectionId, indiaCenterTrigger }) => {
  const map = useMap();
  const isMountedRef = useRef(true);
  const prevIndiaTrigger = useRef(indiaCenterTrigger);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      try {
        map.stop(); // Stop ongoing pan/zoom animations before unmounting
      } catch {
        // ignore
      }
    };
  }, [map]);

  // Invalidate size once container layout stabilizes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current && map) {
        try {
          map.invalidateSize();
        } catch {
          // ignore
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  // Manual Trigger to Center on India [20.5937, 78.9629], zoom 5
  useEffect(() => {
    if (indiaCenterTrigger !== prevIndiaTrigger.current) {
      prevIndiaTrigger.current = indiaCenterTrigger;
      if (isMountedRef.current && map) {
        try {
          map.flyTo(INDIA_CENTER_COORDINATES, DEFAULT_INDIA_ZOOM, {
            duration: 1.2,
          });
        } catch {
          map.setView(INDIA_CENTER_COORDINATES, DEFAULT_INDIA_ZOOM);
        }
      }
    }
  }, [indiaCenterTrigger, map]);

  useEffect(() => {
    if (!isMountedRef.current || !map) return;

    try {
      if (selectedDetectionId) {
        const selected = detections.find((d) => d.id === selectedDetectionId);
        if (selected && Number.isFinite(selected.latitude) && Number.isFinite(selected.longitude)) {
          map.flyTo([selected.latitude, selected.longitude], 17, {
            duration: 0.8,
          });
        }
      } else if (detections.length > 0) {
        const validCoords = detections
          .filter((d) => Number.isFinite(d.latitude) && Number.isFinite(d.longitude))
          .map((d) => [d.latitude, d.longitude] as [number, number]);

        if (validCoords.length > 0) {
          const bounds = L.latLngBounds(validCoords);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
          }
        }
      }
    } catch {
      // ignore animation race conditions
    }
  }, [detections, selectedDetectionId, map]);

  return null;
};

// Create tactical pulse radar icons using L.divIcon
const createCustomMarkerIcon = (detection: DetectionItem, isSelected: boolean) => {
  const isHigh = detection.priority === 'high';
  const isMedium = detection.priority === 'medium';

  const colorClass = isSelected
    ? 'bg-[#1BDFC8] border-[#FFFFFF] text-[#0A111E] ring-4 ring-[#1BDFC8]/50'
    : isHigh
    ? 'bg-[#1BDFC8] border-[#0A111E] text-[#0A111E]'
    : isMedium
    ? 'bg-[#2E96DB] border-[#0A111E] text-[#FFFFFF]'
    : 'bg-[#93A8BC] border-[#0A111E] text-[#0A111E]';

  const pulseColor = isSelected
    ? '#1BDFC8'
    : isHigh
    ? '#1BDFC8'
    : isMedium
    ? '#2E96DB'
    : '#93A8BC';

  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
      <!-- Radar Pulse Ring -->
      <span class="absolute w-8 h-8 rounded-full opacity-40 animate-ping" style="background-color: ${pulseColor}"></span>
      <!-- Central Tactical Target Reticle -->
      <div class="relative w-6 h-6 rounded-full border-2 ${colorClass} flex items-center justify-center font-tech font-bold text-[9px] shadow transition-transform transform group-hover:scale-125">
        ${detection.id.replace('ANM-', '')}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-marine-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const MarineMap: React.FC<MarineMapProps> = ({
  detections,
  selectedDetectionId,
  onSelectDetection,
  className = '',
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [showGeoJsonPolygons, setShowGeoJsonPolygons] = React.useState<boolean>(true);
  const [tileLayerMode, setTileLayerMode] = React.useState<'osm' | 'dark' | 'satellite'>('osm');
  const [indiaCenterTrigger, setIndiaCenterTrigger] = React.useState<number>(0);

  // Default Center fallback (India Center [20.5937, 78.9629], zoom 5)
  const defaultCenter: [number, number] = detections.length > 0
    ? [detections[0].latitude, detections[0].longitude]
    : INDIA_CENTER_COORDINATES;
  const defaultZoom = detections.length > 0 ? 15 : DEFAULT_INDIA_ZOOM;

  // Survey Transect Path connecting detections
  const polylineCoords = detections.map((d) => [d.latitude, d.longitude] as [number, number]);
  const activeDetection = detections.find((d) => d.id === selectedDetectionId);

  const handleCopyCoord = (det: DetectionItem) => {
    const text = `${det.latitude.toFixed(6)}, ${det.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(det.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCenterIndia = () => {
    setIndiaCenterTrigger((prev) => prev + 1);
  };

  // Cache marker icons so we don't recreate DOM elements on every single render
  const markerIcons = useMemo(() => {
    const iconCache = new Map<string, L.DivIcon>();
    detections.forEach((det) => {
      iconCache.set(`${det.id}-selected`, createCustomMarkerIcon(det, true));
      iconCache.set(`${det.id}-unselected`, createCustomMarkerIcon(det, false));
    });
    return iconCache;
  }, [detections]);

  return (
    <div className={`bg-[#0F1A2C] border border-[#93A8BC]/25 rounded-lg flex flex-col overflow-hidden shadow-sm font-sans transition-colors ${className || 'h-full flex-1 min-h-0'}`}>
      {/* Map Header */}
      <div className="p-2.5 border-b border-[#93A8BC]/25 bg-[#142238] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#0B1320] border border-[#93A8BC]/30 flex items-center justify-center text-[#1BDFC8]">
            <Navigation className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-tech font-bold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-1.5">
              <span>HEIMDALL SPATIAL MAP</span>
              <span className="text-[10px] text-[#1BDFC8] font-normal">• LEAFLET + GEOJSON</span>
            </h3>
          </div>
        </div>

        {/* Legend, India Center & GeoJSON Controls */}
        <div className="flex items-center gap-2 text-[10px] font-sans font-medium text-[#93A8BC]">
          {/* India Center Quick Button */}
          <button
            id="btn-center-india"
            onClick={handleCenterIndia}
            className="px-2 py-0.5 rounded text-[10px] font-tech font-bold border border-[#1BDFC8]/40 bg-[#1BDFC8]/10 hover:bg-[#1BDFC8]/20 text-[#1BDFC8] transition cursor-pointer flex items-center gap-1"
            title="Set view to India Center [20.5937, 78.9629] at zoom 5"
          >
            <Globe className="w-3 h-3" />
            <span>INDIA CENTER</span>
          </button>

          {/* GeoJSON Polygon Footprint Toggle */}
          <button
            onClick={() => setShowGeoJsonPolygons(!showGeoJsonPolygons)}
            className={`px-2 py-0.5 rounded text-[10px] font-tech font-bold border transition cursor-pointer flex items-center gap-1 ${
              showGeoJsonPolygons
                ? 'bg-[#1BDFC8]/15 border-[#1BDFC8]/50 text-[#1BDFC8]'
                : 'bg-[#0B1320] border-[#93A8BC]/30 text-[#93A8BC]'
            }`}
            title="Toggle GeoJSON bounding polygon footprints on seabed"
          >
            <Layers className="w-3 h-3" />
            <span>GEOJSON: {showGeoJsonPolygons ? 'ON' : 'OFF'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-[#93A8BC]/20">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#1BDFC8]" /> Critical
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#2E96DB]" /> Warning
            </span>
          </div>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="flex-1 min-h-0 w-full relative z-10 bg-[#0A111E]">
        {/* Top Left HUD Coordinates Badge */}
        <div className="absolute top-2 left-2 px-2.5 py-1 bg-[#0F1A2C]/95 rounded text-[10px] font-tech border border-[#93A8BC]/30 z-[1000] text-[#FFFFFF] font-bold flex items-center gap-2 shadow-sm pointer-events-none uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1BDFC8] border border-[#1BDFC8]/40 animate-pulse" />
          <span className="tabular-nums">
            {activeDetection
              ? `TARGET [${activeDetection.id}] • LAT: ${activeDetection.latitude.toFixed(5)}°N • LON: ${activeDetection.longitude.toFixed(5)}°E`
              : 'WGS84_GEO_RADAR | SYNCHRONIZED TRANSECT COORDINATES'}
          </span>
        </div>

        {/* Top Right TileLayer Switcher HUD */}
        <div className="absolute top-2 right-2 flex items-center bg-[#0F1A2C]/95 border border-[#93A8BC]/30 rounded p-0.5 z-[1000] shadow-sm text-[10px] font-tech font-bold uppercase tracking-wider">
          <button
            onClick={() => setTileLayerMode('osm')}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              tileLayerMode === 'osm'
                ? 'bg-[#1BDFC8] text-[#0A111E]'
                : 'text-[#93A8BC] hover:text-[#FFFFFF]'
            }`}
            title="OpenStreetMap Standard Layer (osm.org)"
          >
            OSM
          </button>
          <button
            onClick={() => setTileLayerMode('dark')}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              tileLayerMode === 'dark'
                ? 'bg-[#1BDFC8] text-[#0A111E]'
                : 'text-[#93A8BC] hover:text-[#FFFFFF]'
            }`}
            title="Carto Dark Matter Tactical Layer"
          >
            Dark
          </button>
          <button
            onClick={() => setTileLayerMode('satellite')}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              tileLayerMode === 'satellite'
                ? 'bg-[#1BDFC8] text-[#0A111E]'
                : 'text-[#93A8BC] hover:text-[#FFFFFF]'
            }`}
            title="Esri World Ocean / Satellite Layer"
          >
            Sat
          </button>
        </div>

        <MapContainer
          id="map"
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          className="h-full w-full"
          attributionControl={true}
        >
          {/* Base TileLayer: OpenStreetMap as requested, with Dark/Satellite switch */}
          {tileLayerMode === 'osm' && (
            <TileLayer
              key="osm"
              attribution={OSM_ATTRIBUTION}
              url={OSM_TILE_URL}
              maxZoom={19}
            />
          )}

          {tileLayerMode === 'dark' && (
            <TileLayer
              key="dark"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />
          )}

          {tileLayerMode === 'satellite' && (
            <TileLayer
              key="satellite"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          )}

          <MapViewController
            detections={detections}
            selectedDetectionId={selectedDetectionId}
            indiaCenterTrigger={indiaCenterTrigger}
          />

          {/* Survey Transect Path connecting detections */}
          {polylineCoords.length > 1 && (
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#1BDFC8',
                weight: 2.5,
                dashArray: '5, 8',
                opacity: 0.85,
              }}
            />
          )}

          {/* GeoJSON Polygon Footprints (RFC 7946 Spatial Overlays) */}
          {showGeoJsonPolygons &&
            detections.map((det) => {
              const isSelected = selectedDetectionId === det.id;
              const lat = det.latitude;
              const lon = det.longitude;
              const halfWidthDeg =
                (Math.max(1.5, det.bbox.width * 0.12) / 2.0) /
                (111139.0 * Math.cos((lat * Math.PI) / 180));
              const halfHeightDeg = (Math.max(1.5, det.bbox.height * 0.12) / 2.0) / 111139.0;
              const polygonPositions: [number, number][] = [
                [lat - halfHeightDeg, lon - halfWidthDeg],
                [lat - halfHeightDeg, lon + halfWidthDeg],
                [lat + halfHeightDeg, lon + halfWidthDeg],
                [lat + halfHeightDeg, lon - halfWidthDeg],
              ];

              const color = isSelected
                ? '#1BDFC8'
                : det.priority === 'high'
                ? '#1BDFC8'
                : det.priority === 'medium'
                ? '#2E96DB'
                : '#93A8BC';

              return (
                <LeafletPolygon
                  key={`poly-${det.id}`}
                  positions={polygonPositions}
                  pathOptions={{
                    color,
                    weight: isSelected ? 2.5 : 1.5,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.35 : 0.15,
                    dashArray: isSelected ? undefined : '3, 4',
                  }}
                  eventHandlers={{
                    click: () => onSelectDetection(det.id),
                  }}
                />
              );
            })}

          {/* Interactive Anomaly Markers */}
          {detections.map((det) => {
            const isSelected = selectedDetectionId === det.id;
            const icon =
              markerIcons.get(`${det.id}-${isSelected ? 'selected' : 'unselected'}`) ||
              createCustomMarkerIcon(det, isSelected);

            return (
              <Marker
                key={det.id}
                position={[det.latitude, det.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectDetection(det.id),
                }}
              >
                <Popup className="marine-popup" autoPan={false}>
                  <div className="p-2.5 font-sans text-xs text-[#FFFFFF] min-w-[220px] bg-[#0F1A2C] border border-[#93A8BC]/30 rounded-lg shadow-md">
                    <div className="flex items-center justify-between border-b border-[#93A8BC]/20 pb-1.5 mb-1.5">
                      <span className="font-bold text-[#FFFFFF] flex items-center gap-1 font-tech">
                        <span>{det.id}</span>
                        <span className="text-[10px] text-[#93A8BC] font-sans font-normal">
                          ({det.class_name.replace(/_/g, ' ')})
                        </span>
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-tech font-bold uppercase tracking-wider ${
                          det.priority === 'high'
                            ? 'bg-[#1BDFC8] text-[#0A111E]'
                            : det.priority === 'medium'
                            ? 'bg-[#2E96DB] text-[#FFFFFF]'
                            : 'bg-[#93A8BC] text-[#0A111E]'
                        }`}
                      >
                        {det.priority} PRIORITY
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div>
                        <span className="text-[#93A8BC] font-medium">Confidence: </span>
                        <strong className="text-[#FFFFFF] font-tech font-bold tabular-nums">
                          {Math.round(det.confidence * 100)}%
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#93A8BC] font-medium">WGS84 Coordinates: </span>
                        <span className="text-[#FFFFFF] font-tech font-semibold tabular-nums block">
                          {det.latitude.toFixed(6)}° N, {det.longitude.toFixed(6)}° E
                        </span>
                      </div>
                      <div>
                        <span className="text-[#93A8BC] font-medium">ROI Bounds: </span>
                        <span className="text-[#FFFFFF] font-tech font-semibold tabular-nums">
                          [{det.bbox.x}, {det.bbox.y}, {det.bbox.width}×{det.bbox.height}px]
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-[#93A8BC]/20 flex items-center justify-between gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCoord(det);
                        }}
                        className="px-2 py-1 rounded bg-[#142238] hover:bg-[#2E96DB]/25 border border-[#93A8BC]/30 text-[#FFFFFF] text-[10px] font-tech font-bold uppercase tracking-wider flex items-center gap-1 transition"
                      >
                        {copiedId === det.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === det.id ? 'COPIED' : 'COPY GPS'}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDetection(det.id);
                        }}
                        className="px-2 py-1 rounded bg-[#1BDFC8] text-[#0A111E] text-[10px] font-tech font-bold uppercase tracking-wider"
                      >
                        FOCUS TARGET
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
