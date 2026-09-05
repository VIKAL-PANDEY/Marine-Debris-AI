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
          <span className="px-1.5 py-0.5 rounded text-[9px] font-tech font-bold uppercase tracking-wider bg-[#E4580B] text-[#FEFEFE]">
            CRITICAL
          </span>
        );
      case 'medium':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-tech font-bold uppercase tracking-wider bg-[#6793AC] text-[#114AB1] border border-[#E4580B]/30">
            WARNING
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-tech font-bold uppercase tracking-wider bg-[#6793AC] text-[#114AB1] border border-[#114AB1]/20">
            ADVISORY
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#FEFEFE] dark:bg-[#0A1120] font-sans text-xs select-none">
      {/* Panel Top Header: Detections Count & Export Toolbar */}
      <div className="p-3 border-b border-[#EBF2F7] dark:border-[#114AB1]/40 bg-[#FEFEFE] dark:bg-[#0A1120] flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#EBF2F7] dark:bg-[#0A1120] border border-[#6793AC] flex items-center justify-center text-[#114AB1] dark:text-[#6793AC]">
              <Target className="w-3 h-3" />
            </div>
            <h2 className="font-tech font-bold text-xs uppercase tracking-wider text-[#114AB1] dark:text-[#FEFEFE] flex items-center gap-1.5">
              <span>TARGETS</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#6793AC] text-[#114AB1] text-[10px] font-bold">
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
                ? 'bg-[#114AB1] text-[#FEFEFE]'
                : 'bg-[#EBF2F7]/70 dark:bg-[#0A1120] text-[#114AB1] dark:text-[#6793AC] hover:bg-[#6793AC]/50'
            }`}
          >
            All ({detections.length})
          </button>
          <button
            onClick={() => setPriorityFilter('high')}
            className={`px-2 py-1 rounded text-[10px] font-tech uppercase font-bold tracking-wider transition cursor-pointer ${
              priorityFilter === 'high'
                ? 'bg-[#E4580B] text-[#FEFEFE]'
                : 'bg-[#EBF2F7]/70 dark:bg-[#0A1120] text-[#E4580B] hover:bg-[#E4580B]/20'
            }`}
          >
            Critical ({detections.filter((d) => d.priority === 'high').length})
          </button>
          <button
            onClick={() => setPriorityFilter('medium')}
            className={`px-2 py-1 rounded text-[10px] font-tech uppercase font-bold tracking-wider transition cursor-pointer ${
              priorityFilter === 'medium'
                ? 'bg-[#6793AC] text-[#114AB1]'
                : 'bg-[#EBF2F7]/70 dark:bg-[#0A1120] text-[#114AB1] dark:text-[#6793AC] hover:bg-[#6793AC]/30'
            }`}
          >
            Warning ({detections.filter((d) => d.priority === 'medium').length})
          </button>
          <button
            onClick={() => setPriorityFilter('low')}
            className={`px-2 py-1 rounded text-[10px] font-tech uppercase font-bold tracking-wider transition cursor-pointer ${
              priorityFilter === 'low'
                ? 'bg-[#6793AC] text-[#114AB1]'
                : 'bg-[#EBF2F7]/70 dark:bg-[#0A1120] text-[#114AB1] dark:text-[#6793AC] hover:bg-[#6793AC]/50'
            }`}
          >
            Advisory ({detections.filter((d) => d.priority === 'low').length})
          </button>
        </div>
      </div>

      {/* Target Items List (Scrollable Area) */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#EBF2F7] dark:divide-[#114AB1]/30 p-2 space-y-1">
        {filteredDetections.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center p-4 text-center">
            <Target className="w-8 h-8 text-[#114AB1]/30 dark:text-[#6793AC]/30 mb-2" />
            <p className="font-tech font-bold uppercase tracking-wider text-xs text-[#114AB1] dark:text-[#FEFEFE]">
              {result ? 'No Targets Match Filter' : 'No Active Transect Scan'}
            </p>
            <p className="text-[11px] text-[#114AB1]/70 dark:text-[#6793AC]/70 mt-1 max-w-[240px]">
              {result
                ? 'Try selecting "All" to view detected objects.'
                : 'Load a preset sample above or click Ingest to upload a sonar transect.'}
            </p>
            {!result && onSwitchToIngest && (
              <button
                onClick={onSwitchToIngest}
                className="mt-3 px-3 py-1.5 rounded bg-[#114AB1] text-[#FEFEFE] font-tech font-bold text-[10px] uppercase tracking-wider hover:bg-[#114AB1]/90 cursor-pointer"
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
                    ? 'bg-[#6793AC]/30 dark:bg-[#0A1120] border-2 border-[#114AB1] dark:border-[#6793AC] shadow-sm'
                    : 'hover:bg-[#EBF2F7]/60 dark:hover:bg-[#0A1120]/60 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-tech font-bold text-[11px] text-[#114AB1] dark:text-[#FEFEFE]">
                      {target.id}
                    </span>
                    <span className="font-sans font-bold text-xs text-[#114AB1] dark:text-[#FEFEFE]">
                      {target.class_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.2 rounded bg-[#EBF2F7] dark:bg-[#0A1120] text-[#114AB1] dark:text-[#6793AC] font-tech font-bold text-[10px] border border-[#6793AC] dark:border-[#114AB1]">
                      {Math.round(target.confidence * 100)}%
                    </span>
                    {getPriorityBadge(target.priority)}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#114AB1]/70 dark:text-[#6793AC]/70 font-tech">
                  <div className="flex items-center gap-2">
                    <span>
                      {target.latitude.toFixed(4)}°N, {target.longitude.toFixed(4)}°E
                    </span>
                    <span>•</span>
                    <span>Size: {Math.round(target.bbox.width)}×{Math.round(target.bbox.height)} px</span>
                  </div>
                  {isFalsePositive && (
                    <span className="text-[9px] text-[#E4580B] font-bold uppercase">
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
      <div className="p-3 border-t border-[#EBF2F7] dark:border-[#114AB1]/40 bg-[#EBF2F7]/40 dark:bg-[#0A1120]/60 shrink-0">
        {selectedDetection ? (
          <div className="space-y-2.5">
            {/* Target Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-tech font-bold text-xs text-[#114AB1] dark:text-[#FEFEFE]">
                  INSPECTOR: [{selectedDetection.id}]
                </span>
                <span className="font-bold text-xs text-[#114AB1] dark:text-[#FEFEFE]">
                  {selectedDetection.class_name}
                </span>
              </div>
              <button
                onClick={() => onSelectDetection(null)}
                className="text-[10px] text-[#114AB1]/70 dark:text-[#6793AC]/70 hover:text-[#114AB1] uppercase font-tech font-bold cursor-pointer"
              >
                Deselect
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-1.5 rounded bg-[#FEFEFE] dark:bg-[#0A1120] border border-[#6793AC] dark:border-[#114AB1]/40">
                <div className="text-[#114AB1]/70 dark:text-[#6793AC]/70 uppercase font-tech text-[9px]">
                  Confidence & Priority
                </div>
                <div className="font-tech font-bold text-[#114AB1] dark:text-[#FEFEFE] flex items-center justify-between mt-0.5">
                  <span>{(selectedDetection.confidence * 100).toFixed(1)}%</span>
                  <span className="uppercase text-[9px]">{selectedDetection.priority}</span>
                </div>
              </div>

              <div className="p-1.5 rounded bg-[#FEFEFE] dark:bg-[#0A1120] border border-[#6793AC] dark:border-[#114AB1]/40">
                <div className="text-[#114AB1]/70 dark:text-[#6793AC]/70 uppercase font-tech text-[9px]">
                  Bounding Box & Area
                </div>
                <div className="font-tech font-bold text-[#114AB1] dark:text-[#FEFEFE] mt-0.5">
                  {Math.round(selectedDetection.bbox.width)}×{Math.round(selectedDetection.bbox.height)} px • {Math.round(selectedDetection.bbox.width * selectedDetection.bbox.height)} px²
                </div>
              </div>
            </div>

            {/* Coordinates with 1-click Copy */}
            <div className="flex items-center justify-between p-1.5 rounded bg-[#FEFEFE] dark:bg-[#0A1120] border border-[#6793AC] dark:border-[#114AB1]/40 text-[10px] font-tech">
              <span className="truncate">
                WGS84: {selectedDetection.latitude.toFixed(6)}°N, {selectedDetection.longitude.toFixed(6)}°E
              </span>
              <button
                onClick={() => handleCopyCoords(selectedDetection)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EBF2F7] dark:bg-[#0A1120] hover:bg-[#6793AC] text-[#114AB1] dark:text-[#6793AC] cursor-pointer ml-1 shrink-0 font-bold"
                title="Copy coordinates to clipboard"
              >
                {copiedId === selectedDetection.id ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-[#114AB1]" />
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
                  className="flex-1 py-1 px-2 rounded bg-[#114AB1] hover:bg-[#114AB1]/90 text-[#FEFEFE] font-tech font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer"
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
                  className="py-1 px-2 rounded bg-[#EBF2F7] dark:bg-[#0A1120] hover:bg-[#6793AC] text-[#114AB1] dark:text-[#6793AC] border border-[#6793AC] dark:border-[#114AB1] font-tech font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                  title="Ask AI Assistant about this target"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Ask AI</span>
                </button>
              )}

              {onMarkFalsePositive && (
                <button
                  onClick={() => onMarkFalsePositive(selectedDetection)}
                  className="py-1 px-2 rounded bg-[#EBF2F7] dark:bg-[#0A1120] hover:bg-[#E4580B]/20 text-[#E4580B] border border-[#E4580B]/40 font-tech font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                  title="Flag as False Positive"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Flag FP</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 text-[10px] text-[#114AB1]/80 dark:text-[#6793AC]/80 font-tech">
            <div className="flex items-center justify-between font-bold text-[#114AB1] dark:text-[#FEFEFE]">
              <span>ACTIVE TRANSECT</span>
              <span>{result ? result.result_id : 'Awaiting Sonar Scan'}</span>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span>Resolution: {result ? `${result.metadata.width}×${result.metadata.height}` : '800×600'} px</span>
              <span>Swath: 150m</span>
            </div>
            <div className="text-[9px] text-[#114AB1]/70 dark:text-[#6793AC]/70 mt-0.5">
              Click any target in the list or bounding box on the waterfall to view deep inspection metrics.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
