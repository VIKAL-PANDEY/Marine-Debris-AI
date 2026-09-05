import React from 'react';
import { UploadCloud, Layers, Target, CheckCircle2, AlertTriangle, Check, ListOrdered, Sparkles } from 'lucide-react';
import { ProcessingStage, BatchProgress } from '../types/detection';

interface ProcessingStatusProps {
  stage: ProcessingStage;
  error?: string | null;
  batchProgress?: BatchProgress | null;
  isBatchRunning?: boolean;
}

const STAGES = [
  {
    id: 'uploading',
    label: 'Upload Complete',
    detail: 'Acoustic raw waterfall ingested',
    icon: UploadCloud,
  },
  {
    id: 'preprocessing',
    label: 'Preprocessing',
    detail: 'OpenCV CLAHE & bilateral filter',
    icon: Layers,
  },
  {
    id: 'detecting',
    label: 'Detecting Anomalies',
    detail: 'Acoustic highlight/shadow saliency',
    icon: Target,
  },
  {
    id: 'completed',
    label: 'Finalizing Report',
    detail: 'WGS84 projection & survey ready',
    icon: CheckCircle2,
  },
];

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  stage,
  error,
  batchProgress,
  isBatchRunning,
}) => {
  if (stage === 'idle' && !isBatchRunning) return null;

  const stageOrder = ['idle', 'uploading', 'preprocessing', 'detecting', 'completed'];
  const currentIndex = stageOrder.indexOf(stage);

  return (
    <div className="bg-[#FEFEFE] border border-[#EBF2F7] rounded p-4 font-sans flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#EBF2F7] pb-2">
        <h2 className="text-[10px] font-tech font-bold uppercase tracking-wider text-[#114AB1] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#6793AC] border border-[#114AB1]/30 animate-pulse" />
          <span>HYDROGRAPHIC PROCESSING PIPELINE</span>
        </h2>
        <span className="text-[10px] text-[#114AB1] font-tech font-bold uppercase tracking-wider bg-[#EBF2F7] px-2 py-0.5 rounded border border-[#6793AC]">
          {isBatchRunning
            ? `BATCH SEQUENCE: ${batchProgress ? `${batchProgress.current}/${batchProgress.total}` : 'ACTIVE'}`
            : stage === 'error'
            ? 'PIPELINE HALTED'
            : stage === 'completed'
            ? 'SYNCHRONIZED / READY'
            : `${stage.toUpperCase()}...`}
        </span>
      </div>

      {/* Sequential Batch Status Indicator */}
      {batchProgress && (
        <div className="p-2 bg-[#EBF2F7] border border-[#6793AC] rounded text-[11px] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#114AB1] font-tech font-bold uppercase tracking-wider">
              <ListOrdered className="w-3.5 h-3.5" />
              <span>
                BATCH PROGRESS: SCAN {batchProgress.current} OF {batchProgress.total}
              </span>
            </div>
            <span className="text-[10px] text-[#114AB1]/70 font-tech font-bold tabular-nums">
              {Math.round(((batchProgress.current - 1) / batchProgress.total) * 100)}% COMPLETE
            </span>
          </div>

          {batchProgress.currentFilename && (
            <p className="text-[10px] text-[#114AB1] truncate font-sans">
              <span className="text-[#114AB1]/70 font-semibold">Active Transect:</span> <span className="font-tech font-semibold">{batchProgress.currentFilename}</span>
            </p>
          )}

          <div className="w-full h-1.5 bg-[#FEFEFE] rounded-full overflow-hidden border border-[#6793AC]">
            <div
              className="h-full bg-gradient-to-r from-[#E4580B] via-[#114AB1] to-[#6793AC] transition-all duration-300 rounded-full"
              style={{
                width: `${Math.max(5, ((batchProgress.current - (stage === 'completed' ? 0 : 0.5)) / batchProgress.total) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Steps Pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STAGES.map((s, idx) => {
          const stepIndex = idx + 1; // 1: uploading, 2: preprocessing, 3: detecting, 4: completed
          const isDone = currentIndex > stepIndex || stage === 'completed';
          const isCurrent = stage === s.id;

          return (
            <div
              key={s.id}
              className={`p-2 rounded border transition-all flex flex-col justify-between gap-1 ${
                isCurrent
                  ? 'border-[#114AB1] bg-[#EBF2F7] shadow-sm'
                  : isDone
                  ? 'border-[#6793AC] bg-[#6793AC]/30'
                  : 'border-[#EBF2F7] bg-[#FEFEFE] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                {isDone ? (
                  <div className="w-5 h-5 rounded-full border border-[#114AB1] flex items-center justify-center text-[10px] text-[#114AB1] font-tech font-bold shrink-0 bg-[#6793AC]">
                    ✓
                  </div>
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full border border-[#114AB1] flex items-center justify-center shrink-0 bg-[#114AB1]">
                    <div className="w-2 h-2 bg-[#6793AC] rounded-full animate-pulse" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#EBF2F7] flex items-center justify-center text-[10px] text-[#114AB1]/60 font-tech font-bold shrink-0 bg-[#EBF2F7]">
                    {idx + 1}
                  </div>
                )}
                <span
                  className={`text-xs font-sans font-semibold truncate text-[#114AB1]`}
                >
                  {s.label}
                </span>
              </div>
              <p className="text-[9px] text-[#114AB1]/70 line-clamp-1 pl-7 font-sans font-normal">
                {s.detail}
              </p>
            </div>
          );
        })}
      </div>

      {stage === 'error' && (
        <div className="mt-1 p-2.5 rounded bg-[#EBF2F7] border border-[#E4580B] text-[#E4580B] text-xs flex items-center gap-2 font-sans font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#E4580B]" />
          <span>Pipeline halted: {error || 'Unexpected acoustic processing failure'}</span>
        </div>
      )}
    </div>
  );
};

