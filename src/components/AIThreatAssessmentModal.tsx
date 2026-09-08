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
    if (score >= 75) return 'text-[#1BDFC8] border-[#1BDFC8] bg-[#1BDFC8]/15';
    if (score >= 45) return 'text-[#2E96DB] border-[#2E96DB] bg-[#2E96DB]/15';
    return 'text-[#93A8BC] border-[#93A8BC]/40 bg-[#93A8BC]/15';
  };

  const getThreatBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-[#1BDFC8] text-[#0A111E] animate-pulse font-bold';
      case 'HIGH':
        return 'bg-[#1BDFC8] text-[#0A111E] font-bold';
      case 'MODERATE':
        return 'bg-[#2E96DB] text-[#FFFFFF] font-bold';
      default:
        return 'bg-[#142238] text-[#93A8BC] border border-[#93A8BC]/30 font-bold';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A111E]/80 backdrop-blur-sm">
      <div className="bg-[#0F1A2C] border border-[#93A8BC]/25 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#FFFFFF]">
        {/* Modal Header */}
        <div className="p-3.5 border-b border-[#93A8BC]/25 bg-[#142238] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#0B1320] border border-[#93A8BC]/30 flex items-center justify-center text-[#1BDFC8]">
              <Sparkles className="w-4 h-4 text-[#1BDFC8]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-tech font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
                <span>AI THREAT & ECOLOGICAL ASSESSMENT</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1BDFC8] text-[#0A111E] border border-[#1BDFC8]/40 font-tech font-bold">
                  OPENROUTER / GEMINI
                </span>
              </h3>
              <p className="text-[10px] font-sans text-[#93A8BC]">
                Hydrographic risk modeling, ghost-fishing impact, and salvage feasibility
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAssessment}
              disabled={loading}
              className="p-1.5 rounded bg-[#0F1A2C] hover:bg-[#2E96DB]/25 border border-[#93A8BC]/30 text-[#93A8BC] hover:text-[#FFFFFF] transition cursor-pointer text-xs flex items-center gap-1 font-sans font-bold uppercase tracking-wider"
              title="Regenerate Assessment"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#1BDFC8]' : ''}`} />
              <span className="hidden sm:inline text-[10px]">REGENERATE</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded bg-[#0F1A2C] hover:bg-[#2E96DB]/25 border border-[#93A8BC]/30 text-[#93A8BC] hover:text-[#FFFFFF] transition cursor-pointer text-xs flex items-center gap-1 font-sans font-bold uppercase tracking-wider"
              title="Print Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">PRINT</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-[#93A8BC] hover:text-[#FFFFFF] hover:bg-[#0B1320] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-[#1BDFC8] border-t-transparent animate-spin flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#1BDFC8]" />
              </div>
              <p className="text-sm font-tech font-bold text-[#FFFFFF] uppercase tracking-wider">
                ANALYZING ACOUSTIC DETECTIONS WITH AI...
              </p>
              <p className="text-[11px] font-sans text-[#93A8BC] text-center max-w-md">
                Computing benthic degradation rates, entanglement danger indices, and ROV recovery logistics.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded bg-[#142238] border border-[#2E96DB]/40 text-[#1BDFC8] space-y-2 font-sans">
              <div className="flex items-center gap-2 font-bold font-tech uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-[#1BDFC8]" />
                <span>ASSESSMENT GENERATION FAILED</span>
              </div>
              <p className="text-[11px] text-[#93A8BC]">{error}</p>
              <button
                onClick={loadAssessment}
                className="mt-2 px-3 py-1 bg-[#1BDFC8] hover:bg-[#1BDFC8]/90 text-[#0A111E] rounded text-[10px] font-sans font-bold cursor-pointer uppercase tracking-wider"
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
                    <span className="text-sm font-sans font-normal text-[#93A8BC]">/100</span>
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
                <div className="md:col-span-3 p-3.5 rounded bg-[#142238] border border-[#93A8BC]/25 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-[#FFFFFF] font-tech font-bold uppercase tracking-wider mb-1">
                      <span>EXECUTIVE HYDROGRAPHIC SUMMARY</span>
                      <span className="text-[#93A8BC] font-tech font-semibold tabular-nums">
                        {result?.detections.length} ANOMALIES RECORDED
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-[#93A8BC] leading-relaxed">
                      {assessment.executive_summary}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#93A8BC] pt-2 border-t border-[#93A8BC]/20 font-sans">
                    <span>
                      Recovery Difficulty:{' '}
                      <strong className="text-[#FFFFFF] font-bold">
                        {assessment.salvage_recommendations.recovery_difficulty}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Estimated Op Window:{' '}
                      <strong className="text-[#1BDFC8] font-bold">
                        {assessment.salvage_recommendations.estimated_operation_hours}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Ecological & Wildlife Threat Matrix */}
              <div className="p-3.5 rounded bg-[#142238] border border-[#93A8BC]/25 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-tech font-bold text-[#FFFFFF] uppercase tracking-wider">
                  <Fish className="w-4 h-4 text-[#1BDFC8]" />
                  <span>BENTHIC & MARINE WILDLIFE IMPACT ASSESSMENT</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-sans">
                  <div className="p-2.5 rounded bg-[#0F1A2C] border border-[#93A8BC]/25">
                    <span className="text-[#1BDFC8] font-bold block mb-1">
                      Ghost Fishing & Entanglement:
                    </span>
                    <p className="text-[#93A8BC]">
                      {assessment.ecological_impact.entanglement_risk}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-[#0F1A2C] border border-[#93A8BC]/25">
                    <span className="text-[#1BDFC8] font-bold block mb-1">
                      Seabed & Coral Smothering:
                    </span>
                    <p className="text-[#93A8BC]">
                      {assessment.ecological_impact.benthic_smothering}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-[#0F1A2C] border border-[#93A8BC]/25">
                    <span className="text-[#1BDFC8] font-bold block mb-1">
                      Material Degradation Half-Life:
                    </span>
                    <p className="text-[#93A8BC]">
                      {assessment.ecological_impact.degradation_timeline}
                    </p>
                  </div>
                </div>

                {assessment.ecological_impact.wildlife_hazards && (
                  <div className="pt-2 border-t border-[#93A8BC]/20 flex flex-wrap items-center gap-1.5 font-sans">
                    <span className="text-[10px] text-[#FFFFFF] font-tech font-bold uppercase tracking-wider">
                      Targeted Biological Hazards:
                    </span>
                    {assessment.ecological_impact.wildlife_hazards.map((h, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-[#0B1320] border border-[#93A8BC]/30 text-[#93A8BC] text-[10px] font-medium"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigational & Towfish Safety Matrix */}
              <div className="p-3.5 rounded bg-[#142238] border border-[#93A8BC]/25 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-tech font-bold text-[#FFFFFF] uppercase tracking-wider">
                  <Anchor className="w-4 h-4 text-[#1BDFC8]" />
                  <span>MARITIME NAVIGATION & TOWFISH RISK ANALYSIS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-sans">
                  <div className="p-2.5 rounded bg-[#0F1A2C] border border-[#93A8BC]/25">
                    <span className="text-[#1BDFC8] font-bold block mb-1">
                      Towfish Acoustic Umbilical:
                    </span>
                    <p className="text-[#93A8BC]">
                      {assessment.navigational_threats.towfish_safety}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-[#0F1A2C] border border-[#93A8BC]/25">
                    <span className="text-[#1BDFC8] font-bold block mb-1">
                      Surface Vessel / Propulsion:
                    </span>
                    <p className="text-[#93A8BC]">
                      {assessment.navigational_threats.surface_vessel_hazard}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-[#0F1A2C] border border-[#93A8BC]/25">
                    <span className="text-[#1BDFC8] font-bold block mb-1">
                      Anchor Fouling Probability:
                    </span>
                    <p className="text-[#93A8BC]">
                      {assessment.navigational_threats.anchor_fouling_risk}
                    </p>
                  </div>
                </div>
              </div>

              {/* Salvage Operations & Remediation Strategy */}
              <div className="p-3.5 rounded bg-[#142238] border border-[#93A8BC]/25 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-tech font-bold text-[#FFFFFF] uppercase tracking-wider">
                  <Wrench className="w-4 h-4 text-[#1BDFC8]" />
                  <span>ACTIONABLE SALVAGE & ROV RECOVERY DISPATCH</span>
                </div>

                <div className="p-2.5 rounded bg-[#0F1A2C] border border-[#93A8BC]/25 space-y-2 font-sans">
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-[#1BDFC8] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1BDFC8] text-[11px] uppercase font-tech">
                        Primary Operational Directive:
                      </span>
                      <p className="text-[#93A8BC] text-[11px] mt-0.5">
                        {assessment.salvage_recommendations.priority_action}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#93A8BC]/20 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-[#FFFFFF] font-tech font-bold uppercase tracking-wider">
                      Recommended Equipment Manifest:
                    </span>
                    {assessment.salvage_recommendations.suggested_equipment.map((eq, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-[#142238] border border-[#93A8BC]/30 text-[#FFFFFF] text-[10px] font-sans font-medium"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Regulatory Compliance Footer Note */}
              <div className="p-2.5 rounded bg-[#142238] border border-[#93A8BC]/25 text-[10px] flex items-center gap-2 text-[#93A8BC] font-sans">
                <CheckCircle2 className="w-4 h-4 text-[#1BDFC8] shrink-0" />
                <span>
                  <strong className="text-[#FFFFFF]">Regulatory Standard:</strong> {assessment.regulatory_notes}
                </span>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#142238] border-t border-[#93A8BC]/25 flex items-center justify-between">
          <span className="text-[10px] text-[#93A8BC] font-sans">
            Powered by OpenRouter LLM Intelligence • Hydrographic Debris Protocol
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#1BDFC8] hover:bg-[#1BDFC8]/90 text-[#0A111E] font-sans font-bold uppercase tracking-wider transition cursor-pointer text-xs"
          >
            CLOSE REPORT
          </button>
        </div>
      </div>
    </div>
  );
};
