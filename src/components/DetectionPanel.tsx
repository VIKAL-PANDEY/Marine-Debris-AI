import React, { useState, useEffect, useRef } from 'react';
import {
  Target,
  Copy,
  Check,
  Filter,
  Crosshair,
  Keyboard,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Compass,
  Layers,
  MapPin,
  Box,
  Anchor,
  Trash2,
  HelpCircle,
  X,
  MoreVertical,
  Activity,
  Cpu,
} from 'lucide-react';
import { DetectionItem, DebrisPriority } from '../types/detection';
import { Tooltip } from './Tooltip';
import { ExplainabilityPanel } from './ExplainabilityPanel';

interface DetectionPanelProps {
  detections: DetectionItem[];
  selectedDetectionId: string | null;
  onSelectDetection: (id: string | null) => void;
  onOpenTargetDiagnostics?: (target: DetectionItem) => void;
  onOpenAICoPilot?: (targetQuery?: string) => void;
  onMarkFalsePositive?: (target: DetectionItem) => void;
  falsePositiveIds?: string[];
}

type ActiveTab = 'table' | 'coordinates' | 'threat' | 'explainability' | 'false_positives';

export const DetectionPanel: React.FC<DetectionPanelProps> = ({
  detections,
  selectedDetectionId,
  onSelectDetection,
  onOpenTargetDiagnostics,
  onOpenAICoPilot,
  onMarkFalsePositive,
  falsePositiveIds = [],
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('table');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  const filteredDetections = detections.filter((d) => {
    if (priorityFilter === 'all') return true;
    return d.priority === priorityFilter;
  });

  const selectedIndex = filteredDetections.findIndex((d) => d.id === selectedDetectionId);
  const selectedDetection = detections.find((d) => d.id === selectedDetectionId) || null;

  // Auto-scroll table to active selected row
  useEffect(() => {
    if (selectedDetectionId && rowRefs.current[selectedDetectionId]) {
      rowRefs.current[selectedDetectionId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedDetectionId]);

  // Global & component keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (filteredDetections.length === 0) return;

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (selectedIndex === -1) {
          onSelectDetection(filteredDetections[0].id);
        } else {
          const nextIdx = (selectedIndex + 1) % filteredDetections.length;
          onSelectDetection(filteredDetections[nextIdx].id);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (selectedIndex === -1) {
          onSelectDetection(filteredDetections[filteredDetections.length - 1].id);
        } else {
          const prevIdx = (selectedIndex - 1 + filteredDetections.length) % filteredDetections.length;
          onSelectDetection(filteredDetections[prevIdx].id);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        onSelectDetection(filteredDetections[0].id);
      } else if (e.key === 'End') {
        e.preventDefault();
        onSelectDetection(filteredDetections[filteredDetections.length - 1].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSelectDetection(null);
        setActiveDropdownId(null);
      } else if (e.key === 'c' || e.key === 'C') {
        if (selectedIndex !== -1) {
          const activeDet = filteredDetections[selectedIndex];
          const coordText = `${activeDet.latitude.toFixed(6)}, ${activeDet.longitude.toFixed(6)}`;
          navigator.clipboard.writeText(coordText);
          setCopiedId(activeDet.id);
          setTimeout(() => setCopiedId(null), 2000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredDetections, selectedIndex, onSelectDetection]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdownId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleCopyCoords = (det: DetectionItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const coordText = `${det.latitude.toFixed(6)}, ${det.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(coordText);
    setCopiedId(det.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllCoordinates = () => {
    const allCoords = detections
      .map((d) => `${d.id}: ${d.latitude.toFixed(6)}° N, ${d.longitude.toFixed(6)}° E (${d.class_name})`)
      .join('\n');
    navigator.clipboard.writeText(allCoords);
    setCopiedId('ALL');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Small icon for debris types
  const getDebrisIcon = (className: string) => {
    const lower = className.toLowerCase();
    if (lower.includes('net') || lower.includes('ghost')) {
      return <Anchor className="w-3.5 h-3.5 text-[#FB8159]" />;
    }
    if (lower.includes('metal') || lower.includes('container')) {
      return <Box className="w-3.5 h-3.5 text-[#415111] dark:text-[#D2E186]" />;
    }
    if (lower.includes('trap') || lower.includes('gear') || lower.includes('trawl')) {
      return <Layers className="w-3.5 h-3.5 text-[#FCBF93]" />;
    }
    if (lower.includes('plastic') || lower.includes('cargo')) {
      return <Trash2 className="w-3.5 h-3.5 text-[#415111]" />;
    }
    return <Crosshair className="w-3.5 h-3.5 text-[#415111] dark:text-[#D2E186]" />;
  };

  // Colored badges and icons for status labels (CRITICAL, WARNING, ADVISORY)
  const getPriorityBadge = (priority: DebrisPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider bg-[#FB8159] text-[#FEFEFE] shadow-sm">
            <ShieldAlert className="w-3 h-3 text-[#FEFEFE]" />
            <span>CRITICAL</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider bg-[#FCBF93] text-[#415111] border border-[#FB8159]/40">
            <AlertCircle className="w-3 h-3 text-[#415111]" />
            <span>WARNING</span>
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-tech font-bold uppercase tracking-wider bg-[#D2E186] text-[#415111] border border-[#415111]/30">
            <CheckCircle2 className="w-3 h-3 text-[#415111]" />
            <span>ADVISORY</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-[#FEFEFE] dark:bg-[#15221B] border border-[#F2E8DF] dark:border-[#415111]/40 rounded-lg flex flex-col overflow-hidden shadow-sm font-sans transition-colors">
      {/* Panel Header */}
      <div className="p-3 border-b border-[#F2E8DF] dark:border-[#415111]/40 bg-[#FEFEFE] dark:bg-[#15221B] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#F2E8DF] dark:bg-[#1E2E21] border border-[#D2E186] flex items-center justify-center text-[#415111] dark:text-[#D2E186]">
            <Target className="w-4 h-4 text-[#415111] dark:text-[#D2E186]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#FEFEFE] flex items-center gap-2">
              <span>ACOUSTIC ANOMALIES & DETECTION LOG</span>
              <span className="px-1.5 py-0.2 rounded bg-[#F2E8DF] dark:bg-[#1E2E21] text-[#415111] dark:text-[#D2E186] border border-[#D2E186] dark:border-[#415111] text-[10px] font-tech tabular-nums font-bold">
                {filteredDetections.length}
              </span>
            </h3>
            <p className="text-[10px] text-[#415111]/70 dark:text-[#D2E186]/70">
              YOLO localized debris targets, georeferenced coordinates, and threat intelligence
            </p>
          </div>
        </div>

        {/* Priority Filter & Keyboard Shortcuts Legend */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="hidden lg:flex items-center gap-1.5 bg-[#F2E8DF] dark:bg-[#1E2E21] border border-[#D2E186] dark:border-[#415111] rounded px-2 py-1 text-[10px] font-sans text-[#415111]/80 dark:text-[#D2E186]/80">
            <Keyboard className="w-3 h-3 text-[#415111] dark:text-[#D2E186]" />
            <span className="font-medium">Nav:</span>
            <kbd className="px-1 py-0.2 bg-[#FEFEFE] dark:bg-[#15221B] border border-[#D2E186] dark:border-[#415111] rounded text-[#415111] dark:text-[#D2E186] text-[9px] font-tech font-semibold">
              ↑ / ↓
            </kbd>
            <kbd className="px-1 py-0.2 bg-[#FEFEFE] dark:bg-[#15221B] border border-[#D2E186] dark:border-[#415111] rounded text-[#415111] dark:text-[#D2E186] text-[9px] font-tech font-semibold">
              C
            </kbd>
            <span>Copy GPS</span>
            <kbd className="px-1 py-0.2 bg-[#FEFEFE] dark:bg-[#15221B] border border-[#D2E186] dark:border-[#415111] rounded text-[#415111] dark:text-[#D2E186] text-[9px] font-tech font-semibold">
              Esc
            </kbd>
            <span>Clear</span>
          </div>

          <div className="flex items-center bg-[#F2E8DF] dark:bg-[#1E2E21] border border-[#D2E186] dark:border-[#415111] rounded p-0.5 text-xs font-sans">
            <Filter className="w-3 h-3 text-[#415111] dark:text-[#D2E186] ml-1 mr-0.5" />
            {['all', 'high', 'medium', 'low'].map((filter) => (
              <button
                key={filter}
                onClick={() => setPriorityFilter(filter)}
                className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider transition cursor-pointer ${
                  priorityFilter === filter
                    ? 'bg-[#415111] text-[#FEFEFE]'
                    : 'text-[#415111]/70 dark:text-[#D2E186]/70 hover:text-[#415111] dark:hover:text-[#FEFEFE]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Grouping related data into tabs instead of long horizontal rows) */}
      <div className="flex items-center border-b border-[#F2E8DF] dark:border-[#415111]/40 bg-[#F2E8DF]/40 dark:bg-[#1E2E21]/50 px-3 pt-2 gap-1 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('table')}
          className={`px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'table'
              ? 'border-[#415111] dark:border-[#D2E186] text-[#415111] dark:text-[#FEFEFE] bg-[#FEFEFE] dark:bg-[#15221B] rounded-t'
              : 'border-transparent text-[#415111]/70 dark:text-[#D2E186]/70 hover:text-[#415111]'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Detections Log</span>
          <span className="px-1 py-0.2 rounded bg-[#D2E186] text-[#415111] text-[9px] tabular-nums">
            {filteredDetections.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('coordinates')}
          className={`px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'coordinates'
              ? 'border-[#415111] dark:border-[#D2E186] text-[#415111] dark:text-[#FEFEFE] bg-[#FEFEFE] dark:bg-[#15221B] rounded-t'
              : 'border-transparent text-[#415111]/70 dark:text-[#D2E186]/70 hover:text-[#415111]'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Coordinates & WGS84</span>
        </button>

        <button
          onClick={() => setActiveTab('threat')}
          className={`px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'threat'
              ? 'border-[#415111] dark:border-[#D2E186] text-[#415111] dark:text-[#FEFEFE] bg-[#FEFEFE] dark:bg-[#15221B] rounded-t'
              : 'border-transparent text-[#415111]/70 dark:text-[#D2E186]/70 hover:text-[#415111]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-[#FB8159]" />
          <span>Threat Assessment</span>
        </button>

        <button
          onClick={() => setActiveTab('explainability')}
          className={`px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'explainability'
              ? 'border-[#415111] dark:border-[#D2E186] text-[#415111] dark:text-[#FEFEFE] bg-[#FEFEFE] dark:bg-[#15221B] rounded-t'
              : 'border-transparent text-[#415111]/70 dark:text-[#D2E186]/70 hover:text-[#415111]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>YOLO Explainability</span>
        </button>

        {falsePositiveIds.length > 0 && (
          <button
            onClick={() => setActiveTab('false_positives')}
            className={`px-3 py-1.5 text-xs font-tech font-bold uppercase tracking-wider border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'false_positives'
                ? 'border-[#FB8159] text-[#FB8159] bg-[#FEFEFE] dark:bg-[#15221B] rounded-t'
                : 'border-transparent text-[#FB8159]/70 hover:text-[#FB8159]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#FB8159]" />
            <span>Flagged False Positives</span>
            <span className="px-1 py-0.2 rounded bg-[#FB8159] text-[#FEFEFE] text-[9px] tabular-nums font-bold">
              {falsePositiveIds.length}
            </span>
          </button>
        )}
      </div>

      {/* Selected Target Contextual Action Bar */}
      {selectedDetection && (
        <div className="px-3 py-2 bg-[#D2E186]/30 dark:bg-[#1E2E21] border-b border-[#D2E186] dark:border-[#415111] flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#415111] dark:bg-[#D2E186] animate-ping" />
            <span className="font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#FEFEFE]">
              FOCUSED TARGET: {selectedDetection.id}
            </span>
            <span className="text-[10px] text-[#415111]/80 dark:text-[#D2E186]/80 font-medium">
              ({selectedDetection.class_name.replace(/_/g, ' ')}) • {Math.round(selectedDetection.confidence * 100)}% Conf
            </span>
          </div>

          {/* Consolidated Contextual Actions for Selected Target */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleCopyCoords(selectedDetection)}
              className="px-2.5 py-1 rounded bg-[#FEFEFE] dark:bg-[#15221B] border border-[#D2E186] dark:border-[#415111] text-[#415111] dark:text-[#D2E186] hover:border-[#415111] text-[10px] font-bold font-tech uppercase tracking-wider flex items-center gap-1 transition cursor-pointer shadow-sm"
              title="Copy GPS coordinates"
            >
              {copiedId === selectedDetection.id ? (
                <Check className="w-3 h-3 text-[#415111] dark:text-[#D2E186]" />
              ) : (
                <Copy className="w-3 h-3 text-[#415111] dark:text-[#D2E186]" />
              )}
              <span>{copiedId === selectedDetection.id ? 'COPIED' : 'COPY GPS'}</span>
            </button>

            {onOpenAICoPilot && (
              <button
                onClick={() => onOpenAICoPilot(`Analyze acoustic anomaly ${selectedDetection.id} (${selectedDetection.class_name}) at coordinates ${selectedDetection.latitude.toFixed(5)}°N, ${selectedDetection.longitude.toFixed(5)}°E.`)}
                className="px-2.5 py-1 rounded bg-[#FEFEFE] dark:bg-[#15221B] border border-[#D2E186] dark:border-[#415111] text-[#415111] dark:text-[#D2E186] hover:bg-[#D2E186] text-[10px] font-bold font-tech uppercase tracking-wider flex items-center gap-1 transition cursor-pointer shadow-sm"
                title="Ask AI Co-Pilot about this target"
              >
                <MessageSquare className="w-3 h-3 text-[#415111] dark:text-[#D2E186]" />
                <span>REMIX CHAT</span>
              </button>
            )}

            {onOpenTargetDiagnostics && (
              <button
                onClick={() => onOpenTargetDiagnostics(selectedDetection)}
                className="px-2.5 py-1 rounded bg-[#F2E8DF] dark:bg-[#15221B] border border-[#D2E186] dark:border-[#415111] text-[#415111] dark:text-[#D2E186] hover:bg-[#D2E186] text-[10px] font-bold font-tech uppercase tracking-wider flex items-center gap-1 transition cursor-pointer shadow-sm"
                title="Open deep acoustic diagnostics"
              >
                <Sparkles className="w-3 h-3 text-[#415111] dark:text-[#D2E186]" />
                <span>AI DIAGNOSTICS</span>
              </button>
            )}

            {onMarkFalsePositive && (
              <button
                onClick={() => onMarkFalsePositive(selectedDetection)}
                className="px-2.5 py-1 rounded bg-[#FB8159]/20 hover:bg-[#FB8159] text-[#FB8159] hover:text-[#FEFEFE] border border-[#FB8159] text-[10px] font-bold font-tech uppercase tracking-wider flex items-center gap-1 transition cursor-pointer shadow-sm"
                title="Mark as false positive anomaly"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>MARK FALSE POSITIVE</span>
              </button>
            )}

            <button
              onClick={() => onSelectDetection(null)}
              className="px-2 py-1 rounded text-[#415111]/70 dark:text-[#D2E186]/70 hover:text-[#415111] text-[10px] font-bold font-tech uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
              title="Clear Target Selection"
            >
              <X className="w-3 h-3" />
              <span>CLEAR</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 1: Interactive Data Table (with alternating rows, small debris icons, contextual action dropdown) */}
      {activeTab === 'table' && (
        <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
          {filteredDetections.length === 0 ? (
            <div className="p-8 text-center text-xs font-sans text-[#415111]/60 dark:text-[#D2E186]/60 flex flex-col items-center gap-2">
              <Target className="w-6 h-6 text-[#415111]/40 dark:text-[#D2E186]/40 mb-1" />
              <p className="font-semibold text-xs font-tech uppercase tracking-wider">
                {detections.length === 0
                  ? 'No acoustic anomalies detected.'
                  : 'No anomalies match the selected priority filter.'}
              </p>
              <p className="text-[11px] max-w-sm">
                Ingest side-scan sonar waterfall imagery or select a test survey preset to run YOLO detection.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-[#F2E8DF] dark:border-[#415111]/40 bg-[#F2E8DF] dark:bg-[#1E2E21] text-[#415111] dark:text-[#FEFEFE] text-[9px] uppercase tracking-wider sticky top-0 z-10 font-tech font-bold">
                  <th className="py-2.5 px-3">Index & ID</th>
                  <th className="py-2.5 px-3">
                    <span className="flex items-center gap-1">
                      <span>Debris Classification</span>
                    </span>
                  </th>
                  <th className="py-2.5 px-3">
                    <span className="flex items-center gap-1">
                      <span>Confidence</span>
                      <Tooltip
                        title="Confidence Score"
                        content="YOLOv8 probability score of acoustic backscatter and shadow matching the debris profile."
                      />
                    </span>
                  </th>
                  <th className="py-2.5 px-3">
                    <span className="flex items-center gap-1">
                      <span>GPS Coordinates (WGS84)</span>
                      <Tooltip
                        title="GPS Accuracy"
                        content="Estimated seabed coordinate calculated via towfish transducer acoustic layback (±1.5m)."
                      />
                    </span>
                  </th>
                  <th className="py-2.5 px-3">
                    <span className="flex items-center gap-1">
                      <span>Priority</span>
                      <Tooltip
                        title="Priority Level"
                        content="Environmental and navigational hazard rating: Critical, Warning, or Advisory."
                      />
                    </span>
                  </th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2E8DF] dark:divide-[#415111]/20 text-[#415111] dark:text-[#D2E186]">
                {filteredDetections.map((det, index) => {
                  const isSelected = selectedDetectionId === det.id;
                  const isFalsePositive = falsePositiveIds.includes(det.id);
                  const isEvenRow = index % 2 === 0;

                  return (
                    <tr
                      key={det.id}
                      ref={(el) => {
                        rowRefs.current[det.id] = el;
                      }}
                      onClick={() => onSelectDetection(isSelected ? null : det.id)}
                      className={`transition-colors duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[#D2E186]/35 dark:bg-[#1E2E21] border-l-4 border-l-[#415111] dark:border-l-[#D2E186] font-semibold'
                          : isEvenRow
                          ? 'bg-[#FEFEFE] dark:bg-[#15221B] hover:bg-[#D2E186]/15 dark:hover:bg-[#1E2E21]/60'
                          : 'bg-[#F2E8DF]/30 dark:bg-[#18261E]/40 hover:bg-[#D2E186]/15 dark:hover:bg-[#1E2E21]/60'
                      }`}
                    >
                      {/* ID */}
                      <td className="py-2.5 px-3 font-bold text-[#415111] dark:text-[#FEFEFE]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-bold font-tech tabular-nums ${
                              isSelected
                                ? 'bg-[#415111] text-[#FEFEFE]'
                                : 'bg-[#F2E8DF] dark:bg-[#1E2E21] text-[#415111] dark:text-[#D2E186] border border-[#D2E186] dark:border-[#415111]'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <Crosshair
                            className={`w-3.5 h-3.5 ${
                              isSelected ? 'text-[#415111] dark:text-[#D2E186] animate-spin' : 'text-[#415111]/50 dark:text-[#D2E186]/50'
                            }`}
                          />
                          <span className={`font-tech tabular-nums ${isSelected ? 'text-[#415111] dark:text-[#FEFEFE] font-bold' : 'font-semibold'}`}>
                            {det.id}
                          </span>
                          {isFalsePositive && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-tech font-bold uppercase tracking-wider bg-[#FB8159] text-[#FEFEFE]">
                              FP
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Debris Classification with Icon */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 rounded bg-[#F2E8DF] dark:bg-[#1E2E21] border border-[#D2E186]/60 dark:border-[#415111]/40">
                            {getDebrisIcon(det.class_name)}
                          </div>
                          <span className="capitalize font-semibold text-[#415111] dark:text-[#FEFEFE] font-sans">
                            {det.class_name.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Confidence Score */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-[#F2E8DF] dark:bg-[#1E2E21] h-2 rounded-full overflow-hidden border border-[#D2E186] dark:border-[#415111]/40">
                            <div
                              className="bg-[#415111] dark:bg-[#D2E186] h-full rounded-full transition-all"
                              style={{ width: `${det.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-tech tabular-nums font-bold text-[#415111] dark:text-[#FEFEFE]">
                            {Math.round(det.confidence * 100)}%
                          </span>
                        </div>
                      </td>

                      {/* Coordinates */}
                      <td className="py-2.5 px-3 text-[#415111] dark:text-[#D2E186] text-[11px] font-tech tabular-nums font-medium">
                        <span>{det.latitude.toFixed(5)}° N, {det.longitude.toFixed(5)}° E</span>
                      </td>

                      {/* Priority */}
                      <td className="py-2.5 px-3">{getPriorityBadge(det.priority)}</td>

                      {/* Actions: Contextual Dropdown / Toolbar */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleCopyCoords(det)}
                            className={`p-1.5 rounded transition cursor-pointer ${
                              copiedId === det.id
                                ? 'bg-[#D2E186] text-[#415111]'
                                : 'hover:bg-[#F2E8DF] dark:hover:bg-[#1E2E21] text-[#415111]/70 dark:text-[#D2E186]/70 hover:text-[#415111]'
                            }`}
                            title="Copy GPS coordinates"
                          >
                            {copiedId === det.id ? (
                              <Check className="w-3.5 h-3.5 text-[#415111]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {onOpenAICoPilot && (
                            <button
                              onClick={() => onOpenAICoPilot(`Target ${det.id}: ${det.class_name} at ${det.latitude.toFixed(5)}N, ${det.longitude.toFixed(5)}E with ${Math.round(det.confidence * 100)}% confidence.`)}
                              className="p-1.5 rounded hover:bg-[#F2E8DF] dark:hover:bg-[#1E2E21] text-[#415111]/70 dark:text-[#D2E186]/70 hover:text-[#415111] transition cursor-pointer"
                              title="Remix Chat / Ask AI Co-Pilot"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onOpenTargetDiagnostics && (
                            <button
                              onClick={() => onOpenTargetDiagnostics(det)}
                              className="p-1.5 rounded hover:bg-[#D2E186] text-[#415111]/70 dark:text-[#D2E186]/70 hover:text-[#415111] transition cursor-pointer"
                              title="AI Acoustic Diagnostics"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onMarkFalsePositive && (
                            <button
                              onClick={() => onMarkFalsePositive(det)}
                              className="p-1.5 rounded hover:bg-[#FB8159]/20 text-[#FB8159] transition cursor-pointer"
                              title="Mark as false positive"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Coordinates & Spatial Log (Collapsible / Card View) */}
      {activeTab === 'coordinates' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#FEFEFE] flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              <span>Bathymetric Spatial Georeferencing</span>
            </div>
            <button
              onClick={handleCopyAllCoordinates}
              className="px-3 py-1 rounded bg-[#F2E8DF] dark:bg-[#1E2E21] hover:bg-[#D2E186] text-[#415111] dark:text-[#D2E186] border border-[#D2E186] dark:border-[#415111] text-[10px] font-tech font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedId === 'ALL' ? <Check className="w-3 h-3 text-[#415111]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId === 'ALL' ? 'ALL COPIED' : 'COPY ALL COORDINATES'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {detections.map((det) => (
              <div
                key={det.id}
                onClick={() => onSelectDetection(det.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedDetectionId === det.id
                    ? 'bg-[#D2E186]/30 dark:bg-[#1E2E21] border-[#415111] dark:border-[#D2E186] shadow-sm'
                    : 'bg-[#FEFEFE] dark:bg-[#18261E] border-[#F2E8DF] dark:border-[#415111]/40 hover:border-[#D2E186]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-tech font-bold text-xs text-[#415111] dark:text-[#FEFEFE]">
                    {det.id}
                  </span>
                  {getPriorityBadge(det.priority)}
                </div>
                <div className="space-y-1 text-[11px] font-sans text-[#415111]/90 dark:text-[#D2E186]/90">
                  <div className="font-tech tabular-nums font-semibold">
                    LAT: {det.latitude.toFixed(6)}° N
                  </div>
                  <div className="font-tech tabular-nums font-semibold">
                    LON: {det.longitude.toFixed(6)}° E
                  </div>
                  <div className="text-[10px] text-[#415111]/70 dark:text-[#D2E186]/70 pt-1 border-t border-[#F2E8DF] dark:border-[#415111]/40 flex justify-between">
                    <span>Bounding Box: {det.bbox.width}×{det.bbox.height}px</span>
                    <button
                      onClick={(e) => handleCopyCoords(det, e)}
                      className="text-[#415111] dark:text-[#D2E186] font-bold font-tech hover:underline"
                    >
                      {copiedId === det.id ? 'COPIED' : 'COPY'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Threat Assessment & Ecological Matrix */}
      {activeTab === 'threat' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-[#FB8159]/15 border border-[#FB8159] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#FB8159] flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Ghost Net Entanglement Risk</span>
                </span>
                <span className="text-[10px] font-tech font-bold text-[#FB8159]">CRITICAL</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#415111] dark:text-[#FEFEFE]">
                Derelict nylon nets pose immediate mortality hazards to cetaceans, sea turtles, and benthic fish. Unrecovered gear continues cyclical trapping indefinitely.
              </p>
              <div className="text-[10px] font-tech font-bold text-[#FB8159]">
                Recommended Action: Deploy ROV cutter or winch retrieval.
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#FCBF93]/25 border border-[#FB8159]/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#FEFEFE] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-[#FB8159]" />
                  <span>Benthic Habitat Degradation</span>
                </span>
                <span className="text-[10px] font-tech font-bold text-[#415111] dark:text-[#FEFEFE]">WARNING</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#415111] dark:text-[#FEFEFE]">
                Heavy metal containers and submerged industrial debris crush benthic coral communities and leach toxic oxidized particulates into bottom currents.
              </p>
              <div className="text-[10px] font-tech font-bold text-[#415111] dark:text-[#D2E186]">
                Recommended Action: Environmental monitoring & heavy grapple hoist.
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#D2E186]/25 border border-[#415111]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#FEFEFE] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#415111]" />
                  <span>Navigational Advisory</span>
                </span>
                <span className="text-[10px] font-tech font-bold text-[#415111] dark:text-[#FEFEFE]">ADVISORY</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#415111] dark:text-[#FEFEFE]">
                Derelict traps and scattered synthetic lines pose snagging hazards for commercial trawlers, subsea telecommunication cables, and survey towfishes.
              </p>
              <div className="text-[10px] font-tech font-bold text-[#415111] dark:text-[#D2E186]">
                Recommended Action: Issue Notice to Mariners (NOTMAR).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: YOLO Explainability & Saliency Maps */}
      {activeTab === 'explainability' && (
        <div className="p-3.5">
          <ExplainabilityPanel
            detection={selectedDetection || (detections.length > 0 ? detections[0] : null)}
            totalDetections={detections.length}
          />
        </div>
      )}

      {/* Tab 5: Flagged False Positives */}
      {activeTab === 'false_positives' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#FB8159] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Flagged False Positives for YOLO Retraining</span>
            </span>
            <span className="text-[10px] font-tech text-[#415111]/70 dark:text-[#D2E186]/70">
              {falsePositiveIds.length} flagged anomalies
            </span>
          </div>

          <div className="space-y-2">
            {falsePositiveIds.map((id) => {
              const det = detections.find((d) => d.id === id);
              return (
                <div
                  key={id}
                  className="p-3 rounded-lg bg-[#FB8159]/10 border border-[#FB8159] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-tech font-bold text-[#415111] dark:text-[#FEFEFE]">
                      Target {id} {det && `(${det.class_name})`}
                    </span>
                    <p className="text-[10px] text-[#415111]/80 dark:text-[#D2E186]/80">
                      Excluded from threat statistics. Queued for training feedback dataset.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (onMarkFalsePositive && det) onMarkFalsePositive(det);
                    }}
                    className="px-2.5 py-1 rounded bg-[#FEFEFE] dark:bg-[#15221B] border border-[#FB8159] text-[#FB8159] text-[10px] font-tech font-bold uppercase tracking-wider hover:bg-[#FB8159] hover:text-[#FEFEFE] transition"
                  >
                    Unflag / Restore
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#F2E8DF] dark:border-[#415111]/40 bg-[#F2E8DF]/40 dark:bg-[#1E2E21]/50 flex items-center justify-between text-[10px] font-sans text-[#415111]/80 dark:text-[#D2E186]/80">
        <div className="flex items-center gap-3">
          <span>Click any detection row to focus reticle in Waterfall and Map</span>
        </div>
        <div className="flex items-center gap-2 font-tech font-semibold">
          <span>WGS84 GEODETIC DATUM</span>
          <span>•</span>
          <span>SONAR_YOLO_V8</span>
        </div>
      </div>
    </div>
  );
};
