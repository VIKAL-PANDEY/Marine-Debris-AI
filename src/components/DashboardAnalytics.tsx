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
    { label: '25% - 50%', min: 0.25, max: 0.5, count: 0, color: '#6793AC' },
    { label: '50% - 75%', min: 0.5, max: 0.75, count: 0, color: '#EBF2F7' },
    { label: '75% - 90%', min: 0.75, max: 0.9, count: 0, color: '#E4580B' },
    { label: '90% - 100%', min: 0.9, max: 1.01, count: 0, color: '#114AB1' },
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
    <div className="bg-[#FEFEFE] dark:bg-[#0A1120] border border-[#EBF2F7] dark:border-[#114AB1]/40 rounded-lg overflow-hidden shadow-sm font-sans transition-all">
      {/* Header with Collapsible Toggle */}
      <div
        onClick={onToggleCollapse}
        className="p-3 border-b border-[#EBF2F7] dark:border-[#114AB1]/40 flex items-center justify-between cursor-pointer hover:bg-[#EBF2F7]/60 dark:hover:bg-[#114AB1]/10 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#EBF2F7] dark:bg-[#114AB1]/20 border border-[#6793AC] flex items-center justify-center text-[#114AB1] dark:text-[#6793AC]">
            <TrendingUp className="w-4 h-4 text-[#114AB1] dark:text-[#6793AC]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-tech font-bold uppercase tracking-wider text-[#114AB1] dark:text-[#FEFEFE] flex items-center gap-2">
              <span>SURVEY INTELLIGENCE & ANOMALY TRENDS</span>
              <Tooltip
                title="Telemetry Trends"
                content="Aggregated YOLO detection trends, confidence heatmaps, and quick access to previous hydrographic survey transects."
              />
            </h3>
            <p className="text-[10px] text-[#6793AC] dark:text-[#6793AC]/80">
              Confidence heatmap distributions, hazard classifications, and multi-transect telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-tech text-[#114AB1] dark:text-[#6793AC]">
            <span className="px-2 py-0.5 rounded bg-[#EBF2F7] dark:bg-[#114AB1]/20 border border-[#6793AC] dark:border-[#114AB1] font-bold">
              AVG CONF: {avgConfidence.toFixed(1)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-[#114AB1] text-[#FEFEFE] font-bold">
              {totalDetectionsCount} DETECTIONS
            </span>
          </div>
          <button className="p-1 text-[#114AB1] dark:text-[#6793AC]">
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-tech text-[#114AB1] dark:text-[#6793AC]">
            <span className="px-2 py-0.5 rounded bg-[#EBF2F7] dark:bg-[#114AB1]/20 border border-[#6793AC] dark:border-[#114AB1] font-bold">
              {totalScansCount} Scans Analyzed
            </span>
            <span className="px-2 py-0.5 rounded bg-[#6793AC] text-[#FEFEFE] font-bold">
              {totalDebrisCount} Total Debris
            </span>
          </div>

          <button className="p-1 text-[#114AB1] dark:text-[#6793AC]">
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Grid Body */}
      {!isCollapsed && (
        <div className="p-3.5 space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Class Breakdown */}
            <div className="bg-[#EBF2F7]/60 dark:bg-[#114AB1]/20 p-3 rounded-lg border border-[#6793AC] dark:border-[#114AB1]/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#114AB1] dark:text-[#FEFEFE] flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5 text-[#114AB1]" />
                    <span>Debris Categorization</span>
                  </span>
                  <span className="text-[10px] font-tech text-[#6793AC]">
                    {sortedClasses.length} Unique Classes
                  </span>
                </div>

                {sortedClasses.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#6793AC]">
                    No debris detected yet
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {sortedClasses.slice(0, 5).map(([cls, count]) => {
                      const pct = Math.round((count / (allDetections.length || 1)) * 100);
                      return (
                        <div key={cls} className="space-y-0.5 text-xs font-sans">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="capitalize font-semibold text-[#114AB1] dark:text-[#6793AC]">
                              {cls.replace(/_/g, ' ')}
                            </span>
                            <span className="font-tech tabular-nums font-bold text-[#114AB1] dark:text-[#FEFEFE]">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[#FEFEFE] dark:bg-[#0A1120] rounded-full overflow-hidden border border-[#6793AC] dark:border-[#114AB1]/40">
                            <div
                              className="h-full bg-[#114AB1] dark:bg-[#6793AC] rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Confidence Histogram */}
            <div className="bg-[#EBF2F7]/60 dark:bg-[#114AB1]/20 p-3 rounded-lg border border-[#6793AC] dark:border-[#114AB1]/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#114AB1] dark:text-[#FEFEFE] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#E4580B]" />
                    <span>Confidence Spread</span>
                  </span>
                  <span className="text-[10px] font-tech text-[#114AB1] dark:text-[#6793AC] font-bold">
                    Avg: {avgConfidence}%
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 items-end pt-3">
                  {confidenceBins.map((bin) => {
                    const heightPct = Math.round((bin.count / maxBinCount) * 100);
                    return (
                      <div key={bin.label} className="flex flex-col items-center gap-1">
                        <span className="font-tech tabular-nums text-[10px] font-bold text-[#114AB1] dark:text-[#FEFEFE]">
                          {bin.count}
                        </span>
                        <div className="w-full h-16 bg-[#FEFEFE] dark:bg-[#0A1120] rounded flex items-end p-1 border border-[#6793AC] dark:border-[#114AB1]/40">
                          <div
                            className="w-full rounded transition-all duration-500"
                            style={{
                              height: `${Math.max(10, heightPct)}%`,
                              backgroundColor: bin.color,
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-tech text-center text-[#6793AC] whitespace-nowrap">
                          {bin.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-[#E4580B]/15 border border-[#E4580B]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E4580B]" />
                    <span className="text-xs font-bold font-tech text-[#E4580B] uppercase">Critical Priority</span>
                  </div>
                  <span className="font-tech font-bold text-xs text-[#E4580B] tabular-nums">
                    {criticalCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#6793AC]/20 border border-[#6793AC]/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#6793AC] border border-[#114AB1]" />
                    <span className="text-xs font-bold font-tech text-[#114AB1] dark:text-[#FEFEFE] uppercase">
                      Warning Priority
                    </span>
                  </div>
                  <span className="font-tech font-bold text-xs text-[#114AB1] dark:text-[#FEFEFE] tabular-nums">
                    {warningCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#EBF2F7] border border-[#6793AC]/40">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#6793AC]/60 border border-[#6793AC]" />
                    <span className="text-xs font-bold font-tech text-[#114AB1] dark:text-[#FEFEFE] uppercase">
                      Advisory Priority
                    </span>
                  </div>
                  <span className="font-tech font-bold text-xs text-[#114AB1] dark:text-[#FEFEFE] tabular-nums">
                    {advisoryCount}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-[#6793AC] dark:text-[#6793AC]/80">
                Action: Critical debris targets require priority ROV grapple salvage.
              </div>
            </div>
          </div>

          {/* Recent Mission Scans Quick Carousel */}
          {history.length > 0 && (
            <div className="pt-2 border-t border-[#EBF2F7] dark:border-[#114AB1]/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#114AB1] dark:text-[#FEFEFE] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recent Survey Scans (Click to restore)</span>
                </span>
                <span className="text-[10px] text-[#6793AC] dark:text-[#6793AC]/80">
                  {history.length} archived scans available
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {history.slice(0, 6).map((record) => (
                  <button
                    key={record.id}
                    onClick={() => onSelectScan(record)}
                    className="p-2 rounded-lg border border-[#6793AC] dark:border-[#114AB1]/40 bg-[#FEFEFE] dark:bg-[#0A1120] hover:border-[#114AB1] hover:shadow transition text-left cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="w-full h-14 rounded bg-[#0A1120] overflow-hidden mb-1.5 border border-[#6793AC]/50">
                      {record.previewUrl ? (
                        <img
                          src={record.previewUrl}
                          alt={record.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6793AC]">
                          SONAR
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] font-tech font-bold truncate text-[#114AB1] dark:text-[#FEFEFE]">
                      {record.filename}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-[#6793AC] dark:text-[#6793AC]/80 mt-1">
                      <span className="font-tech tabular-nums font-semibold">
                        {record.detectionCount} DET
                      </span>
                      {record.criticalCount > 0 && (
                        <span className="text-[#E4580B] font-bold font-tech">
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
