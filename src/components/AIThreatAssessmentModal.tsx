import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ShieldAlert,
  Anchor,
  Fish,
  Clock,
  Wrench,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { DetectionResult, ThreatAssessmentResult } from '../types/detection';
import { fetchScanThreatAssessment } from '../services/api';

interface AIThreatAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: DetectionResult | null;
}

export const AIThreatAssessmentModal: React.FC<AIThreatAssessmentModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [assessment, setAssessment] = useState<ThreatAssessmentResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssessment = async () => {
    if (!result) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchScanThreatAssessment(result);
      setAssessment(data);
    } catch (err: any) {
      console.error('Threat assessment error:', err);
      setError(err.message || 'Failed to generate AI threat assessment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && result && !assessment) {
      loadAssessment();
    }
  }, [isOpen, result]);

  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-[#E4580B] border-[#E4580B] bg-[#E4580B]/15';
    if (score >= 45) return 'text-[#114AB1] border-[#6793AC] bg-[#EBF2F7]';
    return 'text-[#114AB1] border-[#6793AC] bg-[#6793AC]/30';
  };

  const getThreatBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-[#E4580B] text-[#FEFEFE] animate-pulse';
      case 'HIGH':
        return 'bg-[#E4580B] text-[#FEFEFE]';
      case 'MODERATE':
        return 'bg-[#EBF2F7] text-[#114AB1] border border-[#E4580B]';
      default:
        return 'bg-[#6793AC] text-[#FEFEFE] border border-[#114AB1]/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#114AB1]/30 backdrop-blur-sm">
      <div className="bg-[#FEFEFE] border border-[#EBF2F7] rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#114AB1]">
        {/* Modal Header */}
        <div className="p-3.5 border-b border-[#EBF2F7] bg-[#FEFEFE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#EBF2F7] border border-[#6793AC] flex items-center justify-center text-[#114AB1]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-tech font-bold text-[#114AB1] uppercase tracking-wider flex items-center gap-2">
                <span>AI THREAT & ECOLOGICAL ASSESSMENT</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#6793AC] text-[#FEFEFE] border border-[#114AB1]/20 font-tech font-bold">
                  OPENROUTER / GEMINI
                </span>
              </h3>
              <p className="text-[10px] font-sans text-[#114AB1]/70">
                Hydrographic risk modeling, ghost-fishing impact, and salvage feasibility
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAssessment}
              disabled={loading}
              className="p-1.5 rounded bg-[#EBF2F7] hover:bg-[#6793AC] border border-[#6793AC] text-[#114AB1] transition cursor-pointer text-xs flex items-center gap-1 font-sans font-bold uppercase tracking-wider"
              title="Regenerate Assessment"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#114AB1]' : ''}`} />
              <span className="hidden sm:inline text-[10px]">REGENERATE</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded bg-[#EBF2F7] hover:bg-[#6793AC] border border-[#6793AC] text-[#114AB1] transition cursor-pointer text-xs flex items-center gap-1 font-sans font-bold uppercase tracking-wider"
              title="Print Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">PRINT</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-[#114AB1] hover:bg-[#EBF2F7] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-[#114AB1] border-t-transparent animate-spin flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#114AB1]" />
              </div>
              <p className="text-sm font-tech font-bold text-[#114AB1] uppercase tracking-wider">
                ANALYZING ACOUSTIC DETECTIONS WITH AI...
              </p>
              <p className="text-[11px] font-sans text-[#114AB1]/70 text-center max-w-md">
                Computing benthic degradation rates, entanglement danger indices, and ROV recovery logistics.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded bg-[#E4580B]/10 border border-[#E4580B]/40 text-[#E4580B] space-y-2 font-sans">
              <div className="flex items-center gap-2 font-bold font-tech uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>ASSESSMENT GENERATION FAILED</span>
              </div>
              <p className="text-[11px] text-[#114AB1]">{error}</p>
              <button
                onClick={loadAssessment}
                className="mt-2 px-3 py-1 bg-[#E4580B] hover:bg-[#E4580B]/90 text-[#FEFEFE] rounded text-[10px] font-sans font-bold cursor-pointer uppercase tracking-wider"
              >
                RETRY ANALYSIS
              </button>
            </div>
          ) : assessment ? (
            <>
              {/* Executive Threat Overview Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Threat Index Gauge Card */}
                <div
                  className={`p-3.5 rounded border flex flex-col items-center justify-center text-center gap-1 ${getScoreColor(
                    assessment.hazard_score
                  )}`}
                >
                  <span className="text-[10px] uppercase font-tech font-bold tracking-wider">
                    HAZARD THREAT INDEX
                  </span>
                  <div className="text-3xl sm:text-4xl font-tech font-extrabold my-1 tabular-nums">
                    {assessment.hazard_score}
                    <span className="text-sm font-sans font-normal text-[#114AB1]/70">/100</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-tech font-bold uppercase tracking-wider ${getThreatBadge(
                      assessment.threat_level
                    )}`}
                  >
                    {assessment.threat_level} THREAT
                  </span>
                </div>

                {/* Executive Summary */}
                <div className="md:col-span-3 p-3.5 rounded bg-[#EBF2F7] border border-[#6793AC] flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-[#114AB1] font-tech font-bold uppercase tracking-wider mb-1">
                      <span>EXECUTIVE HYDROGRAPHIC SUMMARY</span>
                      <span className="text-[#114AB1]/70 font-tech font-semibold tabular-nums">
                        {result?.detections.length} ANOMALIES RECORDED
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-[#114AB1] leading-relaxed">
                      {assessment.executive_summary}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#114AB1] pt-2 border-t border-[#6793AC] font-sans">
                    <span>
                      Recovery Difficulty:{' '}
                      <strong className="text-[#114AB1] font-bold">
                        {assessment.salvage_recommendations.recovery_difficulty}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Estimated Op Window:{' '}
                      <strong className="text-[#E4580B] font-bold">
                        {assessment.salvage_recommendations.estimated_operation_hours}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Ecological & Wildlife Threat Matrix */}
              <div className="p-3.5 rounded bg-[#EBF2F7]/60 border border-[#6793AC] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-tech font-bold text-[#114AB1] uppercase tracking-wider">
                  <Fish className="w-4 h-4 text-[#114AB1]" />
                  <span>BENTHIC & MARINE WILDLIFE IMPACT ASSESSMENT</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-sans">
                  <div className="p-2.5 rounded bg-[#FEFEFE] border border-[#6793AC]">
                    <span className="text-[#114AB1] font-bold block mb-1">
                      Ghost Fishing & Entanglement:
                    </span>
                    <p className="text-[#114AB1]/90">
                      {assessment.ecological_impact.entanglement_risk}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-[#FEFEFE] border border-[#6793AC]">
                    <span className="text-[#114AB1] font-bold block mb-1">
                      Seabed & Coral Smothering:
                    </span>
                    <p className="text-[#114AB1]/90">
                      {assessment.ecological_impact.benthic_smothering}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-[#FEFEFE] border border-[#6793AC]">
                    <span className="text-[#114AB1] font-bold block mb-1">
                      Material Degradation Half-Life:
                    </span>
                    <p className="text-[#114AB1]/90">
                      {assessment.ecological_impact.degradation_timeline}
                    </p>
                  </div>
                </div>

                {assessment.ecological_impact.wildlife_hazards && (
                  <div className="pt-2 border-t border-[#6793AC] flex flex-wrap items-center gap-1.5 font-sans">
                    <span className="text-[10px] text-[#114AB1] font-tech font-bold uppercase tracking-wider">
                      Targeted Biological Hazards:
                    </span>
                    {assessment.ecological_impact.wildlife_hazards.map((h, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-[#EBF2F7] border border-[#6793AC] text-[#114AB1] text-[10px] font-medium"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigational & Towfish Safety Matrix */}
              <div className="p-3.5 rounded bg-[#EBF2F7]/60 border border-[#6793AC] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-tech font-bold text-[#114AB1] uppercase tracking-wider">
                  <Anchor className="w-4 h-4 text-[#114AB1]" />
                  <span>MARITIME NAVIGATION & TOWFISH RISK ANALYSIS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-sans">
                  <div className="p-2.5 rounded bg-[#FEFEFE] border border-[#6793AC]">
                    <span className="text-[#114AB1] font-bold block mb-1">
                      Towfish Acoustic Umbilical:
                    </span>
                    <p className="text-[#114AB1]/90">
                      {assessment.navigational_threats.towfish_safety}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-[#FEFEFE] border border-[#6793AC]">
                    <span className="text-[#114AB1] font-bold block mb-1">
                      Surface Vessel / Propulsion:
                    </span>
                    <p className="text-[#114AB1]/90">
                      {assessment.navigational_threats.surface_vessel_hazard}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-[#FEFEFE] border border-[#6793AC]">
                    <span className="text-[#114AB1] font-bold block mb-1">
                      Anchor Fouling Probability:
                    </span>
                    <p className="text-[#114AB1]/90">
                      {assessment.navigational_threats.anchor_fouling_risk}
                    </p>
                  </div>
                </div>
              </div>

              {/* Salvage Operations & Remediation Strategy */}
              <div className="p-3.5 rounded bg-[#EBF2F7]/60 border border-[#6793AC] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-tech font-bold text-[#114AB1] uppercase tracking-wider">
                  <Wrench className="w-4 h-4 text-[#114AB1]" />
                  <span>ACTIONABLE SALVAGE & ROV RECOVERY DISPATCH</span>
                </div>

                <div className="p-2.5 rounded bg-[#FEFEFE] border border-[#6793AC] space-y-2 font-sans">
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-[#114AB1] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#114AB1] text-[11px] uppercase font-tech">
                        Primary Operational Directive:
                      </span>
                      <p className="text-[#114AB1] text-[11px] mt-0.5">
                        {assessment.salvage_recommendations.priority_action}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#6793AC] flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-[#114AB1] font-tech font-bold uppercase tracking-wider">
                      Recommended Equipment Manifest:
                    </span>
                    {assessment.salvage_recommendations.suggested_equipment.map((eq, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-[#6793AC] border border-[#114AB1]/20 text-[#FEFEFE] text-[10px] font-sans font-medium"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Regulatory Compliance Footer Note */}
              <div className="p-2.5 rounded bg-[#EBF2F7] border border-[#6793AC] text-[10px] flex items-center gap-2 text-[#114AB1] font-sans">
                <CheckCircle2 className="w-4 h-4 text-[#114AB1] shrink-0" />
                <span>
                  <strong>Regulatory Standard:</strong> {assessment.regulatory_notes}
                </span>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#FEFEFE] border-t border-[#EBF2F7] flex items-center justify-between">
          <span className="text-[10px] text-[#114AB1]/70 font-sans">
            Powered by OpenRouter LLM Intelligence • Hydrographic Debris Protocol
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#114AB1] hover:bg-[#114AB1]/90 text-[#FEFEFE] font-sans font-bold uppercase tracking-wider transition cursor-pointer text-xs"
          >
            CLOSE REPORT
          </button>
        </div>
      </div>
    </div>
  );
};
