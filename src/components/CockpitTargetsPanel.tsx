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
          <span className="px-1.5 py-0.5 rounded text-[9px] font-tech font-bold uppercase tracking-wider bg-[#6793AC] text-[#FEFEFE] border border-[#6793AC]/30">
            WARNING
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-tech font-bold uppercase tracking-wider bg-[#EBF2F7] text-[#114AB1] border border-[#6793AC]/20">
            ADVISORY
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#FEFEFE] dark:bg-[#15221B] font-sans text-xs select-none">
      {/* Panel Top Header: Detections Count & Export Toolbar */}
      <div className="p-3 border-b border-[#EBF2F7] dark:border-[#114AB1]/40 bg-[#FEFEFE] dark:bg-[#0A1120] flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#EBF2F7] dark:bg-[#114AB1]/20 border border-[#6793AC] flex items-center justify-center text-[#114AB1] dark:text-[#6793AC]">
              <Target className="w-3 h-3" />
            </div>
            <h2 className="font-tech font-bold text-xs uppercase tracking-wider text-[#114AB1] dark:text-[#FEFEFE] flex items-center gap-1.5">
              <span>TARGETS</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#114AB1] text-[#FEFEFE] text-[10px] font-bold">
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
                : 'bg-[#EBF2F7]/70 dark:bg-[#114AB1]/20 text-[#114AB1] dark:text-[#6793AC] hover:bg-[#EBF2F7]'
            }`}
          >
            All ({detections.length})
          </button>
          <button
            onClick={() => setPriorityFilter('high')}
            className={`px-2 py-1 rounded text-[10px] font-tech uppercase font-bold tracking-wider transition cursor-pointer ${
              priorityFilter === 'high'
                ? 'bg-[#E4580B] text-[#FEFEFE]'
                : 'bg-[#EBF2F7]/70 dark:bg-[#114AB1]/20 text-[#E4580B] hover:bg-[#E4580B]/15'
            }`}
          >
            Critical ({detections.filter((d) => d.priority === 'high').length})
          </button>
          <button
            onClick={() => setPriorityFilter('medium')}
            className={`px-2 py-1 rounded text-[10px] font-tech uppercase font-bold tracking-wider transition cursor-pointer ${
              priorityFilter === 'medium'
                ? 'bg-[#6793AC] text-[#FEFEFE]'
                : 'bg-[#EBF2F7]/70 dark:bg-[#114AB1]/20 text-[#114AB1] dark:text-[#6793AC] hover:bg-[#6793AC]/20'
            }`}
          >
            Warning ({detections.filter((d) => d.priority === 'medium').length})
          </button>
          <button
            onClick={() => setPriorityFilter('low')}
            className={`px-2 py-1 rounded text-[10px] font-tech uppercase font-bold tracking-wider transition cursor-pointer ${
              priorityFilter === 'low'
                ? 'bg-[#EBF2F7] text-[#114AB1] border border-[#6793AC]'
                : 'bg-[#EBF2F7]/70 dark:bg-[#114AB1]/20 text-[#114AB1] dark:text-[#6793AC] hover:bg-[#EBF2F7]'
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
            <p className="text-[11px] text-[#6793AC] mt-1 max-w-[240px]">
              {result
                ? 'Try selecting "All" to view detected objects.'
                : 'Load a preset sample above or click Ingest to upload a sonar transect.'}
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Target className="w-8 h-8 text-[#114AB1]/30 dark:text-[#6793AC]/30 mb-2" />
            <p className="font-tech font-bold uppercase tracking-wider text-xs text-[#114AB1] dark:text-[#FEFEFE]">
              No Target Anomalies Selected
            </p>
            <p className="text-[11px] text-[#6793AC] mt-1 max-w-[240px]">
              Upload sonar imagery or run sequential batch scan to populate targets.
            </p>
            {onSwitchToIngest && (
              <button
                onClick={onSwitchToIngest}
                className="mt-3 px-3 py-1.5 rounded bg-[#114AB1] text-[#FEFEFE] font-tech font-bold text-[10px] uppercase tracking-wider hover:bg-[#114AB1]/90 cursor-pointer"
              >
                Go to Ingest Queue
              </button>
            )}
          </div>
        ) : (
          filteredDetections.map((det) => {
            const isSelected = det.id === selectedDetectionId;
            const isFP = falsePositiveIds.includes(det.id);

            return (
              <div
                key={det.id}
                onClick={() => onSelectDetection(det.id)}
                className={`p-2.5 rounded-md transition cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-[#EBF2F7] dark:bg-[#114AB1]/20 border-2 border-[#114AB1] dark:border-[#6793AC] shadow-sm'
                    : 'hover:bg-[#EBF2F7]/60 dark:hover:bg-[#114AB1]/10 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-tech font-bold text-[11px] text-[#114AB1] dark:text-[#FEFEFE]">
                      [{det.id}]
                    </span>
                    <span className="font-sans font-bold text-xs text-[#114AB1] dark:text-[#FEFEFE]">
                      {det.class_name.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.2 rounded bg-[#EBF2F7] dark:bg-[#114AB1]/20 text-[#114AB1] dark:text-[#6793AC] font-tech font-bold text-[10px] border border-[#6793AC] dark:border-[#114AB1]">
                      {Math.round(det.confidence * 100)}%
                    </span>
                    {renderPriorityBadge(det.priority)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#6793AC] font-tech">
                  <span>
                    GPS: {det.latitude.toFixed(5)}°N, {det.longitude.toFixed(5)}°E
                  </span>
                  <span>
                    BBOX: {det.bbox.width}×{det.bbox.height}px
                  </span>
                </div>

                {isFP && (
                  <div className="flex items-center gap-1 text-[9px] text-[#E4580B] font-bold uppercase">
                    <AlertTriangle className="w-3 h-3 text-[#E4580B]" />
                    <span>FLAGGED FALSE POSITIVE</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Target Inspector Details Footer */}
      {activeTarget ? (
        <div className="p-3 border-t border-[#EBF2F7] dark:border-[#114AB1]/40 bg-[#EBF2F7]/40 dark:bg-[#114AB1]/20 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#114AB1] dark:text-[#6793AC]" />
              <span className="font-tech font-bold text-xs text-[#114AB1] dark:text-[#FEFEFE]">
                TARGET INSPECTOR
              </span>
              <span className="font-bold text-xs text-[#114AB1] dark:text-[#FEFEFE]">
                [{activeTarget.id}]
              </span>
            </div>

            <button
              onClick={() => onSelectDetection(activeTarget.id)}
              className="text-[10px] text-[#6793AC] hover:text-[#114AB1] uppercase font-tech font-bold cursor-pointer"
            >
              Recenter
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="p-1.5 rounded bg-[#FEFEFE] dark:bg-[#0A1120] border border-[#6793AC] dark:border-[#114AB1]/40">
                <div className="text-[#6793AC] uppercase font-tech text-[9px]">
                  Classification
                </div>
                <div className="font-tech font-bold text-[#114AB1] dark:text-[#FEFEFE] flex items-center justify-between mt-0.5">
                  <span>{activeTarget.class_name.replace(/_/g, ' ')}</span>
                  <span className="text-[#E4580B]">
                    {Math.round(activeTarget.confidence * 100)}%
                  </span>
                </div>
              </div>

              <div className="p-1.5 rounded bg-[#FEFEFE] dark:bg-[#0A1120] border border-[#6793AC] dark:border-[#114AB1]/40">
                <div className="text-[#6793AC] uppercase font-tech text-[9px]">
                  Priority Level
                </div>
                <div className="font-tech font-bold text-[#114AB1] dark:text-[#FEFEFE] mt-0.5">
                  {activeTarget.priority.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-[#FEFEFE] dark:bg-[#0A1120] border border-[#6793AC] dark:border-[#114AB1]/40 text-[10px] font-tech">
              <span className="text-[#6793AC]">WGS84 GPS:</span>
              <span className="font-bold text-[#114AB1] dark:text-[#FEFEFE]">
                {activeTarget.latitude.toFixed(6)}° N, {activeTarget.longitude.toFixed(6)}° E
              </span>

              <button
                onClick={handleCopyGPS}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EBF2F7] dark:bg-[#114AB1]/20 hover:bg-[#6793AC] text-[#114AB1] hover:text-[#FEFEFE] cursor-pointer ml-1 shrink-0 font-bold"
              >
                {copiedId === activeTarget.id ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-[#114AB1]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5 text-[#114AB1]" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Actions for Selected Target */}
            <div className="flex items-center gap-1.5 pt-1">
              {onOpenTargetDiagnostics && (
                <button
                  onClick={() => onOpenTargetDiagnostics(activeTarget)}
                  className="flex-1 py-1 px-2 rounded bg-[#114AB1] hover:bg-[#114AB1]/90 text-[#FEFEFE] font-tech font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Activity className="w-3 h-3 text-[#FEFEFE]" />
                  <span>AI Diagnostics</span>
                </button>
              )}

              {onOpenAICoPilot && (
                <button
                  onClick={() =>
                    onOpenAICoPilot(
                      `Analyze target ${activeTarget.id} (${activeTarget.class_name}) detected at ${activeTarget.latitude.toFixed(4)}, ${activeTarget.longitude.toFixed(4)}.`
                    )
                  }
                  className="py-1 px-2 rounded bg-[#EBF2F7] dark:bg-[#114AB1]/20 hover:bg-[#6793AC] hover:text-[#FEFEFE] text-[#114AB1] dark:text-[#6793AC] border border-[#6793AC] dark:border-[#114AB1] font-tech font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                  title="Ask AQUAVISION AI assistant about this target"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Ask AI</span>
                </button>
              )}

              {onMarkFalsePositive && (
                <button
                  onClick={() => onMarkFalsePositive(activeTarget)}
                  className="py-1 px-2 rounded bg-[#EBF2F7] dark:bg-[#114AB1]/20 hover:bg-[#E4580B]/20 text-[#E4580B] border border-[#E4580B]/40 font-tech font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                  title="Flag as false positive detection"
                >
                  <AlertTriangle className="w-3 h-3" />
              Click any target in the list or bounding box on the waterfall to view deep inspection metrics.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
