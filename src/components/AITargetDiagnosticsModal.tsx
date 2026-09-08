import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Layers,
  ShieldAlert,
  Wrench,
  AlertTriangle,
  RefreshCw,
  Compass,
  Cpu,
  Eye,
} from 'lucide-react';
import { DetectionItem, TargetAnalysisResult } from '../types/detection';
import { fetchTargetDiagnostics } from '../services/api';

interface AITargetDiagnosticsModalProps {
  target: DetectionItem | null;
  scanMetadata: any;
  isOpen: boolean;
  onClose: () => void;
}

export const AITargetDiagnosticsModal: React.FC<AITargetDiagnosticsModalProps> = ({
  target,
  scanMetadata,
  isOpen,
  onClose,
}) => {
  const [diagnostics, setDiagnostics] = useState<TargetAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDiagnostics = async () => {
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTargetDiagnostics(target, scanMetadata);
      setDiagnostics(data);
    } catch (err: any) {
      console.error('Target diagnostics error:', err);
      setError(err.message || 'Failed to retrieve target diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && target) {
      loadDiagnostics();
    }
  }, [isOpen, target]);

  if (!isOpen || !target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A111E]/80 backdrop-blur-sm">
      <div className="bg-[#0F1A2C] border border-[#93A8BC]/25 rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#FFFFFF]">
        {/* Modal Header */}
        <div className="p-3.5 border-b border-[#93A8BC]/25 bg-[#142238] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#0B1320] border border-[#93A8BC]/30 flex items-center justify-center text-[#1BDFC8]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-tech font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
                <span>TARGET ACOUSTIC AI DIAGNOSTICS</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1BDFC8] text-[#0A111E] border border-[#1BDFC8]/40 font-tech font-bold">
                  {target.id}
                </span>
              </h3>
              <p className="text-[10px] font-sans text-[#93A8BC]">
                Acoustic backscatter profile, benthic elevation & manipulator tooling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDiagnostics}
              disabled={loading}
              className="p-1 rounded bg-[#0F1A2C] hover:bg-[#2E96DB]/25 border border-[#93A8BC]/30 text-[#93A8BC] hover:text-[#FFFFFF] transition cursor-pointer text-xs font-bold"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#1BDFC8]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#93A8BC] hover:text-[#FFFFFF] hover:bg-[#0B1320] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
          {/* Target Base Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#142238] p-2.5 rounded border border-[#93A8BC]/25 text-[10px] font-sans">
            <div>
              <span className="text-[#93A8BC] font-medium block">Class:</span>
              <span className="font-tech font-bold text-[#FFFFFF] uppercase">
                {target.class_name.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-[#93A8BC] font-medium block">Confidence:</span>
              <span className="font-tech font-bold text-[#FFFFFF] tabular-nums">
                {(target.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-[#93A8BC] font-medium block">Priority:</span>
              <span
                className={`font-tech font-bold uppercase tracking-wider ${
                  target.priority === 'high'
                    ? 'text-[#1BDFC8]'
                    : target.priority === 'medium'
                    ? 'text-[#2E96DB]'
                    : 'text-[#93A8BC]'
                }`}
              >
                {target.priority}
              </span>
            </div>
            <div>
              <span className="text-[#93A8BC] font-medium block">Coordinates:</span>
              <span className="font-tech font-bold text-[#FFFFFF] tabular-nums">
                {target.latitude?.toFixed(4)}°N, {target.longitude?.toFixed(4)}°W
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2.5">
              <Sparkles className="w-7 h-7 text-[#1BDFC8] animate-spin" />
              <p className="text-xs font-tech font-bold text-[#FFFFFF] uppercase tracking-wider">
                EXTRACTING ACOUSTIC SIGNATURE & BENTHIC ELEVATION...
              </p>
            </div>
          ) : error ? (
            <div className="p-3 bg-[#142238] border border-[#2E96DB]/40 rounded text-[#1BDFC8] text-[11px] font-sans font-semibold">
              {error}
            </div>
          ) : diagnostics ? (
            <>
              {/* Material Composition & Signature */}
              <div className="p-3 rounded bg-[#142238] border border-[#93A8BC]/25 space-y-1">
                <span className="text-[10px] text-[#1BDFC8] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#1BDFC8]" />
                  <span className="text-[#FFFFFF]">MATERIAL & STRUCTURAL CLASSIFICATION</span>
                </span>
                <p className="text-[11px] text-[#93A8BC] font-sans leading-relaxed">
                  {diagnostics.material_classification}
                </p>
              </div>

              {/* Shadow Analysis & Elevation */}
              <div className="p-3 rounded bg-[#142238] border border-[#93A8BC]/25 space-y-1">
                <span className="text-[10px] text-[#1BDFC8] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#1BDFC8]" />
                  <span className="text-[#FFFFFF]">ACOUSTIC SHADOW & VERTICAL RELIEF</span>
                </span>
                <p className="text-[11px] text-[#93A8BC] font-sans leading-relaxed">
                  {diagnostics.acoustic_shadow_analysis}
                </p>
              </div>

              {/* Submerged Density & Biofouling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans">
                <div className="p-2.5 rounded bg-[#142238] border border-[#93A8BC]/25">
                  <span className="text-[#1BDFC8] font-tech font-bold block mb-1">
                    Mass & Submerged Buoyancy:
                  </span>
                  <p className="text-[#93A8BC]">
                    {diagnostics.submerged_density_and_mass}
                  </p>
                </div>
                <div className="p-2.5 rounded bg-[#142238] border border-[#93A8BC]/25">
                  <span className="text-[#1BDFC8] font-tech font-bold block mb-1">
                    Biofouling & Encrustation:
                  </span>
                  <p className="text-[#93A8BC]">
                    {diagnostics.biofouling_estimate}
                  </p>
                </div>
              </div>

              {/* Recovery Method */}
              <div className="p-3 rounded bg-[#142238] border border-[#93A8BC]/25 space-y-1">
                <span className="text-[10px] text-[#1BDFC8] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#1BDFC8]" />
                  <span className="text-[#FFFFFF]">RECOMMENDED ROV TOOLING & RECOVERY METHOD</span>
                </span>
                <p className="text-[11px] text-[#93A8BC] font-sans leading-relaxed">
                  {diagnostics.recommended_recovery_method}
                </p>
              </div>

              {/* Safety Warnings */}
              {diagnostics.safety_warnings && diagnostics.safety_warnings.length > 0 && (
                <div className="p-2.5 rounded bg-[#142238] border border-[#2E96DB]/40 space-y-1">
                  <span className="text-[10px] text-[#1BDFC8] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#1BDFC8]" />
                    <span>OPERATIONAL HAZARD ADVISORIES</span>
                  </span>
                  <ul className="list-disc list-inside text-[10px] font-sans text-[#93A8BC] space-y-0.5">
                    {diagnostics.safety_warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#142238] border-t border-[#93A8BC]/25 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#1BDFC8] hover:bg-[#1BDFC8]/90 text-[#0A111E] font-sans font-bold uppercase tracking-wider transition cursor-pointer text-xs"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
