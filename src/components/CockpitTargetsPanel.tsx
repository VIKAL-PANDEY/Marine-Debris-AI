import React, { useState } from 'react';
import {
  Target,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  Filter,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Activity,
  ChevronRight,
  Crosshair,
  Compass,
} from 'lucide-react';
import { DetectionItem, DetectionResult, DebrisPriority } from '../types/detection';
import { ReportButtons } from './ReportButtons';

interface CockpitTargetsPanelProps {
  result: DetectionResult | null;
  selectedDetectionId: string | null;
  onSelectDetection: (id: string | null) => void;
  onOpenTargetDiagnostics?: (target: DetectionItem) => void;
  onOpenAICoPilot?: (targetQuery?: string) => void;
  onMarkFalsePositive?: (target: DetectionItem) => void;
  falsePositiveIds?: string[];
  onOpenThreatAssessment?: () => void;
  onSwitchToIngest?: () => void;
}

export const CockpitTargetsPanel: React.FC<CockpitTargetsPanelProps> = ({
  result,
  selectedDetectionId,
  onSelectDetection,
  onOpenTargetDiagnostics,
  onOpenAICoPilot,
  onMarkFalsePositive,
  falsePositiveIds = [],
  onOpenThreatAssessment,
  onSwitchToIngest,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const detections = result?.detections || [];

  const filteredDetections = detections.filter((d) => {
    if (priorityFilter === 'all') return true;
    return d.priority === priorityFilter;
  });

  const selectedDetection = detections.find((d) => d.id === selectedDetectionId) || null;

  const handleCopyCoords = (det: DetectionItem) => {
    const text = `${det.latitude.toFixed(6)}, ${det.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(det.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPriorityBadge = (priority: DebrisPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-tech font-bold uppercase tracking-wider bg-[#1BDFC8] text-[#0A111E]">
            CRITICAL
          </span>
        );
      case 'medium':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-tech font-bold uppercase tracking-wider bg-[#2E96DB] text-[#FFFFFF]">
            WARNING
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-tech font-bold uppercase tracking-wider bg-[#93A8BC]/25 text-[#93A8BC] border border-[#93A8BC]/40">
            ADVISORY
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#0F1A2C] font-sans text-xs select-none">
      {/* Panel Top Header: Detections Count & Export Toolbar */}
      <div className="p-3 border-b border-[#93A8BC]/25 bg-[#0F1A2C] flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#142238] border border-[#93A8BC]/30 flex items-center justify-center text-[#1BDFC8]">
              <Target className="w-3 h-3" />
            </div>
            <h2 className="font-tech font-bold text-xs uppercase tracking-wider text-[#FFFFFF] flex items-center gap-1.5">
              <span>TARGETS</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#1BDFC8] text-[#0A111E] text-[10px] font-bold">
                {detections.length}
              </span>
            </h2>
          </div>

          {/* Quick Export / Report */}
          <ReportButtons
            result={result}
            resultId={result?.result_id || null}
            totalDetections={detections.length}
            onOpenThreatAssessment={onOpenThreatAssessment}
          />
        </div>

        {/* Priority Filter Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          <button
            onClick={() => setPriorityFilter('all')}
            className={`px-2 py-1 rounded text-[10px] font-tech uppercase font-bold tracking-wider transition cursor-pointer ${
              priorityFilter === 'all'
                ? 'bg-[#1BDFC8] text-[#0A111E]'
                : 'bg-[#142238] text-[#93A8BC] hover:bg-[#2E96DB]/20 hover:text-[#FFFFFF]'
            }`}
          >
            All ({detections.length})
          </button>
          <button
            onClick={() => setPriorityFilter('high')}
            className={`px-2 py-1 rounded text-[10px] font-tech uppercase font-bold tracking-wider transition cursor-pointer ${
              priorityFilter === 'high'
                ? 'bg-[#1BDFC8] text-[#0A111E]'
                : 'bg-[#142238] text-[#1BDFC8] hover:bg-[#1BDFC8]/20'
            }`}
          >
            Critical ({detections.filter((d) => d.priority === 'high').length})
          </button>
          <button
            onClick={() => setPriorityFilter('medium')}
            className={`px-2 py-1 rounded text-[10px] font-tech uppercase font-bold tracking-wider transition cursor-pointer ${
              priorityFilter === 'medium'
                ? 'bg-[#2E96DB] text-[#FFFFFF]'
                : 'bg-[#142238] text-[#2E96DB] hover:bg-[#2E96DB]/20'
            }`}
          >
            Warning ({detections.filter((d) => d.priority === 'medium').length})
          </button>
          <button
            onClick={() => setPriorityFilter('low')}
            className={`px-2 py-1 rounded text-[10px] font-tech uppercase font-bold tracking-wider transition cursor-pointer ${
              priorityFilter === 'low'
                ? 'bg-[#93A8BC] text-[#0A111E]'
                : 'bg-[#142238] text-[#93A8BC] hover:bg-[#93A8BC]/20'
            }`}
          >
            Advisory ({detections.filter((d) => d.priority === 'low').length})
          </button>
        </div>
      </div>

      {/* Target Items List (Scrollable Area) */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#93A8BC]/20 p-2 space-y-1">
        {filteredDetections.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center p-4 text-center">
            <Target className="w-8 h-8 text-[#93A8BC]/40 mb-2" />
            <p className="font-tech font-bold uppercase tracking-wider text-xs text-[#FFFFFF]">
              {result ? 'No Targets Match Filter' : 'No Active Transect Scan'}
            </p>
            <p className="text-[11px] text-[#93A8BC] mt-1 max-w-[240px]">
              {result
                ? 'Try selecting "All" to view detected objects.'
                : 'Load a preset sample above or click Ingest to upload a sonar transect.'}
            </p>
            {!result && onSwitchToIngest && (
              <button
                onClick={onSwitchToIngest}
                className="mt-3 px-3 py-1.5 rounded bg-[#1BDFC8] text-[#0A111E] font-tech font-bold text-[10px] uppercase tracking-wider hover:bg-[#1BDFC8]/90 cursor-pointer"
              >
                Go to Ingest
              </button>
            )}
          </div>
        ) : (
          filteredDetections.map((target) => {
            const isSelected = target.id === selectedDetectionId;
            const isFalsePositive = falsePositiveIds.includes(target.id);

            return (
              <div
                key={target.id}
                onClick={() => onSelectDetection(isSelected ? null : target.id)}
                className={`p-2.5 rounded-md cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#142238] border-2 border-[#1BDFC8] shadow-sm'
                    : 'hover:bg-[#142238]/60 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-tech font-bold text-[11px] text-[#1BDFC8]">
                      {target.id}
                    </span>
                    <span className="font-sans font-bold text-xs text-[#FFFFFF]">
                      {target.class_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.2 rounded bg-[#0B1320] text-[#1BDFC8] font-tech font-bold text-[10px] border border-[#93A8BC]/30">
                      {Math.round(target.confidence * 100)}%
                    </span>
                    {getPriorityBadge(target.priority)}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#93A8BC] font-tech">
                  <div className="flex items-center gap-2">
                    <span>
                      {target.latitude.toFixed(4)}°N, {target.longitude.toFixed(4)}°E
                    </span>
                    <span>•</span>
                    <span>Size: {Math.round(target.bbox.width)}×{Math.round(target.bbox.height)} px</span>
                  </div>
                  {isFalsePositive && (
                    <span className="text-[9px] text-[#2E96DB] font-bold uppercase">
                      FLAGGED FP
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Panel Bottom: Focused Inspector or Mission Summary */}
      <div className="p-3 border-t border-[#93A8BC]/25 bg-[#0B1320] shrink-0">
        {selectedDetection ? (
          <div className="space-y-2.5">
            {/* Target Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-tech font-bold text-xs text-[#1BDFC8]">
                  INSPECTOR: [{selectedDetection.id}]
                </span>
                <span className="font-bold text-xs text-[#FFFFFF]">
                  {selectedDetection.class_name}
                </span>
              </div>
              <button
                onClick={() => onSelectDetection(null)}
                className="text-[10px] text-[#93A8BC] hover:text-[#FFFFFF] uppercase font-tech font-bold cursor-pointer"
              >
                Deselect
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-1.5 rounded bg-[#142238] border border-[#93A8BC]/30">
                <div className="text-[#93A8BC] uppercase font-tech text-[9px]">
                  Confidence & Priority
                </div>
                <div className="font-tech font-bold text-[#FFFFFF] flex items-center justify-between mt-0.5">
                  <span>{(selectedDetection.confidence * 100).toFixed(1)}%</span>
                  <span className="uppercase text-[9px] text-[#1BDFC8]">{selectedDetection.priority}</span>
                </div>
              </div>

              <div className="p-1.5 rounded bg-[#142238] border border-[#93A8BC]/30">
                <div className="text-[#93A8BC] uppercase font-tech text-[9px]">
                  Bounding Box & Area
                </div>
                <div className="font-tech font-bold text-[#FFFFFF] mt-0.5">
                  {Math.round(selectedDetection.bbox.width)}×{Math.round(selectedDetection.bbox.height)} px • {Math.round(selectedDetection.bbox.width * selectedDetection.bbox.height)} px²
                </div>
              </div>
            </div>

            {/* Coordinates with 1-click Copy */}
            <div className="flex items-center justify-between p-1.5 rounded bg-[#142238] border border-[#93A8BC]/30 text-[10px] font-tech text-[#FFFFFF]">
              <span className="truncate">
                WGS84: {selectedDetection.latitude.toFixed(6)}°N, {selectedDetection.longitude.toFixed(6)}°E
              </span>
              <button
                onClick={() => handleCopyCoords(selectedDetection)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0B1320] hover:bg-[#2E96DB]/20 text-[#1BDFC8] cursor-pointer ml-1 shrink-0 font-bold"
                title="Copy coordinates to clipboard"
              >
                {copiedId === selectedDetection.id ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-[#1BDFC8]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {onOpenTargetDiagnostics && (
                <button
                  onClick={() => onOpenTargetDiagnostics(selectedDetection)}
                  className="flex-1 py-1 px-2 rounded bg-[#1BDFC8] hover:bg-[#1BDFC8]/90 text-[#0A111E] font-tech font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AI Diagnostics</span>
                </button>
              )}

              {onOpenAICoPilot && (
                <button
                  onClick={() =>
                    onOpenAICoPilot(
                      `Analyze acoustic target ${selectedDetection.id} (${selectedDetection.class_name}) located at coordinates ${selectedDetection.latitude.toFixed(5)}°N, ${selectedDetection.longitude.toFixed(5)}°E.`
                    )
                  }
                  className="py-1 px-2 rounded bg-[#142238] hover:bg-[#2E96DB]/20 text-[#1BDFC8] border border-[#93A8BC]/30 font-tech font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                  title="Ask AI Assistant about this target"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Ask AI</span>
                </button>
              )}

              {onMarkFalsePositive && (
                <button
                  onClick={() => onMarkFalsePositive(selectedDetection)}
                  className="py-1 px-2 rounded bg-[#142238] hover:bg-[#2E96DB]/20 text-[#2E96DB] border border-[#2E96DB]/40 font-tech font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                  title="Flag as False Positive"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Flag FP</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 text-[10px] text-[#93A8BC] font-tech">
            <div className="flex items-center justify-between font-bold text-[#FFFFFF]">
              <span>ACTIVE TRANSECT</span>
              <span className="text-[#1BDFC8]">{result ? result.result_id : 'Awaiting Sonar Scan'}</span>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span>Resolution: {result ? `${result.metadata.width}×${result.metadata.height}` : '800×600'} px</span>
              <span>Swath: 150m</span>
            </div>
            <div className="text-[9px] text-[#93A8BC] mt-0.5">
              Click any target in the list or bounding box on the waterfall to view deep inspection metrics.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
