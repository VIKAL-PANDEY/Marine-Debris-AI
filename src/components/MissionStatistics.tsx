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
    <div className={`bg-[#FEFEFE] dark:bg-[#15221B] border border-[#F2E8DF] dark:border-[#415111]/40 rounded-lg p-3 font-sans flex flex-col gap-2 shadow-sm transition-colors ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-tech font-bold uppercase tracking-widest text-[#415111] dark:text-[#FEFEFE] flex items-center gap-1.5">
          <Waves className="w-3.5 h-3.5 text-[#415111] dark:text-[#D2E186]" />
          <span>MISSION TELEMETRY & SURVEY SUMMARY</span>
        </h2>
        {hasInferenceTime && (
          <span className="text-[10px] font-tech tabular-nums text-[#415111] font-bold bg-[#D2E186] px-2 py-0.5 rounded border border-[#415111]/20 flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#415111]" />
            <span>{stats.inference_time_ms?.toFixed(1)} ms</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Total Detections */}
        <div className="bg-[#F2E8DF]/60 dark:bg-[#1E2E21] p-2.5 rounded-md border border-[#D2E186] dark:border-[#415111]/50 flex flex-col justify-between">
          <div className="text-[10px] font-sans text-[#415111]/80 dark:text-[#D2E186]/80 uppercase tracking-wider flex items-center justify-between font-semibold">
            <span>Total Detections</span>
            <Target className="w-3 h-3 text-[#415111] dark:text-[#D2E186]" />
          </div>
          <div className="text-xl font-tech tabular-nums font-bold text-[#415111] dark:text-[#FEFEFE] my-0.5 tracking-tight">
            {stats.total_detections}
          </div>
          <div className="text-[9px] font-sans text-[#415111]/70 dark:text-[#D2E186]/70 leading-tight">
            YOLO localized objects
          </div>
        </div>

        {/* High Priority / Critical */}
        <div className="bg-[#F2E8DF]/60 dark:bg-[#1E2E21] p-2.5 rounded-md border border-[#FB8159] flex flex-col justify-between">
          <div className="text-[10px] font-sans text-[#FB8159] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Critical Priority</span>
            <ShieldAlert className="w-3 h-3 text-[#FB8159]" />
          </div>
          <div className="text-xl font-tech tabular-nums font-bold text-[#FB8159] my-0.5 tracking-tight">
            {stats.high_priority}
          </div>
          <div className="text-[9px] font-sans text-[#415111]/70 dark:text-[#D2E186]/70 leading-tight">
            Immediate hazard recovery
          </div>
        </div>

        {/* Ghost Nets */}
        <div className="bg-[#F2E8DF]/60 dark:bg-[#1E2E21] p-2.5 rounded-md border border-[#FCBF93] dark:border-[#415111]/50 flex flex-col justify-between">
          <div className="text-[10px] font-sans text-[#415111] dark:text-[#FEFEFE] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Ghost Nets</span>
            <Anchor className="w-3 h-3 text-[#FB8159]" />
          </div>
          <div className="text-xl font-tech tabular-nums font-bold text-[#415111] dark:text-[#FEFEFE] my-0.5 tracking-tight">
            {stats.ghost_nets}
          </div>
          <div className="text-[9px] font-sans text-[#415111]/70 dark:text-[#D2E186]/70 leading-tight">
            Derelict fishing gear
          </div>
        </div>

        {/* Inference Latency */}
        <div className="bg-[#F2E8DF]/60 dark:bg-[#1E2E21] p-2.5 rounded-md border border-[#D2E186] dark:border-[#415111]/50 flex flex-col justify-between">
          <div className="text-[10px] font-sans text-[#415111] dark:text-[#D2E186] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Inference Speed</span>
            <Cpu className="w-3 h-3 text-[#415111] dark:text-[#D2E186]" />
          </div>
          <div className="text-xl font-tech tabular-nums font-bold text-[#415111] dark:text-[#FEFEFE] my-0.5 tracking-tight">
            {hasInferenceTime ? `${stats.inference_time_ms?.toFixed(1)} ms` : 'Standby'}
          </div>
          <div className="text-[9px] font-sans text-[#415111]/70 dark:text-[#D2E186]/70 leading-tight">
            ONNX Web Runtime (WASM)
          </div>
        </div>
      </div>
    </div>
  );
};
