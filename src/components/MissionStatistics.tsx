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
    <div className={`bg-[#0F1A2C] border border-[#93A8BC]/25 rounded-lg p-3 font-sans flex flex-col gap-2 shadow-sm transition-colors ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-tech font-bold uppercase tracking-widest text-[#FFFFFF] flex items-center gap-1.5">
          <Waves className="w-3.5 h-3.5 text-[#1BDFC8]" />
          <span>MISSION TELEMETRY & SURVEY SUMMARY</span>
        </h2>
        {hasInferenceTime && (
          <span className="text-[10px] font-tech tabular-nums text-[#0A111E] font-bold bg-[#1BDFC8] px-2 py-0.5 rounded border border-[#1BDFC8] flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#0A111E]" />
            <span>{stats.inference_time_ms?.toFixed(1)} ms</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Total Detections */}
        <div className="bg-[#142238] p-2.5 rounded-md border border-[#93A8BC]/25 flex flex-col justify-between">
          <div className="text-[10px] font-sans text-[#93A8BC] uppercase tracking-wider flex items-center justify-between font-semibold">
            <span>Total Detections</span>
            <Target className="w-3 h-3 text-[#1BDFC8]" />
          </div>
          <div className="text-xl font-tech tabular-nums font-bold text-[#1BDFC8] my-0.5 tracking-tight">
            {stats.total_detections}
          </div>
          <div className="text-[9px] font-sans text-[#93A8BC] leading-tight">
            YOLO localized objects
          </div>
        </div>

        {/* High Priority / Critical */}
        <div className="bg-[#142238] p-2.5 rounded-md border border-[#1BDFC8]/40 flex flex-col justify-between">
          <div className="text-[10px] font-sans text-[#1BDFC8] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Critical Priority</span>
            <ShieldAlert className="w-3 h-3 text-[#1BDFC8]" />
          </div>
          <div className="text-xl font-tech tabular-nums font-bold text-[#1BDFC8] my-0.5 tracking-tight">
            {stats.high_priority}
          </div>
          <div className="text-[9px] font-sans text-[#93A8BC] leading-tight">
            Immediate hazard recovery
          </div>
        </div>

        {/* Ghost Nets */}
        <div className="bg-[#142238] p-2.5 rounded-md border border-[#2E96DB]/40 flex flex-col justify-between">
          <div className="text-[10px] font-sans text-[#2E96DB] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Ghost Nets</span>
            <Anchor className="w-3 h-3 text-[#2E96DB]" />
          </div>
          <div className="text-xl font-tech tabular-nums font-bold text-[#2E96DB] my-0.5 tracking-tight">
            {stats.ghost_nets}
          </div>
          <div className="text-[9px] font-sans text-[#93A8BC] leading-tight">
            Derelict fishing gear
          </div>
        </div>

        {/* Inference Latency */}
        <div className="bg-[#142238] p-2.5 rounded-md border border-[#93A8BC]/25 flex flex-col justify-between">
          <div className="text-[10px] font-sans text-[#93A8BC] uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Inference Speed</span>
            <Cpu className="w-3 h-3 text-[#1BDFC8]" />
          </div>
          <div className="text-xl font-tech tabular-nums font-bold text-[#FFFFFF] my-0.5 tracking-tight">
            {hasInferenceTime ? `${stats.inference_time_ms?.toFixed(1)} ms` : 'Standby'}
          </div>
          <div className="text-[9px] font-sans text-[#93A8BC] leading-tight">
            ONNX Web Runtime (WASM)
          </div>
        </div>
      </div>
    </div>
  );
};
