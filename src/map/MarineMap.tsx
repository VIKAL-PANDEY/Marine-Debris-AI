import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Compass, Crosshair, ZoomIn, ZoomOut, Maximize2, MapPin, Copy, Check } from 'lucide-react';
import { DetectionItem } from '../types/detection';

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
}> = ({ detections, selectedDetectionId }) => {
  const map = useMap();
  const isMountedRef = useRef(true);

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
    ? 'bg-[#415111] border-[#D2E186] text-[#FEFEFE] ring-4 ring-[#415111]/40'
    : isHigh
    ? 'bg-[#FB8159] border-[#FEFEFE] text-[#FEFEFE]'
    : isMedium
    ? 'bg-[#FCBF93] border-[#FB8159] text-[#415111]'
    : 'bg-[#D2E186] border-[#415111]/40 text-[#415111]';

  const pulseColor = isSelected
    ? '#415111'
    : isHigh
    ? '#FB8159'
    : isMedium
    ? '#FCBF93'
    : '#D2E186';

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

  // Center fallback (e.g. Arabian Sea / Gulf Survey Zone)
  const defaultCenter: [number, number] = detections.length > 0
    ? [detections[0].latitude, detections[0].longitude]
    : [21.1428, 72.5842];

  // Survey Transect Path connecting detections
  const polylineCoords = detections.map((d) => [d.latitude, d.longitude] as [number, number]);
  const activeDetection = detections.find((d) => d.id === selectedDetectionId);

  const handleCopyCoord = (det: DetectionItem) => {
    const text = `${det.latitude.toFixed(6)}, ${det.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(det.id);
    setTimeout(() => setCopiedId(null), 2000);
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
    <div className={`bg-[#FEFEFE] dark:bg-[#15221B] border border-[#F2E8DF] dark:border-[#415111]/40 rounded-lg flex flex-col overflow-hidden shadow-sm font-sans transition-colors ${className || 'h-full flex-1 min-h-0'}`}>
      {/* Map Header */}
      <div className="p-2.5 border-b border-[#F2E8DF] dark:border-[#415111]/40 bg-[#FEFEFE] dark:bg-[#15221B] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#F2E8DF] dark:bg-[#1E2E21] border border-[#D2E186] flex items-center justify-center text-[#415111] dark:text-[#D2E186]">
            <Navigation className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#FEFEFE]">
            HYDROGRAPHIC BATHYMETRIC MAP (WGS84)
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-sans font-medium text-[#415111] dark:text-[#D2E186]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FB8159]" /> Critical
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FCBF93] border border-[#FB8159]" /> Warning
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#D2E186] border border-[#415111]/30" /> Advisory
          </span>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="flex-1 min-h-0 w-full relative z-10 bg-[#F2E8DF] dark:bg-[#18261E]">
        {/* Top HUD Coordinates Badge */}
        <div className="absolute top-2 left-2 px-2.5 py-1 bg-[#FEFEFE]/95 dark:bg-[#15221B]/95 rounded text-[10px] font-tech border border-[#D2E186] dark:border-[#415111] z-[1000] text-[#415111] dark:text-[#FEFEFE] font-bold flex items-center gap-2 shadow-sm pointer-events-none uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D2E186] border border-[#415111]/40 animate-pulse" />
          <span className="tabular-nums">
            {activeDetection
              ? `TARGET [${activeDetection.id}] • LAT: ${activeDetection.latitude.toFixed(5)}°N • LON: ${activeDetection.longitude.toFixed(5)}°E`
              : 'WGS84_GEO_RADAR | SYNCHRONIZED TRANSECT COORDINATES'}
          </span>
        </div>

        <MapContainer
          center={defaultCenter}
          zoom={15}
          scrollWheelZoom={true}
          className="h-full w-full"
          attributionControl={true}
        >
          {/* Tactical Carto TileLayer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          <MapViewController
            detections={detections}
            selectedDetectionId={selectedDetectionId}
          />

          {/* Survey Transect Path connecting detections */}
          {polylineCoords.length > 1 && (
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#415111',
                weight: 2.5,
                dashArray: '5, 8',
                opacity: 0.85,
              }}
            />
          )}

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
                  <div className="p-2.5 font-sans text-xs text-[#415111] min-w-[220px] bg-[#FEFEFE] border border-[#F2E8DF] rounded-lg shadow-md">
                    <div className="flex items-center justify-between border-b border-[#F2E8DF] pb-1.5 mb-1.5">
                      <span className="font-bold text-[#415111] flex items-center gap-1 font-tech">
                        <span>{det.id}</span>
                        <span className="text-[10px] text-[#415111]/70 font-sans font-normal">
                          ({det.class_name.replace(/_/g, ' ')})
                        </span>
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-tech font-bold uppercase tracking-wider ${
                          det.priority === 'high'
                            ? 'bg-[#FB8159] text-[#FEFEFE]'
                            : det.priority === 'medium'
                            ? 'bg-[#FCBF93] text-[#415111]'
                            : 'bg-[#D2E186] text-[#415111]'
                        }`}
                      >
                        {det.priority} PRIORITY
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div>
                        <span className="text-[#415111]/70 font-medium">Confidence: </span>
                        <strong className="text-[#415111] font-tech font-bold tabular-nums">
                          {Math.round(det.confidence * 100)}%
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#415111]/70 font-medium">WGS84 Coordinates: </span>
                        <span className="text-[#415111] font-tech font-semibold tabular-nums block">
                          {det.latitude.toFixed(6)}° N, {det.longitude.toFixed(6)}° E
                        </span>
                      </div>
                      <div>
                        <span className="text-[#415111]/70 font-medium">ROI Bounds: </span>
                        <span className="text-[#415111] font-tech font-semibold tabular-nums">
                          [{det.bbox.x}, {det.bbox.y}, {det.bbox.width}×{det.bbox.height}px]
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-[#F2E8DF] flex items-center justify-between gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCoord(det);
                        }}
                        className="px-2 py-1 rounded bg-[#F2E8DF] hover:bg-[#D2E186] text-[#415111] text-[10px] font-tech font-bold uppercase tracking-wider flex items-center gap-1 transition"
                      >
                        {copiedId === det.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === det.id ? 'COPIED' : 'COPY GPS'}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDetection(det.id);
                        }}
                        className="px-2 py-1 rounded bg-[#415111] text-[#FEFEFE] text-[10px] font-tech font-bold uppercase tracking-wider"
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
