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
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0B1320]/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md sm:max-w-lg bg-[#0F1A2C] h-full shadow-2xl flex flex-col border-l border-[#93A8BC]/25 font-sans text-[#93A8BC]">
        {/* Header */}
        <div className="p-4 border-b border-[#93A8BC]/25 flex items-center justify-between bg-[#0F1A2C]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#142238] border border-[#93A8BC]/30 flex items-center justify-center text-[#1BDFC8]">
              <History className="w-4 h-4 text-[#1BDFC8]" />
            </div>
            <div>
              <h3 className="text-sm font-tech font-bold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-2">
                <span>ACOUSTIC SCAN MISSION ARCHIVE</span>
                <span className="px-1.5 py-0.2 rounded bg-[#1BDFC8] text-[#0A111E] font-bold text-[10px] tabular-nums">
                  {history.length}
                </span>
              </h3>
              <p className="text-[10px] text-[#93A8BC]">
                Persistent local record of all completed bathymetric scans
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#93A8BC] hover:bg-[#142238] hover:text-[#FFFFFF] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-2.5 bg-[#142238] border-b border-[#93A8BC]/25 flex items-center justify-between text-xs">
          <button
            onClick={handleExportHistory}
            disabled={history.length === 0}
            className="px-2.5 py-1 rounded bg-[#0F1A2C] border border-[#93A8BC]/30 text-[#FFFFFF] hover:border-[#1BDFC8] hover:text-[#1BDFC8] transition flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>EXPORT ARCHIVE</span>
          </button>

          <button
            onClick={handleClearAll}
            disabled={history.length === 0}
            className="px-2.5 py-1 rounded bg-[#0F1A2C] border border-[#2E96DB]/40 text-[#2E96DB] hover:bg-[#2E96DB] hover:text-[#FFFFFF] transition flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR HISTORY</span>
          </button>
        </div>

        {/* Scan List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#93A8BC] space-y-2">
              <History className="w-8 h-8 opacity-40 mb-1" />
              <p className="text-xs font-tech font-bold uppercase tracking-wider text-[#FFFFFF]">
                NO STORED MISSION SCANS
              </p>
              <p className="text-[11px] max-w-xs text-[#93A8BC]">
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
                      ? 'bg-[#1BDFC8]/15 border-[#1BDFC8] shadow-sm ring-1 ring-[#1BDFC8]'
                      : 'bg-[#142238] border-[#93A8BC]/25 hover:border-[#2E96DB] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail preview */}
                    <div className="w-16 h-16 rounded overflow-hidden bg-[#0B1320] border border-[#93A8BC]/25 flex-shrink-0 relative">
                      {record.previewUrl ? (
                        <img
                          src={record.previewUrl}
                          alt={record.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#1BDFC8]">
                          <FileImage className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-[#0B1320]/80 text-[8px] font-tech text-[#FFFFFF] text-center font-bold">
                        {record.engineUsed.toUpperCase()}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-tech font-bold text-xs truncate text-[#FFFFFF]">
                          {record.filename}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-tech font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#1BDFC8] text-[#0A111E]">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-[#93A8BC]">
                        <span className="flex items-center gap-1 font-tech tabular-nums">
                          <Clock className="w-2.5 h-2.5" />
                          {dateStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-tech font-bold px-1.5 py-0.5 rounded bg-[#0F1A2C] text-[#93A8BC] border border-[#93A8BC]/30 flex items-center gap-1">
                          <Target className="w-2.5 h-2.5" />
                          <span>{record.detectionCount} DETECTIONS</span>
                        </span>
                        {record.criticalCount > 0 && (
                          <span className="text-[10px] font-tech font-bold px-1.5 py-0.5 rounded bg-[#1BDFC8] text-[#0A111E] flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span>{record.criticalCount} CRITICAL</span>
                          </span>
                        )}
                        {record.falsePositiveIds && record.falsePositiveIds.length > 0 && (
                          <span className="text-[10px] font-tech font-bold px-1.5 py-0.5 rounded bg-[#2E96DB]/20 text-[#2E96DB] border border-[#2E96DB]/40">
                            {record.falsePositiveIds.length} FLAGGED FP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete action */}
                    <button
                      onClick={(e) => handleDelete(record.id, e)}
                      title="Delete this scan from history"
                      className="text-[#93A8BC]/60 hover:text-[#2E96DB] transition p-1 cursor-pointer"
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
        <div className="p-3 border-t border-[#93A8BC]/25 bg-[#0F1A2C] flex items-center justify-between text-[11px] text-[#93A8BC]">
          <span>Click any archived scan to restore it to the viewport</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#1BDFC8] hover:bg-[#1BDFC8]/90 text-[#0A111E] font-bold uppercase text-[10px] font-tech cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
