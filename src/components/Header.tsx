import React from 'react';
import {
  Waves,
  Scan,
  FolderUp,
  TrendingUp,
  History,
  Sparkles,
  MessageSquare,
  Moon,
  Sun,
  Info,
  Play,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { HealthResponse } from '../types/detection';

export type AppSection = 'cockpit' | 'ingest' | 'analytics' | 'history';

interface HeaderProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  queueCount: number;
  historyCount: number;
  hasResult: boolean;
  isBackendHealthy: boolean;
  onOpenInfo: () => void;
  onOpenThreatAssessment?: () => void;
  onOpenAICoPilot?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onQuickSelectSample?: (sampleId: string) => void;
  onRunScan?: () => void;
  canRunScan?: boolean;
  isAnalyzing?: boolean;
}

const SAMPLE_PRESETS = [
  { id: 'ghost_net', label: 'Ghost Net (Sector 4)' },
  { id: 'metal_debris', label: 'Metal Debris (Sector 7)' },
  { id: 'trawl_gear', label: 'Derelict Trap (Sector 9)' },
];

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onSelectSection,
  queueCount,
  historyCount,
  hasResult,
  isBackendHealthy,
  onOpenInfo,
  onOpenThreatAssessment,
  onOpenAICoPilot,
  theme,
  onToggleTheme,
  onQuickSelectSample,
  onRunScan,
  canRunScan = false,
  isAnalyzing = false,
}) => {
  return (
    <header className="h-14 border-b border-[#F2E8DF] dark:border-[#415111]/40 bg-[#FEFEFE] dark:bg-[#15221B] px-3 sm:px-5 flex items-center justify-between z-40 select-none transition-colors">
      {/* Brand & Section Navigation */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Brand Icon & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-[#F2E8DF] dark:bg-[#1E2E21] border border-[#D2E186] flex items-center justify-center text-[#415111] dark:text-[#D2E186] shadow-sm">
            <Waves className="w-4 h-4 text-[#415111] dark:text-[#D2E186]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-[#415111] dark:text-[#FEFEFE] font-tech uppercase leading-none">
              MARINE DEBRIS AI
            </h1>
            <div className="text-[10px] text-[#415111]/70 dark:text-[#D2E186]/70 font-tech uppercase tracking-wide">
              Hydrographic Survey Cockpit
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-[#F2E8DF] dark:bg-[#415111]/40 hidden md:block" />

        {/* Section Navigation Tabs */}
        <nav className="flex items-center bg-[#F2E8DF]/60 dark:bg-[#1E2E21] p-0.5 rounded-lg border border-[#D2E186]/80 dark:border-[#415111]/50 text-xs font-sans">
          <button
            onClick={() => onSelectSection('cockpit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'cockpit'
                ? 'bg-[#415111] text-[#FEFEFE] shadow-sm'
                : 'text-[#415111] dark:text-[#D2E186] hover:bg-[#D2E186]/40'
            }`}
            title="Interactive Sonar Waterfall & Map Cockpit"
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline uppercase tracking-wider font-tech">Cockpit</span>
          </button>

          <button
            onClick={() => onSelectSection('ingest')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'ingest'
                ? 'bg-[#415111] text-[#FEFEFE] shadow-sm'
                : 'text-[#415111] dark:text-[#D2E186] hover:bg-[#D2E186]/40'
            }`}
            title="Sonar Data Ingestion & Batch Queue"
          >
            <FolderUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline uppercase tracking-wider font-tech">Ingest</span>
            {queueCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#D2E186] text-[#415111] text-[9px] font-tech font-bold tabular-nums">
                {queueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectSection('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'analytics'
                ? 'bg-[#415111] text-[#FEFEFE] shadow-sm'
                : 'text-[#415111] dark:text-[#D2E186] hover:bg-[#D2E186]/40'
            }`}
            title="Survey Telemetry & Anomaly Analytics"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline uppercase tracking-wider font-tech">Analytics</span>
          </button>

          <button
            onClick={() => onSelectSection('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'history'
                ? 'bg-[#415111] text-[#FEFEFE] shadow-sm'
                : 'text-[#415111] dark:text-[#D2E186] hover:bg-[#D2E186]/40'
            }`}
            title="Stored Survey Mission History"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline uppercase tracking-wider font-tech">History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#D2E186] text-[#415111] text-[9px] font-tech font-bold tabular-nums">
                {historyCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Quick Action Controls & Utilities */}
      <div className="flex items-center gap-2">
        {/* Sample Preset Chooser */}
        {onQuickSelectSample && (
          <div className="hidden lg:flex items-center gap-1 bg-[#F2E8DF]/60 dark:bg-[#1E2E21] border border-[#D2E186]/80 dark:border-[#415111] rounded-md px-2 py-1 text-xs">
            <span className="text-[10px] font-tech font-bold uppercase text-[#415111]/70 dark:text-[#D2E186]/70 mr-1">
              Sample:
            </span>
            {SAMPLE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => onQuickSelectSample(p.id)}
                className="px-2 py-0.5 rounded text-[10px] font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#D2E186] hover:bg-[#D2E186] hover:text-[#415111] transition cursor-pointer"
              >
                {p.label.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* Primary Scan Button (if can run scan) */}
        {canRunScan && onRunScan && (
          <button
            onClick={onRunScan}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#415111] hover:bg-[#415111]/90 text-[#FEFEFE] font-tech font-bold text-xs uppercase tracking-wider shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3 h-3 fill-current ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Scanning...' : 'Run Scan'}</span>
          </button>
        )}

        {/* AI Threat Assessment Button */}
        {onOpenThreatAssessment && hasResult && (
          <button
            onClick={onOpenThreatAssessment}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#FB8159] hover:bg-[#FCBF93] text-[#FEFEFE] font-sans font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-sm"
            title="Open AI Ecological & Threat Assessment"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Threat Intel</span>
          </button>
        )}

        {/* AI Co-Pilot Button */}
        {onOpenAICoPilot && (
          <button
            onClick={onOpenAICoPilot}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#F2E8DF] dark:bg-[#1E2E21] hover:bg-[#D2E186] text-[#415111] dark:text-[#D2E186] border border-[#D2E186] dark:border-[#415111] font-sans font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            title="Open AQUAVISION AI Hydrographic Assistant"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        )}

        {/* Theme Switcher */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-md bg-[#F2E8DF] dark:bg-[#1E2E21] hover:bg-[#D2E186] text-[#415111] dark:text-[#D2E186] border border-[#D2E186] dark:border-[#415111] transition cursor-pointer"
          title={theme === 'dark' ? 'Switch to Daylight Theme' : 'Switch to Dark Sonar Theme'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-[#D2E186]" /> : <Moon className="w-4 h-4 text-[#415111]" />}
        </button>

        {/* Compact Health Pill */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-[#F2E8DF]/60 dark:bg-[#1E2E21] border border-[#D2E186] dark:border-[#415111] rounded-md"
          title={`Pipeline Status: ${isBackendHealthy ? 'Operational' : 'Calibrating'}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendHealthy ? 'bg-[#415111] dark:bg-[#D2E186]' : 'bg-[#FCBF93] animate-ping'
            }`}
          />
          <span className="text-[10px] font-tech font-bold uppercase tracking-wider text-[#415111] dark:text-[#FEFEFE]">
            {isBackendHealthy ? 'ONLINE' : 'SYNC'}
          </span>
        </div>

        {/* Specs Modal Trigger */}
        <button
          onClick={onOpenInfo}
          className="p-1.5 rounded-md bg-[#F2E8DF] dark:bg-[#1E2E21] hover:bg-[#D2E186] text-[#415111] dark:text-[#D2E186] border border-[#D2E186] dark:border-[#415111] transition cursor-pointer"
          title="Technical Architecture & YOLO Integration"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
