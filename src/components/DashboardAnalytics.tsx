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
    { label: '25% - 50%', min: 0.25, max: 0.5, count: 0, color: '#93A8BC' },
    { label: '50% - 75%', min: 0.5, max: 0.75, count: 0, color: '#2E96DB' },
    { label: '75% - 90%', min: 0.75, max: 0.9, count: 0, color: '#1BDFC8' },
    { label: '90% - 100%', min: 0.9, max: 1.01, count: 0, color: '#1BDFC8' },
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
    <div className="bg-[#0F1A2C] border border-[#93A8BC]/25 rounded-lg overflow-hidden shadow-sm font-sans transition-all">
      {/* Header with Collapsible Toggle */}
      <div
        onClick={onToggleCollapse}
        className="p-3 border-b border-[#93A8BC]/25 flex items-center justify-between cursor-pointer hover:bg-[#142238]/50 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#0B1320] border border-[#93A8BC]/30 flex items-center justify-center text-[#1BDFC8]">
            <TrendingUp className="w-4 h-4 text-[#1BDFC8]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-tech font-bold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-2">
              <span>SURVEY INTELLIGENCE & ANOMALY TRENDS</span>
              <Tooltip
                title="Telemetry Trends"
                content="Aggregated YOLO detection trends, confidence heatmaps, and quick access to previous hydrographic survey transects."
              />
            </h3>
            <p className="text-[10px] text-[#93A8BC]">
              Confidence heatmap distributions, hazard classifications, and multi-transect telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-tech text-[#93A8BC]">
            <span className="px-2 py-0.5 rounded bg-[#142238] border border-[#93A8BC]/30 text-[#FFFFFF] font-bold">
              AVG CONF: {avgConfidence.toFixed(1)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-[#1BDFC8] text-[#0A111E] font-bold">
              {totalDetectionsCount} DETECTIONS
            </span>
          </div>
          <button className="p-1 text-[#93A8BC]">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="p-3.5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Anomaly Category Distribution */}
            <div className="bg-[#142238] p-3 rounded-lg border border-[#93A8BC]/25 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-[#1BDFC8]" />
                  <span>Debris Class Distribution</span>
                </span>
                <span className="text-[10px] font-tech text-[#93A8BC]">
                  {sortedClasses.length} TYPES
                </span>
              </div>

              {sortedClasses.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#93A8BC]">
                  No active debris targets logged yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedClasses.map(([cls, count]) => {
                    const pct = Math.round((count / totalDetectionsCount) * 100);
                    return (
                      <div key={cls} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="capitalize font-semibold text-[#93A8BC]">
                            {cls.replace(/_/g, ' ')}
                          </span>
                          <span className="font-tech tabular-nums font-bold text-[#FFFFFF]">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-[#0B1320] rounded-full overflow-hidden border border-[#93A8BC]/20">
                          <div
                            className="h-full bg-[#1BDFC8] rounded-full transition-all duration-300"
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
            <div className="bg-[#142238] p-3 rounded-lg border border-[#93A8BC]/25 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#1BDFC8]" />
                  <span>Confidence Heatmap</span>
                  <Tooltip
                    title="Confidence Bins"
                    content="Visual distribution of YOLO prediction probabilities across confidence ranges."
                  />
                </span>
                <span className="text-[10px] font-tech text-[#1BDFC8] font-bold">
                  AVG: {avgConfidence.toFixed(0)}%
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2">
                {confBins.map((bin) => {
                  const heightPct = Math.max(12, Math.round((bin.count / maxBinCount) * 100));
                  return (
                    <div key={bin.label} className="flex flex-col items-center gap-1.5">
                      <span className="font-tech tabular-nums text-[10px] font-bold text-[#FFFFFF]">
                        {bin.count}
                      </span>
                      <div className="w-full h-16 bg-[#0B1320] rounded flex items-end p-1 border border-[#93A8BC]/25">
                        <div
                          className="w-full rounded-sm transition-all duration-300"
                          style={{
                            height: `${heightPct}%`,
                            backgroundColor: bin.color,
                          }}
                        />
                      </div>
                      <span className="text-[9px] font-tech text-center text-[#93A8BC] whitespace-nowrap">
                        {bin.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-[#93A8BC]/25 flex items-center justify-between text-[10px] text-[#93A8BC]">
                <span>Model Calibration: Optimal</span>
                <span className="font-tech font-bold text-[#FFFFFF]">YOLOv8 INT8/FP32</span>
              </div>
            </div>

            {/* 3. Threat Priority Matrix & Impact */}
            <div className="bg-[#142238] p-3 rounded-lg border border-[#93A8BC]/25 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#1BDFC8]" />
                  <span>Threat Matrix</span>
                </span>
                <span className="text-[10px] font-tech text-[#1BDFC8] font-bold">
                  {criticalCount} CRITICAL
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-[#1BDFC8]/15 border border-[#1BDFC8]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1BDFC8]" />
                    <span className="text-xs font-bold font-tech text-[#1BDFC8] uppercase">Critical Priority</span>
                  </div>
                  <span className="font-tech font-bold text-xs text-[#1BDFC8] tabular-nums">
                    {criticalCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#2E96DB]/15 border border-[#2E96DB]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2E96DB]" />
                    <span className="text-xs font-bold font-tech text-[#FFFFFF] uppercase">
                      Warning Priority
                    </span>
                  </div>
                  <span className="font-tech font-bold text-xs text-[#FFFFFF] tabular-nums">
                    {warningCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#93A8BC]/15 border border-[#93A8BC]/30">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#93A8BC]" />
                    <span className="text-xs font-bold font-tech text-[#FFFFFF] uppercase">
                      Advisory Priority
                    </span>
                  </div>
                  <span className="font-tech font-bold text-xs text-[#FFFFFF] tabular-nums">
                    {advisoryCount}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-[#93A8BC]">
                Action: Critical debris targets require priority ROV grapple salvage.
              </div>
            </div>
          </div>

          {/* Recent Mission Scans Quick Carousel */}
          {history.length > 0 && (
            <div className="pt-2 border-t border-[#93A8BC]/25">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#1BDFC8]" />
                  <span>Recent Survey Scans (Click to restore)</span>
                </span>
                <span className="text-[10px] text-[#93A8BC]">
                  {history.length} archived scans available
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {history.slice(0, 6).map((record) => (
                  <button
                    key={record.id}
                    onClick={() => onSelectScan?.(record)}
                    className="p-2 rounded-lg border border-[#93A8BC]/25 bg-[#142238] hover:border-[#1BDFC8] hover:shadow transition text-left cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="w-full h-14 rounded bg-[#0B1320] overflow-hidden mb-1.5 border border-[#93A8BC]/30">
                      {record.previewUrl ? (
                        <img
                          src={record.previewUrl}
                          alt={record.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#1BDFC8]">
                          SONAR
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] font-tech font-bold truncate text-[#FFFFFF]">
                      {record.filename}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-[#93A8BC] mt-1">
                      <span className="font-tech tabular-nums font-semibold">
                        {record.detectionCount} DET
                      </span>
                      {record.criticalCount > 0 && (
                        <span className="text-[#1BDFC8] font-bold font-tech">
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
