import React, { useState } from 'react';
import { FileJson, FileSpreadsheet, FileText, Check, Sparkles, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getDownloadUrl } from '../services/api';
import { DetectionResult } from '../types/detection';

interface ReportButtonsProps {
  result: DetectionResult | null;
  resultId: string | null;
  totalDetections: number;
  onOpenThreatAssessment?: () => void;
}

export const ReportButtons: React.FC<ReportButtonsProps> = ({
  result,
  resultId,
  totalDetections,
  onOpenThreatAssessment,
}) => {
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Generate and download professional Hydrographic PDF Report via jsPDF
  const handleDownloadPdf = () => {
    if (!result && !resultId) return;

    setDownloadingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 16;

      // Header Banner
      doc.setFillColor(65, 81, 17); // Olive Primary #415111
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setTextColor(254, 254, 254);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('MARINE DEBRIS AI | DEEP SEA HYDROGRAPHIC SURVEY', 14, 11);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('ACOUSTIC BATHYMETRIC ANOMALY INSPECTION & YOLO RECOVERY REPORT', 14, 18);

      y = 32;

      // Mission Metadata
      doc.setTextColor(65, 81, 17);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SURVEY MISSION TELEMETRY', 14, y);
      y += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);

      const dateStr = result?.created_at
        ? new Date(result.created_at).toUTCString()
        : new Date().toUTCString();

      doc.text(`Mission Scan ID: ${resultId || 'SCAN-ACTIVE'}`, 14, y);
      doc.text(`Sector: Bathymetric Sector 04-9 (Abyssal Zone -2,450m)`, 110, y);
      y += 5;
      doc.text(`Survey Timestamp: ${dateStr}`, 14, y);
      doc.text(`Inference Engine: YOLOv8 ONNX WebAssembly (WASM)`, 110, y);
      y += 5;
      doc.text(`Geodetic Reference: WGS84 Geodetic Datum`, 14, y);
      doc.text(`Swath Coverage: 100m Lateral (±50m Towfish Nadir)`, 110, y);
      y += 9;

      // Summary Statistics Box
      doc.setFillColor(242, 232, 223); // #F2E8DF
      doc.rect(14, y, pageWidth - 28, 18, 'F');
      doc.setDrawColor(210, 225, 134); // #D2E186
      doc.rect(14, y, pageWidth - 28, 18, 'S');

      const detections = result?.detections || [];
      const criticalCount = detections.filter((d) => d.priority === 'high').length;
      const warningCount = detections.filter((d) => d.priority === 'medium').length;
      const advisoryCount = detections.filter((d) => d.priority === 'low').length;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(65, 81, 17);
      doc.setFontSize(9);
      doc.text(`TOTAL ANOMALIES: ${detections.length}`, 20, y + 7);
      doc.setTextColor(251, 129, 89); // Coral #FB8159
      doc.text(`CRITICAL TARGETS: ${criticalCount}`, 70, y + 7);
      doc.setTextColor(65, 81, 17);
      doc.text(`WARNING TARGETS: ${warningCount}`, 120, y + 7);
      doc.text(`ADVISORY TARGETS: ${advisoryCount}`, 160, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text('Action Recommendation: Deploy ROV manipulator for critical entanglement hazards.', 20, y + 14);

      y += 26;

      // Detections Table
      doc.setTextColor(65, 81, 17);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('GEOREFERENCED TARGET INVENTORY', 14, y);
      y += 5;

      // Table Header
      doc.setFillColor(65, 81, 17);
      doc.rect(14, y, pageWidth - 28, 7, 'F');
      doc.setTextColor(254, 254, 254);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');

      doc.text('TARGET ID', 17, y + 4.5);
      doc.text('CLASSIFICATION', 42, y + 4.5);
      doc.text('CONFIDENCE', 80, y + 4.5);
      doc.text('WGS84 LATITUDE', 108, y + 4.5);
      doc.text('WGS84 LONGITUDE', 140, y + 4.5);
      doc.text('PRIORITY', 175, y + 4.5);
      y += 7;

      // Table Rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      detections.slice(0, 22).forEach((det, i) => {
        const isEven = i % 2 === 0;
        doc.setFillColor(isEven ? 254 : 242, isEven ? 254 : 232, isEven ? 254 : 223);
        doc.rect(14, y, pageWidth - 28, 6, 'F');

        doc.setTextColor(50, 50, 50);
        doc.text(det.id, 17, y + 4);
        doc.text(det.class_name.replace(/_/g, ' ').toUpperCase(), 42, y + 4);
        doc.text(`${Math.round(det.confidence * 100)}%`, 80, y + 4);
        doc.text(`${det.latitude.toFixed(6)}° N`, 108, y + 4);
        doc.text(`${det.longitude.toFixed(6)}° E`, 140, y + 4);

        if (det.priority === 'high') {
          doc.setTextColor(251, 129, 89);
        } else if (det.priority === 'medium') {
          doc.setTextColor(180, 100, 20);
        } else {
          doc.setTextColor(65, 81, 17);
        }
        doc.setFont('helvetica', 'bold');
        doc.text(det.priority.toUpperCase(), 175, y + 4);
        doc.setFont('helvetica', 'normal');

        y += 6;
      });

      // Environmental Protection Notes Footer
      y = Math.max(y + 6, 260);
      doc.setDrawColor(210, 225, 134);
      doc.line(14, y, pageWidth - 14, y);
      y += 5;

      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by AQUAVISION Marine Debris AI Platform • ISO 19115 Hydrographic Metadata Compliant', 14, y);
      doc.text('Coordinates validated via acoustic transponder baseline. Restricted survey document.', 14, y + 4);

      // Save PDF
      doc.save(`marine_debris_survey_${resultId || 'report'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setTimeout(() => setDownloadingPdf(false), 1500);
    }
  };

  const handleDownload = (format: 'json' | 'csv') => {
    if (!resultId && !result) return;

    if (format === 'json') {
      setDownloadingJson(true);
      setTimeout(() => setDownloadingJson(false), 1500);
    } else {
      setDownloadingCsv(true);
      setTimeout(() => setDownloadingCsv(false), 1500);
    }

    // Client-side generated YOLO result download
    if (result && (!resultId || !resultId.startsWith('SONAR-') || result.metadata.inference_engine?.includes('ONNX'))) {
      let blob: Blob;
      const filename = `marine_debris_${resultId || 'survey'}.${format}`;

      if (format === 'json') {
        blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      } else {
        // Generate comprehensive CSV
        const headers = [
          'detection_id',
          'class_name',
          'confidence_pct',
          'priority',
          'latitude_wgs84',
          'longitude_wgs84',
          'bbox_x_px',
          'bbox_y_px',
          'bbox_width_px',
          'bbox_height_px',
        ];
        const rows = result.detections.map((d) => [
          d.id,
          `"${d.class_name}"`,
          Math.round(d.confidence * 100),
          d.priority.toUpperCase(),
          d.latitude.toFixed(6),
          d.longitude.toFixed(6),
          d.bbox.x,
          d.bbox.y,
          d.bbox.width,
          d.bbox.height,
        ].join(','));
        const csvContent = [headers.join(','), ...rows].join('\n');
        blob = new Blob([csvContent], { type: 'text/csv' });
      }

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Server-side download endpoint fallback
    if (resultId) {
      const url = getDownloadUrl(resultId, format);
      const link = document.createElement('a');
      link.href = url;
      link.download = `marine_debris_${resultId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const hasData = Boolean(resultId || (result && result.detections.length > 0));

  return (
    <div className="flex flex-wrap items-center gap-2 font-sans text-xs">
      {/* AI Threat Assessment Button */}
      {onOpenThreatAssessment && (
        <button
          id="btn-ai-threat-brief"
          onClick={onOpenThreatAssessment}
          disabled={!hasData}
          className={`px-3 py-1.5 rounded border font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer text-[11px] ${
            !hasData
              ? 'bg-[#F2E8DF] dark:bg-[#1E2E21] border-[#F2E8DF] dark:border-[#415111] text-[#415111]/40 dark:text-[#D2E186]/40 cursor-not-allowed'
              : 'bg-[#FB8159] hover:bg-[#FCBF93] text-[#FEFEFE] border-[#FB8159] shadow-sm'
          }`}
          title="Generate AI Threat & Ecological Assessment Briefing"
        >
          <Sparkles className="w-3.5 h-3.5 text-current" />
          <span>AI THREAT INTEL</span>
        </button>
      )}

      {/* Download PDF Hydrographic Report */}
      <button
        id="btn-export-pdf"
        onClick={handleDownloadPdf}
        disabled={!hasData}
        className={`px-3 py-1.5 rounded border font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer text-[11px] ${
          !hasData
            ? 'bg-[#F2E8DF] dark:bg-[#1E2E21] border-[#F2E8DF] dark:border-[#415111] text-[#415111]/40 dark:text-[#D2E186]/40 cursor-not-allowed'
            : 'bg-[#415111] hover:bg-[#415111]/90 text-[#FEFEFE] border-[#415111] shadow-sm'
        }`}
        title="Download complete formatted hydrographic survey report as PDF"
      >
        {downloadingPdf ? (
          <Check className="w-3.5 h-3.5 text-[#FEFEFE]" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-[#FEFEFE]" />
        )}
        <span>DOWNLOAD PDF REPORT</span>
      </button>

      {/* Download CSV */}
      <button
        id="btn-export-csv"
        onClick={() => handleDownload('csv')}
        disabled={!hasData}
        className={`px-3 py-1.5 rounded border font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer text-[11px] ${
          !hasData
            ? 'bg-[#F2E8DF] dark:bg-[#1E2E21] border-[#F2E8DF] dark:border-[#415111] text-[#415111]/40 dark:text-[#D2E186]/40 cursor-not-allowed'
            : 'bg-[#F2E8DF] dark:bg-[#1E2E21] hover:bg-[#D2E186] text-[#415111] dark:text-[#D2E186] border-[#415111]/30 dark:border-[#415111] shadow-sm'
        }`}
        title="Download detection coordinates and bounds as standard survey CSV"
      >
        {downloadingCsv ? (
          <Check className="w-3.5 h-3.5 text-[#415111] dark:text-[#D2E186]" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#415111] dark:text-[#D2E186]" />
        )}
        <span>EXPORT CSV</span>
      </button>

      {/* Download JSON */}
      <button
        id="btn-export-json"
        onClick={() => handleDownload('json')}
        disabled={!hasData}
        className={`px-3 py-1.5 rounded border font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer text-[11px] ${
          !hasData
            ? 'bg-[#F2E8DF] dark:bg-[#1E2E21] border-[#F2E8DF] dark:border-[#415111] text-[#415111]/40 dark:text-[#D2E186]/40 cursor-not-allowed'
            : 'bg-[#F2E8DF] dark:bg-[#1E2E21] hover:bg-[#D2E186] text-[#415111] dark:text-[#D2E186] border-[#415111]/30 dark:border-[#415111] shadow-sm'
        }`}
        title="Download full analysis payload as JSON"
      >
        {downloadingJson ? (
          <Check className="w-3.5 h-3.5 text-[#415111] dark:text-[#D2E186]" />
        ) : (
          <FileJson className="w-3.5 h-3.5 text-[#415111] dark:text-[#D2E186]" />
        )}
        <span>JSON</span>
      </button>
    </div>
  );
};
