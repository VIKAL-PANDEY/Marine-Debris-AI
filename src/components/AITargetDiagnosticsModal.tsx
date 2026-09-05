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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#114AB1]/30 backdrop-blur-sm">
      <div className="bg-[#FEFEFE] border border-[#EBF2F7] rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#114AB1]">
        {/* Modal Header */}
        <div className="p-3.5 border-b border-[#EBF2F7] bg-[#FEFEFE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#EBF2F7] border border-[#6793AC] flex items-center justify-center text-[#114AB1]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-tech font-bold text-[#114AB1] uppercase tracking-wider flex items-center gap-2">
                <span>TARGET ACOUSTIC AI DIAGNOSTICS</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#6793AC] text-[#FEFEFE] border border-[#114AB1]/30 font-tech font-bold">
                  {target.id}
                </span>
              </h3>
              <p className="text-[10px] font-sans text-[#114AB1]/70">
                Acoustic backscatter profile, benthic elevation & manipulator tooling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDiagnostics}
              disabled={loading}
              className="p-1 rounded bg-[#EBF2F7] hover:bg-[#6793AC] border border-[#6793AC] text-[#114AB1] transition cursor-pointer text-xs font-bold"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#114AB1]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#114AB1] hover:bg-[#EBF2F7] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
          {/* Target Base Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#EBF2F7] p-2.5 rounded border border-[#6793AC] text-[10px] font-sans">
            <div>
              <span className="text-[#114AB1]/70 font-medium block">Class:</span>
              <span className="font-tech font-bold text-[#114AB1] uppercase">
                {target.class_name.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-[#114AB1]/70 font-medium block">Confidence:</span>
              <span className="font-tech font-bold text-[#114AB1] tabular-nums">
                {(target.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-[#114AB1]/70 font-medium block">Priority:</span>
              <span
                className={`font-tech font-bold uppercase tracking-wider ${
                  target.priority === 'high'
                    ? 'text-[#E4580B]'
                    : target.priority === 'medium'
                    ? 'text-[#114AB1]'
                    : 'text-[#114AB1]'
                }`}
              >
                {target.priority}
              </span>
            </div>
            <div>
              <span className="text-[#114AB1]/70 font-medium block">Coordinates:</span>
              <span className="font-tech font-bold text-[#114AB1] tabular-nums">
                {target.latitude?.toFixed(4)}°N, {target.longitude?.toFixed(4)}°W
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2.5">
              <Sparkles className="w-7 h-7 text-[#114AB1] animate-spin" />
              <p className="text-xs font-tech font-bold text-[#114AB1] uppercase tracking-wider">
                EXTRACTING ACOUSTIC SIGNATURE & BENTHIC ELEVATION...
              </p>
            </div>
          ) : error ? (
            <div className="p-3 bg-[#E4580B]/15 border border-[#E4580B]/40 rounded text-[#E4580B] text-[11px] font-sans font-semibold">
              {error}
            </div>
          ) : diagnostics ? (
            <>
              {/* Material Composition & Signature */}
              <div className="p-3 rounded bg-[#EBF2F7]/60 border border-[#6793AC] space-y-1">
                <span className="text-[10px] text-[#114AB1] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#114AB1]" />
                  <span>MATERIAL & STRUCTURAL CLASSIFICATION</span>
                </span>
                <p className="text-[11px] text-[#114AB1] font-sans leading-relaxed">
                  {diagnostics.material_classification}
                </p>
              </div>

              {/* Shadow Analysis & Elevation */}
              <div className="p-3 rounded bg-[#EBF2F7]/60 border border-[#6793AC] space-y-1">
                <span className="text-[10px] text-[#114AB1] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#114AB1]" />
                  <span>ACOUSTIC SHADOW & VERTICAL RELIEF</span>
                </span>
                <p className="text-[11px] text-[#114AB1] font-sans leading-relaxed">
                  {diagnostics.acoustic_shadow_analysis}
                </p>
              </div>

              {/* Submerged Density & Biofouling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans">
                <div className="p-2.5 rounded bg-[#FEFEFE] border border-[#6793AC]">
                  <span className="text-[#114AB1] font-tech font-bold block mb-1">
                    Mass & Submerged Buoyancy:
                  </span>
                  <p className="text-[#114AB1]/80">
                    {diagnostics.submerged_density_and_mass}
                  </p>
                </div>
                <div className="p-2.5 rounded bg-[#FEFEFE] border border-[#6793AC]">
                  <span className="text-[#114AB1] font-tech font-bold block mb-1">
                    Biofouling & Encrustation:
                  </span>
                  <p className="text-[#114AB1]/80">
                    {diagnostics.biofouling_estimate}
                  </p>
                </div>
              </div>

              {/* Recovery Method */}
              <div className="p-3 rounded bg-[#EBF2F7] border border-[#6793AC] space-y-1">
                <span className="text-[10px] text-[#114AB1] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#114AB1]" />
                  <span>RECOMMENDED ROV TOOLING & RECOVERY METHOD</span>
                </span>
                <p className="text-[11px] text-[#114AB1] font-sans leading-relaxed">
                  {diagnostics.recommended_recovery_method}
                </p>
              </div>

              {/* Safety Warnings */}
              {diagnostics.safety_warnings && diagnostics.safety_warnings.length > 0 && (
                <div className="p-2.5 rounded bg-[#E4580B]/15 border border-[#E4580B]/40 space-y-1">
                  <span className="text-[10px] text-[#E4580B] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#E4580B]" />
                    <span>OPERATIONAL HAZARD ADVISORIES</span>
                  </span>
                  <ul className="list-disc list-inside text-[10px] font-sans text-[#114AB1] space-y-0.5">
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
        <div className="p-3 bg-[#FEFEFE] border-t border-[#EBF2F7] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#114AB1] hover:bg-[#114AB1]/90 text-[#FEFEFE] font-sans font-bold uppercase tracking-wider transition cursor-pointer text-xs"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
