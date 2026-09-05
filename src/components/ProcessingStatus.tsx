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
    <div className="bg-[#FEFEFE] border border-[#F2E8DF] rounded p-4 font-sans flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#F2E8DF] pb-2">
        <h2 className="text-[10px] font-tech font-bold uppercase tracking-wider text-[#415111] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#D2E186] border border-[#415111]/30 animate-pulse" />
          <span>HYDROGRAPHIC PROCESSING PIPELINE</span>
        </h2>
        <span className="text-[10px] text-[#415111] font-tech font-bold uppercase tracking-wider bg-[#F2E8DF] px-2 py-0.5 rounded border border-[#D2E186]">
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
        <div className="p-2 bg-[#F2E8DF] border border-[#D2E186] rounded text-[11px] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#415111] font-tech font-bold uppercase tracking-wider">
              <ListOrdered className="w-3.5 h-3.5" />
              <span>
                BATCH PROGRESS: SCAN {batchProgress.current} OF {batchProgress.total}
              </span>
            </div>
            <span className="text-[10px] text-[#415111]/70 font-tech font-bold tabular-nums">
              {Math.round(((batchProgress.current - 1) / batchProgress.total) * 100)}% COMPLETE
            </span>
          </div>

          {batchProgress.currentFilename && (
            <p className="text-[10px] text-[#415111] truncate font-sans">
              <span className="text-[#415111]/70 font-semibold">Active Transect:</span> <span className="font-tech font-semibold">{batchProgress.currentFilename}</span>
            </p>
          )}

          <div className="w-full h-1.5 bg-[#FEFEFE] rounded-full overflow-hidden border border-[#D2E186]">
            <div
              className="h-full bg-gradient-to-r from-[#FCBF93] via-[#FB8159] to-[#D2E186] transition-all duration-300 rounded-full"
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
                  ? 'border-[#415111] bg-[#F2E8DF] shadow-sm'
                  : isDone
                  ? 'border-[#D2E186] bg-[#D2E186]/30'
                  : 'border-[#F2E8DF] bg-[#FEFEFE] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                {isDone ? (
                  <div className="w-5 h-5 rounded-full border border-[#415111] flex items-center justify-center text-[10px] text-[#415111] font-tech font-bold shrink-0 bg-[#D2E186]">
                    ✓
                  </div>
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full border border-[#415111] flex items-center justify-center shrink-0 bg-[#415111]">
                    <div className="w-2 h-2 bg-[#D2E186] rounded-full animate-pulse" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#F2E8DF] flex items-center justify-center text-[10px] text-[#415111]/60 font-tech font-bold shrink-0 bg-[#F2E8DF]">
                    {idx + 1}
                  </div>
                )}
                <span
                  className={`text-xs font-sans font-semibold truncate text-[#415111]`}
                >
                  {s.label}
                </span>
              </div>
              <p className="text-[9px] text-[#415111]/70 line-clamp-1 pl-7 font-sans font-normal">
                {s.detail}
              </p>
            </div>
          );
        })}
      </div>

      {stage === 'error' && (
        <div className="mt-1 p-2.5 rounded bg-[#F2E8DF] border border-[#FB8159] text-[#FB8159] text-xs flex items-center gap-2 font-sans font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#FB8159]" />
          <span>Pipeline halted: {error || 'Unexpected acoustic processing failure'}</span>
        </div>
      )}
    </div>
  );
};

