import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Crosshair,
  Scan,
  Compass,
  Cpu,
  Move,
  RotateCcw,
} from 'lucide-react';
import { DetectionItem, DetectionResult } from '../types/detection';
import { Tooltip } from './Tooltip';

interface SonarViewerProps {
  result: DetectionResult | null;
  selectedDetectionId: string | null;
  onSelectDetection: (id: string | null) => void;
  rawImagePreviewUrl: string | null;
  className?: string;
}

type ViewMode = 'overlay' | 'annotated' | 'preprocessed' | 'raw';

export const SonarViewer: React.FC<SonarViewerProps> = ({
  result,
  selectedDetectionId,
  onSelectDetection,
  rawImagePreviewUrl,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overlay');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [showNadir, setShowNadir] = useState<boolean>(true);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  const activeImageUrl = result
    ? viewMode === 'raw'
      ? result.original_image_url
      : viewMode === 'preprocessed'
      ? result.preprocessed_image_url
      : viewMode === 'annotated'
      ? result.annotated_image_url
      : result.preprocessed_image_url
    : rawImagePreviewUrl;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageNaturalSize({
      width: img.naturalWidth || 800,
      height: img.naturalHeight || 600,
    });
  };

  // Wheel zoom support
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || zoomLevel > 1) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      setZoomLevel((prev) => Math.max(0.6, Math.min(3.5, prev + delta)));
    }
  };

  // Pan interaction handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (zoomLevel > 1 || e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const scaleX = imageNaturalSize.width / (rect.width || 1);
    const scaleY = imageNaturalSize.height / (rect.height || 1);

    setCursorPos({
      x: Math.round(x * scaleX),
      y: Math.round(y * scaleY),
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(0.6, Math.min(3.5, prev + delta)));
  };

  const resetZoomAndPan = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Distinct outline styles for different anomaly types
  const getAnomalyBoundingBoxStyle = (det: DetectionItem, isSelected: boolean) => {
    const className = det.class_name.toLowerCase();
    const isCritical = det.priority === 'high';

    if (isSelected) {
      return {
        boxClass: 'border-2 border-[#114AB1] dark:border-[#6793AC] ring-4 ring-[#114AB1]/40 dark:ring-[#6793AC]/40 bg-[#6793AC]/35 shadow-lg animate-pulse z-30',
        badgeBg: 'bg-[#114AB1] text-[#FEFEFE] ring-1 ring-[#6793AC]',
        cornerColor: 'border-[#114AB1] dark:border-[#6793AC]',
      };
    }

    if (className.includes('net') || className.includes('ghost')) {
      // Ghost net: Dashed border with high-visibility orange tags
      return {
        boxClass: 'border-2 border-dashed border-[#E4580B] bg-[#E4580B]/15 hover:bg-[#E4580B]/30 z-20',
        badgeBg: 'bg-[#E4580B] text-[#FEFEFE]',
        cornerColor: 'border-[#E4580B]',
      };
    }

    if (className.includes('metal') || className.includes('container')) {
      // Metal debris: Solid heavy outline with royal blue brackets
      return {
        boxClass: 'border-2 border-solid border-[#114AB1] dark:border-[#6793AC] bg-[#114AB1]/15 hover:bg-[#114AB1]/30 z-20',
        badgeBg: 'bg-[#114AB1] dark:bg-[#6793AC] text-[#FEFEFE] dark:text-[#114AB1]',
        cornerColor: 'border-[#114AB1] dark:border-[#6793AC]',
      };
    }

    if (className.includes('trap') || className.includes('gear') || className.includes('trawl')) {
      // Derelict trap / trawl gear: Dotted steel blue border
      return {
        boxClass: 'border-2 border-dotted border-[#6793AC] bg-[#6793AC]/25 hover:bg-[#6793AC]/40 z-20',
        badgeBg: 'bg-[#6793AC] text-[#FEFEFE]',
        cornerColor: 'border-[#6793AC]',
      };
    }

    // Default / general debris
    if (isCritical) {
      return {
        boxClass: 'border-2 border-solid border-[#E4580B] bg-[#E4580B]/20 hover:bg-[#E4580B]/35 z-20',
        badgeBg: 'bg-[#E4580B] text-[#FEFEFE]',
        cornerColor: 'border-[#E4580B]',
      };
    }

    return {
      boxClass: 'border-2 border-solid border-[#6793AC] bg-[#6793AC]/25 hover:bg-[#6793AC]/40 z-20',
      badgeBg: 'bg-[#6793AC] text-[#FEFEFE]',
      cornerColor: 'border-[#114AB1]/60',
    };
  };

  return (
    <div className={`bg-[#FEFEFE] dark:bg-[#0A1120] border border-[#EBF2F7] dark:border-[#114AB1]/40 rounded-lg flex flex-col overflow-hidden shadow-sm font-sans transition-colors ${className || 'h-full flex-1 min-h-0'}`}>
      {/* Viewer Toolbar */}
      <div className="p-2.5 border-b border-[#EBF2F7] dark:border-[#114AB1]/40 bg-[#FEFEFE] dark:bg-[#0A1120] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#EBF2F7] dark:bg-[#114AB1]/20 border border-[#6793AC] flex items-center justify-center text-[#114AB1] dark:text-[#6793AC]">
            <Scan className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-tech font-bold uppercase tracking-wider text-[#114AB1] dark:text-[#FEFEFE] flex items-center gap-2">
            <span>ACOUSTIC WATERFALL VIEWER</span>
            {selectedDetectionId && (
              <span className="text-[9px] text-[#FEFEFE] font-bold px-1.5 py-0.2 bg-[#114AB1] rounded border border-[#6793AC] uppercase tracking-wider">
                ACTIVE: {selectedDetectionId}
              </span>
            )}
          </h3>

          {result && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-tech tabular-nums px-1.5 py-0.5 rounded bg-[#EBF2F7] dark:bg-[#114AB1]/20 text-[#114AB1] dark:text-[#6793AC] border border-[#6793AC] dark:border-[#114AB1] font-medium">
                {result.metadata.width}×{result.metadata.height} px
              </span>
              <span className="text-[9px] font-tech tabular-nums px-1.5 py-0.5 rounded bg-[#6793AC] text-[#FEFEFE] border border-[#114AB1]/20 font-bold uppercase tracking-wider">
                {result.detections.length} DETECTIONS
              </span>
              {typeof result.metadata.inference_time_ms === 'number' && (
                <span className="text-[9px] font-tech tabular-nums px-1.5 py-0.5 rounded bg-[#6793AC] text-[#FEFEFE] border border-[#114AB1]/20 flex items-center gap-1 font-bold">
                  <Cpu className="w-2.5 h-2.5 text-[#FEFEFE]" />
                  <span>{result.metadata.inference_time_ms.toFixed(1)}ms</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* View Mode Switcher */}
        {result && (
          <div className="flex items-center bg-[#EBF2F7] dark:bg-[#114AB1]/20 border border-[#6793AC] dark:border-[#114AB1] rounded p-0.5 text-xs font-sans">
            <button
              onClick={() => setViewMode('overlay')}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider transition cursor-pointer ${
                viewMode === 'overlay'
                  ? 'bg-[#114AB1] text-[#FEFEFE]'
                  : 'text-[#114AB1]/70 dark:text-[#6793AC]/70 hover:text-[#114AB1]'
              }`}
              title="Interactive YOLO Bounding Box Overlay"
            >
              YOLO Overlay
            </button>
            <button
              onClick={() => setViewMode('annotated')}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider transition cursor-pointer ${
                viewMode === 'annotated'
                  ? 'bg-[#114AB1] text-[#FEFEFE]'
                  : 'text-[#114AB1]/70 dark:text-[#6793AC]/70 hover:text-[#114AB1]'
              }`}
              title="Canvas rendered annotations"
            >
              Annotated
            </button>
            <button
              onClick={() => setViewMode('preprocessed')}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider transition cursor-pointer ${
                viewMode === 'preprocessed'
                  ? 'bg-[#114AB1] text-[#FEFEFE]'
                  : 'text-[#114AB1]/70 dark:text-[#6793AC]/70 hover:text-[#114AB1]'
              }`}
              title="CLAHE equalized and filtered acoustic view"
            >
              Enhanced
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider transition cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-[#114AB1] text-[#FEFEFE]'
                  : 'text-[#114AB1]/70 dark:text-[#6793AC]/70 hover:text-[#114AB1]'
              }`}
              title="Original raw sonar return"
            >
              Raw Sonar
            </button>
          </div>
        )}

        {/* Pan & Zoom Controls */}
        <div className="flex items-center gap-1 font-sans text-xs">
          <button
            onClick={() => setShowNadir(!showNadir)}
            className={`px-2 py-1 rounded border text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition cursor-pointer ${
              showNadir
                ? 'bg-[#6793AC] border-[#114AB1]/30 text-[#FEFEFE]'
                : 'bg-[#EBF2F7] dark:bg-[#114AB1]/20 border-[#6793AC] dark:border-[#114AB1] text-[#114AB1]/70 dark:text-[#6793AC]/70'
            }`}
            title="Toggle Towfish Track Nadir Line"
          >
            <Sliders className="w-3 h-3" />
            <span className="hidden sm:inline">Nadir</span>
          </button>

          <button
            onClick={() => handleZoom(-0.25)}
            className="p-1 rounded bg-[#EBF2F7] dark:bg-[#114AB1]/20 hover:bg-[#6793AC] hover:text-[#FEFEFE] border border-[#6793AC] dark:border-[#114AB1] text-[#114AB1] dark:text-[#6793AC] transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[10px] text-[#114AB1] dark:text-[#FEFEFE] px-1 font-tech tabular-nums font-bold">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            onClick={() => handleZoom(0.25)}
            className="p-1 rounded bg-[#EBF2F7] dark:bg-[#114AB1]/20 hover:bg-[#6793AC] hover:text-[#FEFEFE] border border-[#6793AC] dark:border-[#114AB1] text-[#114AB1] dark:text-[#6793AC] transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={resetZoomAndPan}
            className="p-1 rounded bg-[#EBF2F7] dark:bg-[#114AB1]/20 hover:bg-[#6793AC] hover:text-[#FEFEFE] border border-[#6793AC] dark:border-[#114AB1] text-[#114AB1] dark:text-[#6793AC] transition cursor-pointer"
            title="Reset Zoom & Center Pan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Sonar Viewport with Pan & Zoom */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsPanning(false);
          setCursorPos(null);
        }}
        className={`relative bg-[#0A1120] flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center p-2 select-none tactical-grid ${
          zoomLevel > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
        }`}
      >
        {/* Top HUD Badge */}
        <div className="absolute top-2 left-2 px-2.5 py-1 bg-[#FEFEFE]/95 dark:bg-[#0A1120]/95 rounded text-[10px] font-tech border border-[#6793AC] dark:border-[#114AB1] z-10 text-[#114AB1] dark:text-[#FEFEFE] font-bold flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6793AC] border border-[#114AB1]/30 animate-pulse" />
          <span>VIEW: {viewMode.toUpperCase()}_SONAR_OVERLAY</span>
          {zoomLevel > 1 && (
            <span className="text-[9px] text-[#E4580B] ml-1">
              [DRAG TO PAN • {Math.round(zoomLevel * 100)}%]
            </span>
          )}
        </div>

        {activeImageUrl ? (
          <div
            className="relative transition-transform duration-75 ease-out origin-center shadow-2xl border border-[#6793AC]/60 rounded bg-[#0A1120] max-h-full max-w-full flex items-center justify-center"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            }}
          >
            {/* Sonar Image */}
            <img
              ref={imageRef}
              src={activeImageUrl}
              alt="Side-Scan Sonar Imagery"
              onLoad={handleImageLoad}
              className="max-h-[calc(100vh-220px)] max-w-full w-auto h-auto block object-contain pointer-events-none"
            />

            {/* Nadir Line (Central Towfish Ground Track) */}
            {showNadir && (
              <div
                className="absolute inset-y-0 border-l border-dashed border-[#6793AC]/70 pointer-events-none flex flex-col justify-between items-center z-10"
                style={{ left: '50%' }}
              >
                <span className="text-[8px] font-tech uppercase tracking-widest text-[#FEFEFE] font-bold bg-[#6793AC]/95 px-1 py-0.5 rounded -translate-x-1/2 mt-1 shadow">
                  PORT ◄ TOWFISH NADIR ► STBD
                </span>
                <span className="text-[8px] font-tech uppercase tracking-widest text-[#FEFEFE] font-bold bg-[#6793AC]/95 px-1 py-0.5 rounded -translate-x-1/2 mb-1 shadow">
                  PING RETURNS ▼
                </span>
              </div>
            )}

            {/* Interactive Detection Bounding Boxes Overlay */}
            {viewMode === 'overlay' &&
              result &&
              result.detections.map((det: DetectionItem) => {
                const isSelected = selectedDetectionId === det.id;
                const leftPercent = (det.bbox.x / result.metadata.width) * 100;
                const topPercent = (det.bbox.y / result.metadata.height) * 100;
                const widthPercent = (det.bbox.width / result.metadata.width) * 100;
                const heightPercent = (det.bbox.height / result.metadata.height) * 100;

                const styleConfig = getAnomalyBoundingBoxStyle(det, isSelected);
                const confidencePct = Math.round(det.confidence * 100);

                return (
                  <div
                    key={det.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDetection(isSelected ? null : det.id);
                    }}
                    style={{
                      left: `${leftPercent}%`,
                      top: `${topPercent}%`,
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`,
                    }}
                    className={`absolute rounded-sm cursor-pointer transition-all duration-150 ${styleConfig.boxClass}`}
                  >
                    {/* Corner Reticle Markers */}
                    <div className={`absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 ${styleConfig.cornerColor}`} />
                    <div className={`absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 ${styleConfig.cornerColor}`} />
                    <div className={`absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 ${styleConfig.cornerColor}`} />
                    <div className={`absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 ${styleConfig.cornerColor}`} />

                    {/* Badge Label: ID | Class Name | Confidence Percentage */}
                    <div
                      className={`absolute -top-5 left-0 font-tech tabular-nums text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-30 shadow-md tracking-tight ${styleConfig.badgeBg}`}
                    >
                      <span>{det.id}</span> |{' '}
                      <span className="uppercase">{det.class_name.replace(/_/g, ' ')}</span> |{' '}
                      <span>{confidencePct}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center p-8 max-w-sm flex flex-col items-center gap-2.5">
            <div className="w-12 h-12 rounded-full bg-[#0A1120] border border-[#6793AC] flex items-center justify-center text-[#6793AC] shadow-sm">
              <Crosshair className="w-6 h-6 animate-spin text-[#6793AC]" />
            </div>
            <div>
              <p className="text-xs font-tech font-bold uppercase tracking-wider text-[#6793AC]">
                AWAITING ACOUSTIC WATERFALL
              </p>
              <p className="text-[10px] text-[#6793AC]/70 font-sans mt-0.5 font-normal">
                Upload side-scan imagery or select a test survey scan to begin YOLO detection
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Viewer Footer Telemetry Bar */}
      <div className="p-2.5 bg-[#FEFEFE] dark:bg-[#0A1120] border-t border-[#EBF2F7] dark:border-[#114AB1]/40 flex flex-wrap items-center justify-between gap-3 text-[10px] font-sans text-[#114AB1] dark:text-[#6793AC]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-[#114AB1] dark:text-[#6793AC]" />
            <span className="font-medium">TRANSECT HEADING:</span>
            <span className="text-[#114AB1] dark:text-[#FEFEFE] font-tech font-bold tabular-nums">045° TRUE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-[#114AB1] dark:text-[#6793AC]" />
            <span className="font-medium">SWATH COVERAGE:</span>
            <span className="text-[#114AB1] dark:text-[#FEFEFE] font-tech font-bold tabular-nums">100M (±50M NADIR)</span>
          </div>
        </div>

        {cursorPos && (
          <div className="flex items-center gap-1.5 text-[#114AB1] dark:text-[#6793AC]">
            <span className="font-medium">ACOUSTIC PIXEL:</span>
            <span className="text-[#114AB1] dark:text-[#FEFEFE] font-tech font-bold tabular-nums">
              X:{cursorPos.x} Y:{cursorPos.y}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
