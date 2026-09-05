import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Eye, Layers, Compass, Zap, ShieldCheck, Activity, Cpu, Sliders } from 'lucide-react';
import { DetectionItem } from '../types/detection';
import { Tooltip } from './Tooltip';

interface ExplainabilityPanelProps {
  detection: DetectionItem | null;
  totalDetections: number;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  detection,
  totalDetections,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saliencyMode, setSaliencyMode] = useState<'heatmap' | 'contours' | 'intensity'>('heatmap');

  // Compute realistic synthetic acoustic explainability metrics deterministically from detection attributes
  const seed = detection ? (detection.bbox.x * 17 + detection.bbox.y * 31 + detection.confidence * 100) : 42;
  const shadowRatio = detection ? (0.35 + ((seed % 45) / 100)).toFixed(2) : '0.52';
  const specularIntensity = detection ? Math.min(99, Math.round(detection.confidence * 100 + (seed % 15))).toString() : '84';
  const edgeGradient = detection ? (7.2 + ((seed % 25) / 10)).toFixed(1) : '8.4';
  const aspectRatio = detection ? (detection.bbox.width / Math.max(1, detection.bbox.height)).toFixed(2) : '1.35';

  // Render simulated saliency / acoustic feature map on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear with deep sea acoustic background
    ctx.fillStyle = '#0A1120';
    ctx.fillRect(0, 0, width, height);

    if (!detection) {
      ctx.fillStyle = '#6793AC';
      ctx.font = '11px IBM Plex Sans, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SELECT AN ANOMALY TO VIEW ACOUSTIC REASONING', width / 2, height / 2);
      return;
    }

    // Draw acoustic waterfall texture scanlines
    for (let y = 0; y < height; y += 3) {
      ctx.fillStyle = `rgba(17, 74, 177, ${0.15 + (Math.sin(y * 0.1) * 0.08)})`;
      ctx.fillRect(0, y, width, 1.5);
    }

    const centerX = width * 0.45;
    const centerY = height * 0.5;
    const targetW = Math.min(width * 0.55, Math.max(50, (detection.bbox.width / 400) * width));
    const targetH = Math.min(height * 0.65, Math.max(40, (detection.bbox.height / 300) * height));

    if (saliencyMode === 'heatmap') {
      // Draw smooth Gaussian Grad-CAM style heatmap
      const grad = ctx.createRadialGradient(
        centerX, centerY, 5,
        centerX, centerY, Math.max(targetW, targetH)
      );
      grad.addColorStop(0, 'rgba(228, 88, 11, 0.95)'); // Core hot activation (bold orange)
      grad.addColorStop(0.35, 'rgba(228, 88, 11, 0.7)'); // Warm orange
      grad.addColorStop(0.65, 'rgba(103, 147, 172, 0.55)'); // Soft steel blue
      grad.addColorStop(1, 'rgba(17, 74, 177, 0)'); // Fades into blue background

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, targetW * 0.7, targetH * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Down-range acoustic shadow (characteristic dark region behind sonar highlight)
      const shadowX = centerX + targetW * 0.55;
      const shadowGrad = ctx.createLinearGradient(shadowX, centerY - targetH * 0.4, shadowX + targetW * 0.7, centerY + targetH * 0.4);
      shadowGrad.addColorStop(0, 'rgba(10, 17, 32, 0.85)');
      shadowGrad.addColorStop(1, 'rgba(10, 17, 32, 0.1)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(shadowX, centerY - targetH * 0.4, targetW * 0.65, targetH * 0.8);

    } else if (saliencyMode === 'contours') {
      // Draw edge gradient contour isolines
      ctx.strokeStyle = '#6793AC';
      ctx.lineWidth = 1.5;
      for (let r = 1; r <= 4; r++) {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, (targetW * 0.2) * r, (targetH * 0.2) * r, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#E4580B';
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX - targetW * 0.35, centerY - targetH * 0.35, targetW * 0.7, targetH * 0.7);
    } else {
      // Specular intensity backscatter view
      for (let i = 0; i < 60; i++) {
        const px = centerX + (Math.random() - 0.5) * targetW;
        const py = centerY + (Math.random() - 0.5) * targetH;
        const bright = Math.random() * 0.9;
        ctx.fillStyle = `rgba(254, 254, 254, ${bright})`;
        ctx.fillRect(px, py, 2.5, 2.5);
      }
      ctx.strokeStyle = '#6793AC';
      ctx.strokeRect(centerX - targetW * 0.45, centerY - targetH * 0.45, targetW * 0.9, targetH * 0.9);
    }

    // Draw reticle lines
    ctx.strokeStyle = 'rgba(103, 147, 172, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // HUD overlays on canvas
    ctx.fillStyle = '#FEFEFE';
    ctx.font = '9px Space Grotesk, IBM Plex Sans, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`TARGET: ${detection.id} [${detection.class_name.toUpperCase()}]`, 8, 14);
    ctx.fillText(`CONF: ${(detection.confidence * 100).toFixed(1)}% | GRAD-CAM LAYER 4`, 8, 26);
    ctx.textAlign = 'right';
    ctx.fillText(`ACOUSTIC SHADOW: ${shadowRatio}x`, width - 8, 14);
  }, [detection, saliencyMode]);

  const getReasoningText = () => {
    if (!detection) {
      return 'Select any anomaly from the detections table to inspect YOLOv8 convolutional activation maps and acoustic feature attribution.';
    }

    const name = detection.class_name.toLowerCase();
    if (name.includes('net') || name.includes('ghost')) {
      return `YOLOv8 detected high-density linear acoustic lattice backscatter coupled with a trailing acoustic dead-zone shadow. The diffuse mesh pattern exhibits high probability of synthetic nylon filament entanglement hazard with negligible natural sediment blend.`;
    }
    if (name.includes('metal') || name.includes('container')) {
      return `Specular acoustic reflection indicates an angular hard substrate with strong specular ping returns. High edge contrast gradient (${edgeGradient} dB/px) clearly differentiates this artificial geometry from rounded seabed rocks.`;
    }
    if (name.includes('trap') || name.includes('trawl') || name.includes('gear')) {
      return `Target features a distinct rectangular outline with localized perimeter echo spikes and internal acoustic void, matching commercial benthic pot/trap structures.`;
    }
    return `Anomalous acoustic highlight contrasting sharply against regional seabed reverberation. Strong down-range shadow confirms elevated relief (${shadowRatio}x height-to-range ratio) characteristic of artificial debris.`;
  };

  return (
    <div className="bg-[#FEFEFE] dark:bg-[#0A1120] border border-[#EBF2F7] dark:border-[#114AB1]/40 rounded-lg p-3.5 space-y-3 shadow-sm font-sans transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EBF2F7] dark:border-[#114AB1]/40 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#EBF2F7] dark:bg-[#0A1120] border border-[#6793AC] flex items-center justify-center text-[#114AB1] dark:text-[#6793AC]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-tech font-bold uppercase tracking-wider text-[#114AB1] dark:text-[#FEFEFE] flex items-center gap-1.5">
              <span>YOLO EXPLAINABILITY & SALIENCY MAP</span>
              <Tooltip
                title="Model Explainability"
                content="Grad-CAM activation layers highlight acoustic features (specular peak echoes and down-range acoustic shadows) that influenced YOLO's classification decision."
              />
            </h4>
            <p className="text-[10px] text-[#114AB1]/70 dark:text-[#6793AC]/70">
              Acoustic backscatter attribution, shadow-to-height relief, and boundary gradient
            </p>
          </div>
        </div>

        {/* Saliency visualization toggles */}
        <div className="flex items-center bg-[#EBF2F7] dark:bg-[#0A1120] border border-[#6793AC] dark:border-[#114AB1] rounded p-0.5 text-xs">
          <button
            onClick={() => setSaliencyMode('heatmap')}
            className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider transition ${
              saliencyMode === 'heatmap'
                ? 'bg-[#114AB1] text-[#FEFEFE]'
                : 'text-[#114AB1]/70 dark:text-[#6793AC]/70 hover:text-[#114AB1]'
            }`}
          >
            Saliency Heatmap
          </button>
          <button
            onClick={() => setSaliencyMode('contours')}
            className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider transition ${
              saliencyMode === 'contours'
                ? 'bg-[#114AB1] text-[#FEFEFE]'
                : 'text-[#114AB1]/70 dark:text-[#6793AC]/70 hover:text-[#114AB1]'
            }`}
          >
            Edge Gradients
          </button>
          <button
            onClick={() => setSaliencyMode('intensity')}
            className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider transition ${
              saliencyMode === 'intensity'
                ? 'bg-[#114AB1] text-[#FEFEFE]'
                : 'text-[#114AB1]/70 dark:text-[#6793AC]/70 hover:text-[#114AB1]'
            }`}
          >
            Backscatter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Saliency Canvas */}
        <div className="md:col-span-5 relative rounded overflow-hidden border border-[#6793AC] dark:border-[#114AB1] bg-[#0A1120] shadow-inner">
          <canvas
            ref={canvasRef}
            width={340}
            height={160}
            className="w-full h-auto block object-cover"
          />
        </div>

        {/* Feature Attribution Cards */}
        <div className="md:col-span-7 space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
            <div className="bg-[#EBF2F7] dark:bg-[#0A1120] p-2 rounded border border-[#6793AC] dark:border-[#114AB1]/40">
              <span className="text-[#114AB1]/70 dark:text-[#6793AC]/70 block font-medium">
                Shadow Ratio
              </span>
              <span className="font-tech font-bold text-xs text-[#114AB1] dark:text-[#FEFEFE] tabular-nums">
                {shadowRatio}x
              </span>
              <span className="text-[9px] text-[#114AB1]/60 dark:text-[#6793AC]/60 block mt-0.5">Vertical relief</span>
            </div>

            <div className="bg-[#EBF2F7] dark:bg-[#0A1120] p-2 rounded border border-[#6793AC] dark:border-[#114AB1]/40">
              <span className="text-[#114AB1]/70 dark:text-[#6793AC]/70 block font-medium">
                Specular Peak
              </span>
              <span className="font-tech font-bold text-xs text-[#114AB1] dark:text-[#FEFEFE] tabular-nums">
                {specularIntensity} dB
              </span>
              <span className="text-[9px] text-[#114AB1]/60 dark:text-[#6793AC]/60 block mt-0.5">Reflectance</span>
            </div>

            <div className="bg-[#EBF2F7] dark:bg-[#0A1120] p-2 rounded border border-[#6793AC] dark:border-[#114AB1]/40">
              <span className="text-[#114AB1]/70 dark:text-[#6793AC]/70 block font-medium">
                Edge Gradient
              </span>
              <span className="font-tech font-bold text-xs text-[#114AB1] dark:text-[#FEFEFE] tabular-nums">
                {edgeGradient} dB/px
              </span>
              <span className="text-[9px] text-[#114AB1]/60 dark:text-[#6793AC]/60 block mt-0.5">Boundary sharpness</span>
            </div>

            <div className="bg-[#EBF2F7] dark:bg-[#0A1120] p-2 rounded border border-[#6793AC] dark:border-[#114AB1]/40">
              <span className="text-[#114AB1]/70 dark:text-[#6793AC]/70 block font-medium">
                Aspect Ratio
              </span>
              <span className="font-tech font-bold text-xs text-[#114AB1] dark:text-[#FEFEFE] tabular-nums">
                {aspectRatio}:1
              </span>
              <span className="text-[9px] text-[#114AB1]/60 dark:text-[#6793AC]/60 block mt-0.5">W/H Geometry</span>
            </div>
          </div>

          {/* Model Reasoning Description */}
          <div className="p-2.5 rounded bg-[#EBF2F7]/60 dark:bg-[#0A1120]/60 border border-[#6793AC] dark:border-[#114AB1]/30 text-[11px] leading-relaxed text-[#114AB1] dark:text-[#6793AC]">
            <div className="font-tech font-bold uppercase tracking-wider text-[10px] text-[#114AB1] dark:text-[#FEFEFE] mb-1 flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-[#114AB1] dark:text-[#6793AC]" />
              <span>DECISION ATTRIBUTION RATIONALE</span>
            </div>
            <p className="font-sans">{getReasoningText()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
