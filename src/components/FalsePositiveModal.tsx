import React, { useState } from 'react';
import { X, AlertTriangle, Check, ShieldAlert, Cpu, Download, RefreshCw } from 'lucide-react';
import { DetectionItem } from '../types/detection';

interface FalsePositiveModalProps {
  target: DetectionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetId: string, reason: string, notes: string) => void;
}

const REASONS = [
  'Natural rock / boulder outcrop',
  'Benthic sand wave / sediment ripple pattern',
  'School of fish / marine biomass',
  'Sonar towfish acoustic multipath artifact',
  'Water column thermocline reflection',
  'Benign seabed topography / coral reef',
  'Other / Unclassified natural feature',
];

export const FalsePositiveModal: React.FC<FalsePositiveModalProps> = ({
  target,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(REASONS[0]);
  const [notes, setNotes] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen || !target) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(target.id, selectedReason, notes);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A111E]/80 backdrop-blur-sm">
      <div className="bg-[#0F1A2C] border border-[#93A8BC]/25 rounded-lg max-w-lg w-full shadow-2xl overflow-hidden font-sans text-[#FFFFFF]">
        {/* Header */}
        <div className="p-3.5 border-b border-[#93A8BC]/25 bg-[#142238] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#2E96DB]/20 border border-[#2E96DB] flex items-center justify-center text-[#2E96DB]">
              <AlertTriangle className="w-4 h-4 text-[#2E96DB]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-tech font-bold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-1.5">
                <span>FLAG ANOMALY AS FALSE POSITIVE</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1BDFC8] text-[#0A111E] font-bold">
                  {target.id}
                </span>
              </h3>
              <p className="text-[10px] text-[#93A8BC]">
                Provide hydrographer feedback to retrain the YOLO sonar detector
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#93A8BC] hover:text-[#FFFFFF] hover:bg-[#0B1320] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
          {/* Target snapshot info */}
          <div className="bg-[#142238] p-2.5 rounded border border-[#93A8BC]/25 grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-[#93A8BC] block font-medium">Original Class:</span>
              <span className="font-tech font-bold uppercase text-[#FFFFFF]">
                {target.class_name.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-[#93A8BC] block font-medium">Confidence Score:</span>
              <span className="font-tech font-bold text-[#FFFFFF] tabular-nums">
                {(target.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-[#93A8BC] block font-medium">WGS84 Coordinates:</span>
              <span className="font-tech font-bold text-[#FFFFFF] tabular-nums">
                {target.latitude.toFixed(5)}° N, {target.longitude.toFixed(5)}° E
              </span>
            </div>
            <div>
              <span className="text-[#93A8BC] block font-medium">Bounding Box:</span>
              <span className="font-tech font-bold text-[#FFFFFF] tabular-nums">
                {target.bbox.width}×{target.bbox.height} px
              </span>
            </div>
          </div>

          {/* Reason Selector */}
          <div>
            <label className="block text-[11px] font-tech font-bold uppercase tracking-wider text-[#1BDFC8] mb-1.5">
              Select Hydrographic Reason:
            </label>
            <div className="space-y-1.5">
              {REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition text-[11px] ${
                    selectedReason === reason
                      ? 'bg-[#1BDFC8]/15 border-[#1BDFC8] font-semibold text-[#FFFFFF]'
                      : 'bg-[#0F1A2C] border-[#93A8BC]/25 text-[#93A8BC] hover:bg-[#142238]'
                  }`}
                >
                  <input
                    type="radio"
                    name="fp_reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-[#1BDFC8] text-[#1BDFC8] focus:ring-[#1BDFC8]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-[11px] font-tech font-bold uppercase tracking-wider text-[#1BDFC8] mb-1">
              Field Annotations / Retraining Note (Optional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Benthic profile shows periodic sand waves along heading 045°. Target lacked specular metallic rebound."
              rows={2}
              className="w-full p-2 text-xs font-sans rounded border border-[#93A8BC]/25 bg-[#0F1A2C] text-[#FFFFFF] placeholder:text-[#93A8BC]/50 focus:outline-none focus:ring-1 focus:ring-[#1BDFC8]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#93A8BC]/25">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-[#93A8BC]/30 text-[#93A8BC] hover:text-[#FFFFFF] hover:bg-[#142238] transition font-bold uppercase text-[10px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitted}
              className="px-4 py-1.5 rounded bg-[#2E96DB] hover:bg-[#2E96DB]/90 text-[#FFFFFF] font-bold uppercase tracking-wider transition cursor-pointer text-[10px] flex items-center gap-1.5 shadow"
            >
              {submitted ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>LOGGED TO RETRAIN QUEUE</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>CONFIRM FALSE POSITIVE</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
