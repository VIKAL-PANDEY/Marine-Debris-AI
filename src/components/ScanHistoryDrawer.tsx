import React from 'react';
import {
  X,
  History,
  Trash2,
  Download,
  FolderOpen,
  Calendar,
  Clock,
  Target,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  FileImage,
} from 'lucide-react';
import { StoredScanRecord, clearAllScanHistory, deleteScanFromHistory } from '../services/scanHistory';

interface ScanHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: StoredScanRecord[];
  onSelectScan: (record: StoredScanRecord) => void;
  onHistoryUpdate: (updated: StoredScanRecord[]) => void;
  currentResultId?: string | null;
}

export const ScanHistoryDrawer: React.FC<ScanHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectScan,
  onHistoryUpdate,
  currentResultId,
}) => {
  if (!isOpen) return null;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteScanFromHistory(id);
    onHistoryUpdate(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all stored scan history?')) {
      clearAllScanHistory();
      onHistoryUpdate([]);
    }
  };

  const handleExportHistory = () => {
    const jsonStr = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `marine_debris_scan_history_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#415111]/30 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md sm:max-w-lg bg-[#FEFEFE] dark:bg-[#15221B] h-full shadow-2xl flex flex-col border-l border-[#F2E8DF] dark:border-[#415111] font-sans text-[#415111] dark:text-[#D2E186]">
        {/* Header */}
        <div className="p-4 border-b border-[#F2E8DF] dark:border-[#415111]/40 flex items-center justify-between bg-[#FEFEFE] dark:bg-[#15221B]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#F2E8DF] dark:bg-[#1E2E21] border border-[#D2E186] flex items-center justify-center text-[#415111] dark:text-[#D2E186]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#FEFEFE] flex items-center gap-2">
                <span>ACOUSTIC SCAN MISSION ARCHIVE</span>
                <span className="px-1.5 py-0.2 rounded bg-[#D2E186] text-[#415111] font-bold text-[10px] tabular-nums">
                  {history.length}
                </span>
              </h3>
              <p className="text-[10px] text-[#415111]/70 dark:text-[#D2E186]/70">
                Persistent local record of all completed bathymetric scans
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#415111] dark:text-[#D2E186] hover:bg-[#F2E8DF] dark:hover:bg-[#1E2E21] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-2.5 bg-[#F2E8DF]/60 dark:bg-[#1E2E21]/60 border-b border-[#F2E8DF] dark:border-[#415111]/40 flex items-center justify-between text-xs">
          <button
            onClick={handleExportHistory}
            disabled={history.length === 0}
            className="px-2.5 py-1 rounded bg-[#FEFEFE] dark:bg-[#15221B] border border-[#D2E186] dark:border-[#415111] text-[#415111] dark:text-[#D2E186] hover:border-[#415111] transition flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>EXPORT ARCHIVE</span>
          </button>

          <button
            onClick={handleClearAll}
            disabled={history.length === 0}
            className="px-2.5 py-1 rounded bg-[#FEFEFE] dark:bg-[#15221B] border border-[#FB8159]/40 text-[#FB8159] hover:bg-[#FB8159] hover:text-[#FEFEFE] transition flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR HISTORY</span>
          </button>
        </div>

        {/* Scan List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#415111]/60 dark:text-[#D2E186]/60 space-y-2">
              <History className="w-8 h-8 opacity-40 mb-1" />
              <p className="text-xs font-tech font-bold uppercase tracking-wider">
                NO STORED MISSION SCANS
              </p>
              <p className="text-[11px] max-w-xs">
                Run analysis on any side-scan sonar image or transect preset to automatically record and store it in your mission history.
              </p>
            </div>
          ) : (
            history.map((record) => {
              const isCurrent = currentResultId === record.id;
              const dateStr = new Date(record.timestamp).toLocaleString();

              return (
                <div
                  key={record.id}
                  onClick={() => {
                    onSelectScan(record);
                    onClose();
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer relative group ${
                    isCurrent
                      ? 'bg-[#D2E186]/30 dark:bg-[#1E2E21] border-[#415111] dark:border-[#D2E186] shadow-sm ring-1 ring-[#415111]'
                      : 'bg-[#FEFEFE] dark:bg-[#18261E] border-[#F2E8DF] dark:border-[#415111]/40 hover:border-[#D2E186] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail preview */}
                    <div className="w-16 h-16 rounded overflow-hidden bg-[#1A241A] border border-[#D2E186] dark:border-[#415111] flex-shrink-0 relative">
                      {record.previewUrl ? (
                        <img
                          src={record.previewUrl}
                          alt={record.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#D2E186]">
                          <FileImage className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-[#000]/70 text-[8px] font-tech text-[#FEFEFE] text-center font-bold">
                        {record.engineUsed.toUpperCase()}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-tech font-bold text-xs truncate text-[#415111] dark:text-[#FEFEFE]">
                          {record.filename}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-tech font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#415111] text-[#FEFEFE]">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-[#415111]/70 dark:text-[#D2E186]/70">
                        <span className="flex items-center gap-1 font-tech tabular-nums">
                          <Clock className="w-2.5 h-2.5" />
                          {dateStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-tech font-bold px-1.5 py-0.5 rounded bg-[#F2E8DF] dark:bg-[#1E2E21] text-[#415111] dark:text-[#D2E186] border border-[#D2E186] dark:border-[#415111] flex items-center gap-1">
                          <Target className="w-2.5 h-2.5" />
                          <span>{record.detectionCount} DETECTIONS</span>
                        </span>
                        {record.criticalCount > 0 && (
                          <span className="text-[10px] font-tech font-bold px-1.5 py-0.5 rounded bg-[#FB8159] text-[#FEFEFE] flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span>{record.criticalCount} CRITICAL</span>
                          </span>
                        )}
                        {record.falsePositiveIds && record.falsePositiveIds.length > 0 && (
                          <span className="text-[10px] font-tech font-bold px-1.5 py-0.5 rounded bg-[#FCBF93] text-[#415111] border border-[#FB8159]">
                            {record.falsePositiveIds.length} FLAGGED FP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete action */}
                    <button
                      onClick={(e) => handleDelete(record.id, e)}
                      title="Delete this scan from history"
                      className="text-[#415111]/40 dark:text-[#D2E186]/40 hover:text-[#FB8159] transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#F2E8DF] dark:border-[#415111]/40 bg-[#FEFEFE] dark:bg-[#15221B] flex items-center justify-between text-[11px] text-[#415111]/70 dark:text-[#D2E186]/70">
          <span>Click any archived scan to restore it to the viewport</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#415111] text-[#FEFEFE] font-bold uppercase text-[10px] font-tech"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
