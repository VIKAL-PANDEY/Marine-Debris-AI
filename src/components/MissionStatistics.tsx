import React from 'react';
import { Target, ShieldAlert, Anchor, Cpu, Waves, Zap } from 'lucide-react';
import { MissionStatistics as StatsType } from '../types/detection';

interface MissionStatisticsProps {
  statistics: StatsType | null;
  className?: string;
}

export const MissionStatistics: React.FC<MissionStatisticsProps> = ({ statistics, className = '' }) => {
  const stats = statistics || {
    total_detections: 0,
    ghost_nets: 0,
    other_debris: 0,
    high_priority: 0,
    inference_time_ms: undefined,
  };

  const hasInferenceTime = typeof stats.inference_time_ms === 'number';

  return (
    <div className={`bg-[#FEFEFE] dark:bg-[#0A1120] border border-[#EBF2F7] dark:border-[#114AB1]/40 rounded-lg p-3 font-sans flex flex-col gap-2 shadow-sm transition-colors ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-tech font-bold uppercase tracking-widest text-[#114AB1] dark:text-[#FEFEFE] flex items-center gap-1.5">
          <Waves className="w-3.5 h-3.5 text-[#114AB1] dark:text-[#6793AC]" />
          <span>MISSION TELEMETRY & SURVEY SUMMARY</span>
        </h2>
        {hasInferenceTime && (
          <span className="text-[10px] font-tech tabular-nums text-[#FEFEFE] font-bold bg-[#6793AC] px-2 py-0.5 rounded border border-[#114AB1]/20 flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#FEFEFE]" />
            <span>{stats.inference_time_ms?.toFixed(1)} ms</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Total Detections */}
        <div className="bg-[#EBF2F7]/60 dark:bg-[#114AB1]/20 p-2.5 rounded-md border border-[#6793AC] dark:border-[#114AB1]/50 flex flex-col justify-between">
          <div className="text-[10px] font-sans text-[#114AB1]/80 dark:text-[#6793AC]/80 uppercase tracking-wider flex items-center justify-between font-semibold">
            <span>Total Detections</span>
            <Target className="w-3 h-3 text-[#114AB1] dark:text-[#6793AC]" />
          </div>
          <div className="text-xl font-tech tabular-nums font-bold text-[#114AB1] dark:text-[#FEFEFE] my-0.5 tracking-tight">
            {stats.total_detections}
          </div>
          <div className="text-[9px] font-sans text-[#6793AC] leading-tight">
            YOLO localized objects
          </div>
        </div>

        {/* High Priority / Critical */}
        <div className="bg-[#EBF2F7]/60 dark:bg-[#114AB1]/20 p-2.5 rounded-md border border-[#E4580B] flex flex-col justify-between">
          <div className="text-[10px] font-sans text-[#E4580B] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Critical Priority</span>
            <ShieldAlert className="w-3 h-3 text-[#E4580B]" />
          </div>
          <div className="text-xl font-tech tabular-nums font-bold text-[#E4580B] my-0.5 tracking-tight">
            {stats.high_priority}
          </div>
          <div className="text-[9px] font-sans text-[#6793AC] leading-tight">
            Immediate hazard recovery
          </div>
        </div>

        {/* Ghost Nets */}
        <div className="bg-[#EBF2F7]/60 dark:bg-[#114AB1]/20 p-2.5 rounded-md border border-[#6793AC] dark:border-[#114AB1]/50 flex flex-col justify-between">
          <div className="text-[10px] font-sans text-[#114AB1] dark:text-[#FEFEFE] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Ghost Nets</span>
            <Anchor className="w-3 h-3 text-[#E4580B]" />
          </div>
          <div className="text-xl font-tech tabular-nums font-bold text-[#114AB1] dark:text-[#FEFEFE] my-0.5 tracking-tight">
            {stats.ghost_nets}
          </div>
          <div className="text-[9px] font-sans text-[#6793AC] leading-tight">
            Derelict fishing gear
          </div>
        </div>

        {/* Inference Latency */}
        <div className="bg-[#EBF2F7]/60 dark:bg-[#114AB1]/20 p-2.5 rounded-md border border-[#6793AC] dark:border-[#114AB1]/50 flex flex-col justify-between">
          <div className="text-[10px] font-sans text-[#114AB1] dark:text-[#6793AC] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Inference Speed</span>
            <Cpu className="w-3 h-3 text-[#114AB1] dark:text-[#6793AC]" />
          </div>
          <div className="text-xl font-tech tabular-nums font-bold text-[#114AB1] dark:text-[#FEFEFE] my-0.5 tracking-tight">
            {hasInferenceTime ? `${stats.inference_time_ms?.toFixed(1)} ms` : 'Standby'}
          </div>
          <div className="text-[9px] font-sans text-[#6793AC] leading-tight">
            ONNX Web Runtime (WASM)
          </div>
        </div>
      </div>
    </div>
  );
};
