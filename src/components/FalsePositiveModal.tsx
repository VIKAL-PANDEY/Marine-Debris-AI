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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#114AB1]/30 backdrop-blur-sm">
      <div className="bg-[#FEFEFE] dark:bg-[#0A1120] border border-[#EBF2F7] dark:border-[#114AB1] rounded-lg max-w-lg w-full shadow-2xl overflow-hidden font-sans text-[#114AB1] dark:text-[#6793AC]">
        {/* Header */}
        <div className="p-3.5 border-b border-[#EBF2F7] dark:border-[#114AB1]/40 bg-[#FEFEFE] dark:bg-[#0A1120] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#E4580B]/20 border border-[#E4580B] flex items-center justify-center text-[#E4580B]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-tech font-bold uppercase tracking-wider text-[#114AB1] dark:text-[#FEFEFE] flex items-center gap-1.5">
                <span>FLAG ANOMALY AS FALSE POSITIVE</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#6793AC] text-[#FEFEFE] font-bold">
                  {target.id}
                </span>
              </h3>
              <p className="text-[10px] text-[#114AB1]/70 dark:text-[#6793AC]/70">
                Provide hydrographer feedback to retrain the YOLO sonar detector
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#114AB1] dark:text-[#6793AC] hover:bg-[#EBF2F7] dark:hover:bg-[#114AB1]/20 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
          {/* Target snapshot info */}
          <div className="bg-[#EBF2F7] dark:bg-[#0A1120] p-2.5 rounded border border-[#6793AC] dark:border-[#114AB1] grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-[#114AB1]/70 dark:text-[#6793AC]/70 block font-medium">Original Class:</span>
              <span className="font-tech font-bold uppercase text-[#114AB1] dark:text-[#FEFEFE]">
                {target.class_name.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-[#114AB1]/70 dark:text-[#6793AC]/70 block font-medium">Confidence Score:</span>
              <span className="font-tech font-bold text-[#114AB1] dark:text-[#FEFEFE] tabular-nums">
                {(target.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-[#114AB1]/70 dark:text-[#6793AC]/70 block font-medium">WGS84 Coordinates:</span>
              <span className="font-tech font-bold text-[#114AB1] dark:text-[#FEFEFE] tabular-nums">
                {target.latitude.toFixed(5)}° N, {target.longitude.toFixed(5)}° E
              </span>
            </div>
            <div>
              <span className="text-[#114AB1]/70 dark:text-[#6793AC]/70 block font-medium">Bounding Box:</span>
              <span className="font-tech font-bold text-[#114AB1] dark:text-[#FEFEFE] tabular-nums">
                {target.bbox.width}×{target.bbox.height} px
              </span>
            </div>
          </div>

          {/* Reason Selector */}
          <div>
            <label className="block text-[11px] font-tech font-bold uppercase tracking-wider text-[#114AB1] dark:text-[#FEFEFE] mb-1.5">
              Select Hydrographic Reason:
            </label>
            <div className="space-y-1.5">
              {REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition text-[11px] ${
                    selectedReason === reason
                      ? 'bg-[#6793AC]/30 border-[#114AB1] dark:border-[#6793AC] font-semibold text-[#114AB1] dark:text-[#FEFEFE]'
                      : 'bg-[#FEFEFE] dark:bg-[#0A1120] border-[#EBF2F7] dark:border-[#114AB1]/40 text-[#114AB1]/80 dark:text-[#6793AC]/80 hover:bg-[#EBF2F7]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="fp_reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="text-[#114AB1] focus:ring-[#114AB1]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-[11px] font-tech font-bold uppercase tracking-wider text-[#114AB1] dark:text-[#FEFEFE] mb-1">
              Field Annotations / Retraining Note (Optional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Benthic profile shows periodic sand waves along heading 045°. Target lacked specular metallic rebound."
              rows={2}
              className="w-full p-2 text-xs font-sans rounded border border-[#6793AC] dark:border-[#114AB1] bg-[#FEFEFE] dark:bg-[#0A1120] text-[#114AB1] dark:text-[#FEFEFE] focus:outline-none focus:ring-1 focus:ring-[#114AB1]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EBF2F7] dark:border-[#114AB1]/40">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-[#EBF2F7] dark:border-[#114AB1] text-[#114AB1]/80 dark:text-[#6793AC] hover:bg-[#EBF2F7] dark:hover:bg-[#114AB1]/20 transition font-bold uppercase text-[10px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitted}
              className="px-4 py-1.5 rounded bg-[#E4580B] hover:bg-[#E4580B]/90 text-[#FEFEFE] font-bold uppercase tracking-wider transition cursor-pointer text-[10px] flex items-center gap-1.5 shadow"
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
