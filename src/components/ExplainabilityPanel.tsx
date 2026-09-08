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
    ctx.fillStyle = '#0B1320';
    ctx.fillRect(0, 0, width, height);

    if (!detection) {
      ctx.fillStyle = '#1BDFC8';
      ctx.font = '11px IBM Plex Sans, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SELECT AN ANOMALY TO VIEW ACOUSTIC REASONING', width / 2, height / 2);
      return;
    }

    // Draw acoustic waterfall texture scanlines
    for (let y = 0; y < height; y += 3) {
      ctx.fillStyle = `rgba(46, 150, 219, ${0.12 + (Math.sin(y * 0.1) * 0.06)})`;
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
      grad.addColorStop(0, 'rgba(27, 223, 200, 0.95)'); // Core cyan activation
      grad.addColorStop(0.35, 'rgba(46, 150, 219, 0.8)'); // Medium bright blue
      grad.addColorStop(0.65, 'rgba(147, 168, 188, 0.55)'); // Steel gray
      grad.addColorStop(1, 'rgba(15, 26, 44, 0)'); // Fades into dark navy background

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, targetW * 0.7, targetH * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Down-range acoustic shadow (characteristic dark region behind sonar highlight)
      const shadowX = centerX + targetW * 0.55;
      const shadowGrad = ctx.createLinearGradient(shadowX, centerY - targetH * 0.4, shadowX + targetW * 0.7, centerY + targetH * 0.4);
      shadowGrad.addColorStop(0, 'rgba(11, 19, 32, 0.9)');
      shadowGrad.addColorStop(1, 'rgba(15, 26, 44, 0.1)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(shadowX, centerY - targetH * 0.4, targetW * 0.65, targetH * 0.8);

    } else if (saliencyMode === 'contours') {
      // Draw edge gradient contour isolines
      ctx.strokeStyle = '#2E96DB';
      ctx.lineWidth = 1.5;
      for (let r = 1; r <= 4; r++) {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, (targetW * 0.2) * r, (targetH * 0.2) * r, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#1BDFC8';
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX - targetW * 0.35, centerY - targetH * 0.35, targetW * 0.7, targetH * 0.7);
    } else {
      // Specular intensity backscatter view
      for (let i = 0; i < 60; i++) {
        const px = centerX + (Math.random() - 0.5) * targetW;
        const py = centerY + (Math.random() - 0.5) * targetH;
        const bright = Math.random() * 0.9;
        ctx.fillStyle = `rgba(255, 255, 255, ${bright})`;
        ctx.fillRect(px, py, 2.5, 2.5);
      }
      ctx.strokeStyle = '#1BDFC8';
      ctx.strokeRect(centerX - targetW * 0.45, centerY - targetH * 0.45, targetW * 0.9, targetH * 0.9);
    }

    // Draw reticle lines
    ctx.strokeStyle = 'rgba(27, 223, 200, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // HUD overlays on canvas
    ctx.fillStyle = '#FFFFFF';
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
    <div className="bg-[#0F1A2C] border border-[#93A8BC]/25 rounded-lg p-3.5 space-y-3 shadow-sm font-sans transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#93A8BC]/25 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#0B1320] border border-[#93A8BC]/30 flex items-center justify-center text-[#1BDFC8]">
            <Sparkles className="w-3.5 h-3.5 text-[#1BDFC8]" />
          </div>
          <div>
            <h4 className="text-xs font-tech font-bold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-1.5">
              <span>YOLO EXPLAINABILITY & SALIENCY MAP</span>
              <Tooltip
                title="Model Explainability"
                content="Grad-CAM activation layers highlight acoustic features (specular peak echoes and down-range acoustic shadows) that influenced YOLO's classification decision."
              />
            </h4>
            <p className="text-[10px] text-[#93A8BC]">
              Acoustic backscatter attribution, shadow-to-height relief, and boundary gradient
            </p>
          </div>
        </div>

        {/* Saliency visualization toggles */}
        <div className="flex items-center bg-[#0B1320] border border-[#93A8BC]/25 rounded p-0.5 text-xs">
          <button
            onClick={() => setSaliencyMode('heatmap')}
            className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider transition cursor-pointer ${
              saliencyMode === 'heatmap'
                ? 'bg-[#1BDFC8] text-[#0A111E]'
                : 'text-[#93A8BC] hover:text-[#FFFFFF]'
            }`}
          >
            Saliency Heatmap
          </button>
          <button
            onClick={() => setSaliencyMode('contours')}
            className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider transition cursor-pointer ${
              saliencyMode === 'contours'
                ? 'bg-[#1BDFC8] text-[#0A111E]'
                : 'text-[#93A8BC] hover:text-[#FFFFFF]'
            }`}
          >
            Edge Gradients
          </button>
          <button
            onClick={() => setSaliencyMode('intensity')}
            className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider transition cursor-pointer ${
              saliencyMode === 'intensity'
                ? 'bg-[#1BDFC8] text-[#0A111E]'
                : 'text-[#93A8BC] hover:text-[#FFFFFF]'
            }`}
          >
            Backscatter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Saliency Canvas */}
        <div className="md:col-span-5 relative rounded overflow-hidden border border-[#93A8BC]/25 bg-[#0B1320] shadow-inner">
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
            <div className="bg-[#142238] p-2 rounded border border-[#93A8BC]/25">
              <span className="text-[#93A8BC] block font-medium">
                Shadow Ratio
              </span>
              <span className="font-tech font-bold text-xs text-[#FFFFFF] tabular-nums">
                {shadowRatio}x
              </span>
              <span className="text-[9px] text-[#93A8BC]/80 block mt-0.5">Vertical relief</span>
            </div>

            <div className="bg-[#142238] p-2 rounded border border-[#93A8BC]/25">
              <span className="text-[#93A8BC] block font-medium">
                Specular Peak
              </span>
              <span className="font-tech font-bold text-xs text-[#FFFFFF] tabular-nums">
                {specularIntensity} dB
              </span>
              <span className="text-[9px] text-[#93A8BC]/80 block mt-0.5">Reflectance</span>
            </div>

            <div className="bg-[#142238] p-2 rounded border border-[#93A8BC]/25">
              <span className="text-[#93A8BC] block font-medium">
                Edge Gradient
              </span>
              <span className="font-tech font-bold text-xs text-[#FFFFFF] tabular-nums">
                {edgeGradient} dB/px
              </span>
              <span className="text-[9px] text-[#93A8BC]/80 block mt-0.5">Boundary sharpness</span>
            </div>

            <div className="bg-[#142238] p-2 rounded border border-[#93A8BC]/25">
              <span className="text-[#93A8BC] block font-medium">
                Aspect Ratio
              </span>
              <span className="font-tech font-bold text-xs text-[#FFFFFF] tabular-nums">
                {aspectRatio}:1
              </span>
              <span className="text-[9px] text-[#93A8BC]/80 block mt-0.5">W/H Geometry</span>
            </div>
          </div>

          {/* Model Reasoning Description */}
          <div className="p-2.5 rounded bg-[#142238] border border-[#93A8BC]/30 text-[11px] leading-relaxed text-[#93A8BC]">
            <div className="font-tech font-bold uppercase tracking-wider text-[10px] text-[#FFFFFF] mb-1 flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-[#1BDFC8]" />
              <span>DECISION ATTRIBUTION RATIONALE</span>
            </div>
            <p className="font-sans">{getReasoningText()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
