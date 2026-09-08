import React from 'react';
import {
  History,
  Calendar,
  Clock,
  Target,
  ShieldAlert,
  ArrowRight,
  Download,
  Trash2,
  FileImage,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { StoredScanRecord, clearAllScanHistory, deleteScanFromHistory } from '../services/scanHistory';

interface MissionHistorySectionProps {
  history: StoredScanRecord[];
  onSelectScan: (record: StoredScanRecord) => void;
  onHistoryUpdate: (updated: StoredScanRecord[]) => void;
  currentResultId?: string | null;
  onOpenCockpit: () => void;
}

export const MissionHistorySection: React.FC<MissionHistorySectionProps> = ({
  history,
  onSelectScan,
  onHistoryUpdate,
  currentResultId,
  onOpenCockpit,
}) => {
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteScanFromHistory(id);
    onHistoryUpdate(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all stored survey scan records?')) {
      clearAllScanHistory();
      onHistoryUpdate([]);
    }
  };

  const handleExportHistory = () => {
    const jsonStr = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `marine_debris_missions_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 max-w-[1500px] mx-auto w-full font-sans select-none">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#93A8BC]/25 mb-4 shrink-0">
        <div>
          <h2 className="text-base sm:text-lg font-tech font-bold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-2">
            <History className="w-5 h-5 text-[#1BDFC8]" />
            <span>MISSION SURVEY ARCHIVE</span>
            <span className="px-2 py-0.5 rounded-full bg-[#1BDFC8] text-[#0A111E] text-xs font-bold font-tech">
              {history.length} Scans
            </span>
          </h2>
          <p className="text-xs text-[#93A8BC] mt-0.5">
            Archived side-scan sonar transects, YOLO object detections, and GPS telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                onClick={handleExportHistory}
                className="px-3 py-1.5 rounded-md bg-[#142238] hover:bg-[#2E96DB]/25 text-[#FFFFFF] border border-[#93A8BC]/30 text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-md bg-[#142238] hover:bg-[#2E96DB]/25 text-[#93A8BC] hover:text-[#FFFFFF] border border-[#93A8BC]/30 text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Archive</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* History Grid / List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {history.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#0F1A2C] border border-[#93A8BC]/25 rounded-lg">
            <History className="w-12 h-12 text-[#93A8BC]/40 mb-3" />
            <h3 className="font-tech font-bold uppercase text-sm text-[#FFFFFF]">
              No Mission Scans Stored
            </h3>
            <p className="text-xs text-[#93A8BC] mt-1 max-w-sm">
              Completed sonar surveys are automatically recorded here for long-term auditability and reporting.
            </p>
            <button
              onClick={onOpenCockpit}
              className="mt-4 px-4 py-2 rounded bg-[#1BDFC8] text-[#0A111E] font-tech font-bold text-xs uppercase tracking-wider hover:bg-[#1BDFC8]/90 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Open Cockpit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
            {history.map((record) => {
              const isActive = currentResultId === record.id;
              const dateStr = new Date(record.timestamp).toLocaleString();

              return (
                <div
                  key={record.id}
                  onClick={() => {
                    onSelectScan(record);
                    onOpenCockpit();
                  }}
                  className={`p-3 rounded-lg border bg-[#0F1A2C] flex flex-col justify-between cursor-pointer transition-all hover:shadow-md ${
                    isActive
                      ? 'border-[#1BDFC8] ring-2 ring-[#1BDFC8]/30'
                      : 'border-[#93A8BC]/25 hover:border-[#1BDFC8]'
                  }`}
                >
                  <div>
                    {/* Thumbnail & Badges */}
                    <div className="relative w-full h-32 rounded bg-[#0B1320] overflow-hidden mb-2.5 border border-[#93A8BC]/30">
                      {record.previewUrl ? (
                        <img
                          src={record.previewUrl}
                          alt={record.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#1BDFC8] font-tech">
                          ACOUSTIC WATERFALL
                        </div>
                      )}

                      {/* Active Pill */}
                      {isActive && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#1BDFC8] text-[#0A111E] font-tech text-[10px] font-bold uppercase tracking-wider">
                          Active in Cockpit
                        </span>
                      )}

                      {/* Engine Tag */}
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-[#0F1A2C]/90 text-[#1BDFC8] font-tech text-[9px] font-bold border border-[#93A8BC]/30 uppercase">
                        {record.engineUsed?.toUpperCase() || 'YOLO_V8'}
                      </span>
                    </div>

                    {/* File Name & Time */}
                    <h4 className="font-tech font-bold text-xs text-[#FFFFFF] truncate">
                      {record.filename}
                    </h4>
                    <div className="text-[10px] text-[#93A8BC] flex items-center gap-1 mt-0.5 font-tech">
                      <Clock className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="mt-3 pt-2.5 border-t border-[#93A8BC]/25 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-tech font-bold">
                      <span className="text-[#FFFFFF]">
                        {record.detectionCount} Targets
                      </span>
                      {record.criticalCount > 0 && (
                        <span className="text-[#1BDFC8] text-[10px]">
                          • {record.criticalCount} Critical
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDelete(record.id, e)}
                        className="p-1 rounded hover:bg-[#142238] text-[#93A8BC] hover:text-[#FFFFFF] transition cursor-pointer"
                        title="Delete scan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <span className="px-2 py-1 rounded bg-[#1BDFC8] text-[#0A111E] font-tech text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-[#1BDFC8]/90">
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
