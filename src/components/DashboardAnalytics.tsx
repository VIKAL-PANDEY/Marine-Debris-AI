import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  Target,
  ShieldAlert,
  Flame,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DetectionItem, DetectionResult } from '../types/detection';
import { StoredScanRecord } from '../services/scanHistory';
import { Tooltip } from './Tooltip';

interface DashboardAnalyticsProps {
  currentResult: DetectionResult | null;
  history: StoredScanRecord[];
  onSelectScan?: (record: StoredScanRecord) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  currentResult,
  history,
  onSelectScan,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  // Aggregate all detections from current scan and history
  const activeDetections: DetectionItem[] = currentResult ? currentResult.detections : [];
  
  // Aggregate anomaly classes across active scan (or history if no active scan)
  const sourceDetections = activeDetections.length > 0 
    ? activeDetections 
    : history.flatMap((h) => h.result.detections);

  const totalDetectionsCount = sourceDetections.length;

  const classCounts: { [key: string]: number } = {};
  sourceDetections.forEach((d) => {
    const key = d.class_name.toLowerCase();
    classCounts[key] = (classCounts[key] || 0) + 1;
  });

  const sortedClasses = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);

  // Confidence distribution histogram (4 bins)
  const confBins = [
    { label: '25% - 50%', min: 0.25, max: 0.5, count: 0, color: '#D2E186' },
    { label: '50% - 75%', min: 0.5, max: 0.75, count: 0, color: '#FCBF93' },
    { label: '75% - 90%', min: 0.75, max: 0.9, count: 0, color: '#FB8159' },
    { label: '90% - 100%', min: 0.9, max: 1.01, count: 0, color: '#415111' },
  ];

  sourceDetections.forEach((d) => {
    const c = d.confidence;
    const bin = confBins.find((b) => c >= b.min && c < b.max);
    if (bin) bin.count++;
  });

  const maxBinCount = Math.max(1, ...confBins.map((b) => b.count));
  const avgConfidence = totalDetectionsCount > 0
    ? (sourceDetections.reduce((acc, d) => acc + d.confidence, 0) / totalDetectionsCount) * 100
    : 0;

  const criticalCount = sourceDetections.filter((d) => d.priority === 'high').length;
  const warningCount = sourceDetections.filter((d) => d.priority === 'medium').length;
  const advisoryCount = sourceDetections.filter((d) => d.priority === 'low').length;

  return (
    <div className="bg-[#FEFEFE] dark:bg-[#15221B] border border-[#F2E8DF] dark:border-[#415111]/40 rounded-lg overflow-hidden shadow-sm font-sans transition-all">
      {/* Header with Collapsible Toggle */}
      <div
        onClick={onToggleCollapse}
        className="p-3 border-b border-[#F2E8DF] dark:border-[#415111]/40 flex items-center justify-between cursor-pointer hover:bg-[#F2E8DF]/40 dark:hover:bg-[#1E2E21]/50 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#F2E8DF] dark:bg-[#1E2E21] border border-[#D2E186] flex items-center justify-center text-[#415111] dark:text-[#D2E186]">
            <TrendingUp className="w-4 h-4 text-[#415111] dark:text-[#D2E186]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#FEFEFE] flex items-center gap-2">
              <span>SURVEY INTELLIGENCE & ANOMALY TRENDS</span>
              <Tooltip
                title="Telemetry Trends"
                content="Aggregated YOLO detection trends, confidence heatmaps, and quick access to previous hydrographic survey transects."
              />
            </h3>
            <p className="text-[10px] text-[#415111]/70 dark:text-[#D2E186]/70">
              Confidence heatmap distributions, hazard classifications, and multi-transect telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-tech text-[#415111] dark:text-[#D2E186]">
            <span className="px-2 py-0.5 rounded bg-[#F2E8DF] dark:bg-[#1E2E21] border border-[#D2E186] dark:border-[#415111] font-bold">
              AVG CONF: {avgConfidence.toFixed(1)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-[#D2E186] text-[#415111] font-bold">
              {totalDetectionsCount} DETECTIONS
            </span>
          </div>
          <button className="p-1 text-[#415111] dark:text-[#D2E186]">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="p-3.5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Anomaly Category Distribution */}
            <div className="bg-[#F2E8DF]/60 dark:bg-[#1E2E21]/60 p-3 rounded-lg border border-[#D2E186] dark:border-[#415111]/40 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#FEFEFE] flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Debris Class Distribution</span>
                </span>
                <span className="text-[10px] font-tech text-[#415111]/70 dark:text-[#D2E186]/70">
                  {sortedClasses.length} TYPES
                </span>
              </div>

              {sortedClasses.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#415111]/60 dark:text-[#D2E186]/60">
                  No active debris targets logged yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedClasses.map(([cls, count]) => {
                    const pct = Math.round((count / totalDetectionsCount) * 100);
                    return (
                      <div key={cls} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="capitalize font-semibold text-[#415111] dark:text-[#D2E186]">
                            {cls.replace(/_/g, ' ')}
                          </span>
                          <span className="font-tech tabular-nums font-bold text-[#415111] dark:text-[#FEFEFE]">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-[#FEFEFE] dark:bg-[#15221B] rounded-full overflow-hidden border border-[#D2E186] dark:border-[#415111]/40">
                          <div
                            className="h-full bg-[#415111] dark:bg-[#D2E186] rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Confidence Heatmap / Histogram */}
            <div className="bg-[#F2E8DF]/60 dark:bg-[#1E2E21]/60 p-3 rounded-lg border border-[#D2E186] dark:border-[#415111]/40 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#FEFEFE] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#FB8159]" />
                  <span>Confidence Heatmap</span>
                  <Tooltip
                    title="Confidence Bins"
                    content="Visual distribution of YOLO prediction probabilities across confidence ranges."
                  />
                </span>
                <span className="text-[10px] font-tech text-[#415111] dark:text-[#D2E186] font-bold">
                  AVG: {avgConfidence.toFixed(0)}%
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2">
                {confBins.map((bin) => {
                  const heightPct = Math.max(12, Math.round((bin.count / maxBinCount) * 100));
                  return (
                    <div key={bin.label} className="flex flex-col items-center gap-1.5">
                      <span className="font-tech tabular-nums text-[10px] font-bold text-[#415111] dark:text-[#FEFEFE]">
                        {bin.count}
                      </span>
                      <div className="w-full h-16 bg-[#FEFEFE] dark:bg-[#15221B] rounded flex items-end p-1 border border-[#D2E186] dark:border-[#415111]/40">
                        <div
                          className="w-full rounded-sm transition-all duration-300"
                          style={{
                            height: `${heightPct}%`,
                            backgroundColor: bin.color,
                          }}
                        />
                      </div>
                      <span className="text-[9px] font-tech text-center text-[#415111]/80 dark:text-[#D2E186]/80 whitespace-nowrap">
                        {bin.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-[#D2E186]/60 dark:border-[#415111]/40 flex items-center justify-between text-[10px] text-[#415111]/70 dark:text-[#D2E186]/70">
                <span>Model Calibration: Optimal</span>
                <span className="font-tech font-bold text-[#415111] dark:text-[#FEFEFE]">YOLOv8 INT8/FP32</span>
              </div>
            </div>

            {/* 3. Threat Priority Matrix & Impact */}
            <div className="bg-[#F2E8DF]/60 dark:bg-[#1E2E21]/60 p-3 rounded-lg border border-[#D2E186] dark:border-[#415111]/40 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#FEFEFE] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FB8159]" />
                  <span>Threat Matrix</span>
                </span>
                <span className="text-[10px] font-tech text-[#FB8159] font-bold">
                  {criticalCount} CRITICAL
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-[#FB8159]/20 border border-[#FB8159]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FB8159]" />
                    <span className="text-xs font-bold font-tech text-[#FB8159] uppercase">Critical Priority</span>
                  </div>
                  <span className="font-tech font-bold text-xs text-[#FB8159] tabular-nums">
                    {criticalCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#FCBF93]/30 border border-[#FB8159]/40">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FCBF93] border border-[#FB8159]" />
                    <span className="text-xs font-bold font-tech text-[#415111] dark:text-[#FEFEFE] uppercase">
                      Warning Priority
                    </span>
                  </div>
                  <span className="font-tech font-bold text-xs text-[#415111] dark:text-[#FEFEFE] tabular-nums">
                    {warningCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#D2E186]/30 border border-[#415111]/30">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D2E186] border border-[#415111]/40" />
                    <span className="text-xs font-bold font-tech text-[#415111] dark:text-[#FEFEFE] uppercase">
                      Advisory Priority
                    </span>
                  </div>
                  <span className="font-tech font-bold text-xs text-[#415111] dark:text-[#FEFEFE] tabular-nums">
                    {advisoryCount}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-[#415111]/70 dark:text-[#D2E186]/70">
                Action: Critical debris targets require priority ROV grapple salvage.
              </div>
            </div>
          </div>

          {/* Recent Mission Scans Quick Carousel */}
          {history.length > 0 && (
            <div className="pt-2 border-t border-[#F2E8DF] dark:border-[#415111]/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#FEFEFE] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recent Survey Scans (Click to restore)</span>
                </span>
                <span className="text-[10px] text-[#415111]/70 dark:text-[#D2E186]/70">
                  {history.length} archived scans available
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {history.slice(0, 6).map((record) => (
                  <button
                    key={record.id}
                    onClick={() => onSelectScan(record)}
                    className="p-2 rounded-lg border border-[#D2E186] dark:border-[#415111]/40 bg-[#FEFEFE] dark:bg-[#1E2E21] hover:border-[#415111] hover:shadow transition text-left cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="w-full h-14 rounded bg-[#1A241A] overflow-hidden mb-1.5 border border-[#D2E186]/50">
                      {record.previewUrl ? (
                        <img
                          src={record.previewUrl}
                          alt={record.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#D2E186]">
                          SONAR
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] font-tech font-bold truncate text-[#415111] dark:text-[#FEFEFE]">
                      {record.filename}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-[#415111]/70 dark:text-[#D2E186]/70 mt-1">
                      <span className="font-tech tabular-nums font-semibold">
                        {record.detectionCount} DET
                      </span>
                      {record.criticalCount > 0 && (
                        <span className="text-[#FB8159] font-bold font-tech">
                          {record.criticalCount} CRIT
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
