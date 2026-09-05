import React from 'react';
import { X, Cpu, Layers, ShieldCheck, Code, Zap } from 'lucide-react';

interface ArchitectureInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureInfoModal: React.FC<ArchitectureInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#415111]/30 backdrop-blur-sm">
      <div className="bg-[#FEFEFE] border border-[#F2E8DF] rounded max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#415111]">
        {/* Modal Header */}
        <div className="p-3.5 border-b border-[#F2E8DF] bg-[#FEFEFE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#415111]" />
            <h3 className="text-xs font-tech font-bold text-[#415111] uppercase tracking-wider">
              MARINE DEBRIS AI • YOLO ONNX & HYDROGRAPHIC ARCHITECTURE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#415111] hover:bg-[#F2E8DF] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#415111]">
          {/* ONNX Integration Spec */}
          <div className="p-3.5 rounded bg-[#F2E8DF] border border-[#D2E186] text-[#415111] shadow-inner">
            <div className="flex items-center gap-2 font-tech font-bold uppercase tracking-wider mb-1 text-[#415111]">
              <Zap className="w-4 h-4 text-[#415111]" />
              <span>BROWSER-SIDE YOLO ONNX RUNTIME (WASM)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#415111] font-sans">
              The application uses <code className="text-[#415111] font-tech font-bold">onnxruntime-web</code> to execute
              custom-trained YOLO models directly inside the browser using WebAssembly. The model is loaded once,
              cached in memory, and accepts 640×640 letterboxed RGB Float32 tensors with NMS postprocessing.
            </p>
          </div>

          {/* Model File Placement */}
          <div className="p-3 bg-[#F2E8DF]/60 border border-[#D2E186] rounded space-y-1.5 text-[11px] font-sans">
            <span className="text-[#415111] font-tech font-bold uppercase tracking-wider">MODEL FILE LOCATION:</span>
            <div className="bg-[#FEFEFE] p-2 rounded border border-[#D2E186] text-[#415111] font-tech font-bold">
              <code>public/models/marine-debris.onnx</code>
            </div>
            <p className="text-[#415111]/70 text-[10px] font-sans">
              Vite serves this file statically at <code className="font-tech font-semibold">/models/marine-debris.onnx</code>.
            </p>
          </div>

          {/* Export Instructions */}
          <div>
            <h4 className="text-[#415111] font-tech font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-xs">
              <Code className="w-3.5 h-3.5 text-[#415111]" />
              <span>HOW TO EXPORT YOUR TRAINED YOLO MODEL TO ONNX</span>
            </h4>
            <div className="p-3 bg-[#FEFEFE] border border-[#D2E186] rounded font-tech text-[11px] text-[#415111] overflow-x-auto">
              <pre className="text-[#415111] font-bold">
{`# 1. Export from Ultralytics YOLO CLI:
yolo export model=your_trained_weights.pt format=onnx imgsz=640 opset=12

# 2. Or in Python:
from ultralytics import YOLO
model = YOLO('best.pt')
model.export(format='onnx', imgsz=640, opset=12)

# 3. Rename and place in the project directory:
cp best.onnx public/models/marine-debris.onnx`}
              </pre>
            </div>
          </div>

          {/* Pipeline Workflow */}
          <div>
            <h4 className="text-[#415111] font-tech font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-xs">
              <Layers className="w-3.5 h-3.5 text-[#415111]" />
              <span>INFERENCE PIPELINE ARCHITECTURE</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans">
              <div className="p-2.5 rounded bg-[#F2E8DF] border border-[#D2E186]">
                <span className="text-[#415111] font-bold">1. Ingestion & Letterbox:</span>
                <p className="text-[#415111]/80 mt-0.5">
                  Preserves aspect ratio, resizes to 640×640 with 114 gray padding, and normalizes RGB to [0.0, 1.0].
                </p>
              </div>
              <div className="p-2.5 rounded bg-[#F2E8DF] border border-[#D2E186]">
                <span className="text-[#415111] font-bold">2. ONNX WASM Inference:</span>
                <p className="text-[#415111]/80 mt-0.5">
                  Executes session with cached weights and single-threaded WebAssembly execution.
                </p>
              </div>
              <div className="p-2.5 rounded bg-[#F2E8DF] border border-[#D2E186]">
                <span className="text-[#415111] font-bold">3. YOLO Decoding & NMS:</span>
                <p className="text-[#415111]/80 mt-0.5">
                  Filters boxes by confidence threshold and suppresses overlaps via IoU NMS (0.45).
                </p>
              </div>
              <div className="p-2.5 rounded bg-[#F2E8DF] border border-[#D2E186]">
                <span className="text-[#415111] font-bold">4. Geolocation & Reports:</span>
                <p className="text-[#415111]/80 mt-0.5">
                  Unletterboxes back to full sonar resolution and computes WGS84 GPS coordinates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#FEFEFE] border-t border-[#F2E8DF] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#415111] hover:bg-[#415111]/90 text-[#FEFEFE] font-sans font-bold uppercase tracking-wider transition cursor-pointer text-xs"
          >
            DISMISS SPECIFICATION
          </button>
        </div>
      </div>
    </div>
  );
};
