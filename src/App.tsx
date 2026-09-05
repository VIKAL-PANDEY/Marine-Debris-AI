import React, { useState, useEffect, useRef } from 'react';
import { Header, AppSection } from './components/Header';
import { CockpitTargetsPanel } from './components/CockpitTargetsPanel';
import { MissionHistorySection } from './components/MissionHistorySection';
import { SonarViewer } from './components/SonarViewer';
import { MarineMap } from './map/MarineMap';
import { UploadPanel } from './components/UploadPanel';
import { ProcessingStatus } from './components/ProcessingStatus';
import { MissionStatistics } from './components/MissionStatistics';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { ArchitectureInfoModal } from './components/ArchitectureInfoModal';
import { AIThreatAssessmentModal } from './components/AIThreatAssessmentModal';
import { AITargetDiagnosticsModal } from './components/AITargetDiagnosticsModal';
import { AICoPilotChatDrawer } from './components/AICoPilotChatDrawer';
import { FalsePositiveModal } from './components/FalsePositiveModal';
import { checkBackendHealth, analyzeSonarImage, analyzeSonarWithYOLO } from './services/api';
import {
  saveScanToHistory,
  getScanHistory,
  flagFalsePositiveInScan,
  ScanHistoryRecord,
} from './services/scanHistory';
import {
  DetectionResult,
  DetectionItem,
  HealthResponse,
  ProcessingStage,
  QueuedSonarFile,
  BatchProgress,
} from './types/detection';
import { Columns, Maximize2, MapPin, Scan, Sparkles, ArrowRight, FolderUp, Activity } from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);

  // Active Navigation Section ('cockpit' | 'ingest' | 'analytics' | 'history')
  const [activeSection, setActiveSection] = useState<AppSection>('cockpit');

  // Theme Management (Light / Dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('marine_debris_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('marine_debris_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Multi-file Queue states
  const [filesQueue, setFilesQueue] = useState<QueuedSonarFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const batchAbortRef = useRef<boolean>(false);

  // Active view states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawImagePreviewUrl, setRawImagePreviewUrl] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('idle');
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [selectedDetectionId, setSelectedDetectionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cockpit visual stage layout
  const [visualLayoutMode, setVisualLayoutMode] = useState<'split' | 'sonar' | 'map'>('split');

  // Modals & Drawers
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isThreatModalOpen, setIsThreatModalOpen] = useState<boolean>(false);
  const [diagnosticsTarget, setDiagnosticsTarget] = useState<DetectionItem | null>(null);
  const [isCoPilotOpen, setIsCoPilotOpen] = useState<boolean>(false);
  const [coPilotInitialPrompt, setCoPilotInitialPrompt] = useState<string>('');
  const [historyRecords, setHistoryRecords] = useState<ScanHistoryRecord[]>([]);

  // False Positive Feedback Loop
  const [falsePositiveTarget, setFalsePositiveTarget] = useState<DetectionItem | null>(null);
  const [falsePositiveIds, setFalsePositiveIds] = useState<string[]>([]);

  // Refresh history on mount
  useEffect(() => {
    setHistoryRecords(getScanHistory());
  }, []);

  const activeTargetItem = result?.detections.find((d) => d.id === selectedDetectionId) || null;

  // Poll / check backend health on mount
  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      try {
        const data = await checkBackendHealth();
        if (isMounted) {
          setHealth(data);
          setIsBackendHealthy(true);
        }
      } catch (err) {
        if (isMounted) {
          setIsBackendHealthy(false);
        }
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Pre-load default sample into the queue on mount
  useEffect(() => {
    let isMounted = true;
    const loadInitialSample = async () => {
      try {
        const res = await fetch('/samples/sample_ghost_net.png');
        const blob = await res.blob();
        if (!isMounted) return;
        const file = new File([blob], 'sonar_transect_sector4_ghostnet.png', { type: 'image/png' });
        const id = `preset-ghost_net-${Date.now()}`;
        const previewUrl = URL.createObjectURL(file);

        const initialItem: QueuedSonarFile = {
          id,
          file,
          previewUrl,
          status: 'queued',
        };

        setFilesQueue([initialItem]);
        setActiveFileId(id);
        setSelectedFile(file);
        setRawImagePreviewUrl(previewUrl);

        // Run auto inference on initial sample so user immediately sees detections
        setTimeout(() => {
          if (isMounted) {
            handleAnalyzeSingle(id, 'yolo', 0.25);
          }
        }, 300);
      } catch (err) {
        console.warn('Initial sample preload skipped:', err);
      }
    };

    loadInitialSample();
    return () => {
      isMounted = false;
    };
  }, []);

  // Quick preset loading helper (1-click sample switch)
  const handleQuickLoadSample = async (sampleId: string) => {
    const sampleMap: { [key: string]: { url: string; filename: string } } = {
      ghost_net: {
        url: '/samples/sample_ghost_net.png',
        filename: 'sonar_transect_sector4_ghostnet.png',
      },
      metal_debris: {
        url: '/samples/sample_metal_debris.png',
        filename: 'sonar_transect_sector7_metal_debris.png',
      },
      trawl_gear: {
        url: '/samples/sample_trawl_gear.png',
        filename: 'sonar_transect_sector9_derelict_trap.png',
      },
    };

    const sample = sampleMap[sampleId];
    if (!sample) return;

    try {
      setProcessingStage('uploading');
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const file = new File([blob], sample.filename, { type: 'image/png' });
      const id = `preset-${sampleId}-${Date.now()}`;
      const previewUrl = URL.createObjectURL(file);

      const newItem: QueuedSonarFile = {
        id,
        file,
        previewUrl,
        status: 'queued',
      };

      setFilesQueue((prev) => [newItem, ...prev.filter((f) => !f.id.startsWith(`preset-${sampleId}`))]);
      setActiveFileId(id);
      setSelectedFile(file);
      setRawImagePreviewUrl(previewUrl);
      setResult(null);
      setSelectedDetectionId(null);
      setFalsePositiveIds([]);
      setError(null);
      setActiveSection('cockpit');

      // Auto analyze the loaded sample
      handleAnalyzeSingle(id, 'yolo', 0.25);
    } catch (err) {
      console.error('Failed to load sample:', err);
    }
  };

  // Handle adding multiple files to the queue
  const handleAddFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;

    const newItems: QueuedSonarFile[] = newFiles.map((file, idx) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${idx}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'queued',
    }));

    setFilesQueue((prev) => [...prev, ...newItems]);

    if (!activeFileId && newItems.length > 0) {
      const first = newItems[0];
      setActiveFileId(first.id);
      setSelectedFile(first.file);
      setRawImagePreviewUrl(first.previewUrl);
      setResult(null);
      setSelectedDetectionId(null);
      setFalsePositiveIds([]);
      setError(null);
    }
  };

  const handleSelectQueuedFile = (fileId: string) => {
    const item = filesQueue.find((f) => f.id === fileId);
    if (!item) return;

    setActiveFileId(fileId);
    setSelectedFile(item.file);
    setRawImagePreviewUrl(item.previewUrl);
    setResult(item.result || null);
    setSelectedDetectionId(null);
    setFalsePositiveIds([]);
    setError(item.error || null);
    setProcessingStage(item.status === 'completed' ? 'completed' : 'idle');
  };

  const handleRemoveQueuedFile = (fileId: string) => {
    setFilesQueue((prev) => {
      const remaining = prev.filter((f) => f.id !== fileId);
      if (activeFileId === fileId) {
        if (remaining.length > 0) {
          const next = remaining[0];
          setActiveFileId(next.id);
          setSelectedFile(next.file);
          setRawImagePreviewUrl(next.previewUrl);
          setResult(next.result || null);
          setError(next.error || null);
          setProcessingStage(next.status === 'completed' ? 'completed' : 'idle');
        } else {
          setActiveFileId(null);
          setSelectedFile(null);
          setRawImagePreviewUrl(null);
          setResult(null);
          setError(null);
          setProcessingStage('idle');
        }
      }
      return remaining;
    });
  };

  const handleClearQueue = () => {
    setFilesQueue([]);
    setActiveFileId(null);
    setSelectedFile(null);
    setRawImagePreviewUrl(null);
    setResult(null);
    setSelectedDetectionId(null);
    setFalsePositiveIds([]);
    setError(null);
    setProcessingStage('idle');
  };

  const handleAnalyzeSingle = async (
    fileId: string,
    engineMode: 'yolo' | 'server' = 'yolo',
    confThreshold = 0.25
  ) => {
    const item = filesQueue.find((f) => f.id === fileId);
    if (!item) return;

    setActiveFileId(fileId);
    setSelectedFile(item.file);
    setRawImagePreviewUrl(item.previewUrl);
    setError(null);
    setSelectedDetectionId(null);
    setFalsePositiveIds([]);
    setProcessingStage('uploading');

    setFilesQueue((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: 'analyzing', error: null } : f))
    );

    try {
      let data: DetectionResult;
      if (engineMode === 'yolo') {
        data = await analyzeSonarWithYOLO(
          item.file,
          (stage) => setProcessingStage(stage),
          confThreshold
        );
      } else {
        data = await analyzeSonarImage(item.file, (stage) => {
          setProcessingStage(stage);
        });
      }

      saveScanToHistory(data, item.file.name, item.previewUrl, engineMode, []);
      setHistoryRecords(getScanHistory());

      setFilesQueue((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'completed',
                result: data,
                detectionCount: data.detections.length,
                engineUsed: engineMode,
              }
            : f
        )
      );
      setResult(data);
      setProcessingStage('completed');
    } catch (err: any) {
      console.error('Analysis failed for item:', item.file.name, err);
      const errMsg = err.message || 'Inference error on sonar scan';
      setError(errMsg);
      setProcessingStage('error');
      setFilesQueue((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: 'error', error: errMsg } : f))
      );
    }
  };

  const handleAnalyzeBatch = async (
    engineMode: 'yolo' | 'server' = 'yolo',
    confThreshold = 0.25
  ) => {
    if (filesQueue.length === 0 || isBatchRunning) return;

    batchAbortRef.current = false;
    setIsBatchRunning(true);
    setError(null);
    setSelectedDetectionId(null);

    const pendingItems = filesQueue.filter((f) => f.status === 'queued');
    const itemsToProcess = pendingItems.length > 0 ? pendingItems : filesQueue;

    let completed = 0;
    let failed = 0;

    for (let i = 0; i < itemsToProcess.length; i++) {
      if (batchAbortRef.current) break;

      const currentItem = itemsToProcess[i];

      setBatchProgress({
        current: i + 1,
        total: itemsToProcess.length,
        currentFilename: currentItem.file.name,
        completedCount: completed,
        failedCount: failed,
      });

      setActiveFileId(currentItem.id);
      setSelectedFile(currentItem.file);
      setRawImagePreviewUrl(currentItem.previewUrl);

      setFilesQueue((prev) =>
        prev.map((f) => (f.id === currentItem.id ? { ...f, status: 'analyzing', error: null } : f))
      );

      setProcessingStage('uploading');

      try {
        let data: DetectionResult;
        if (engineMode === 'yolo') {
          data = await analyzeSonarWithYOLO(
            currentItem.file,
            (stage) => setProcessingStage(stage),
            confThreshold
          );
        } else {
          data = await analyzeSonarImage(currentItem.file, (stage) => {
            setProcessingStage(stage);
          });
        }

        saveScanToHistory(data, currentItem.file.name, currentItem.previewUrl, engineMode, []);

        completed++;
        setFilesQueue((prev) =>
          prev.map((f) =>
            f.id === currentItem.id
              ? {
                  ...f,
                  status: 'completed',
                  result: data,
                  detectionCount: data.detections.length,
                  engineUsed: engineMode,
                }
              : f
          )
        );

        setResult(data);
      } catch (err: any) {
        failed++;
        console.error('Batch item failed:', currentItem.file.name, err);
        const errMsg = err.message || 'Sonar inference error';
        setFilesQueue((prev) =>
          prev.map((f) =>
            f.id === currentItem.id ? { ...f, status: 'error', error: errMsg } : f
          )
        );
      }
    }

    setHistoryRecords(getScanHistory());
    setIsBatchRunning(false);
    setBatchProgress(null);
    setProcessingStage('completed');
  };

  const handleCancelBatch = () => {
    batchAbortRef.current = true;
    setIsBatchRunning(false);
    setBatchProgress(null);
    setProcessingStage('idle');
  };

  const handleSelectHistoryScan = (record: ScanHistoryRecord) => {
    setResult(record.result);
    setRawImagePreviewUrl(record.previewUrl);
    setSelectedDetectionId(null);
    setFalsePositiveIds(record.falsePositiveIds || []);
    setProcessingStage('completed');
    setError(null);
    setActiveSection('cockpit');
  };

  const handleConfirmFalsePositive = (targetId: string, reason: string, notes: string) => {
    setFalsePositiveIds((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]));
    if (result) {
      flagFalsePositiveInScan(result.result_id, targetId, reason, notes);
      setHistoryRecords(getScanHistory());
    }
    setFalsePositiveTarget(null);
  };

  const handleOpenAICoPilotWithPrompt = (initialPrompt?: string) => {
    if (initialPrompt) {
      setCoPilotInitialPrompt(initialPrompt);
    }
    setIsCoPilotOpen(true);
  };

  // Run scan on the currently active file or queue
  const handleTriggerActiveScan = () => {
    if (activeFileId) {
      handleAnalyzeSingle(activeFileId, 'yolo', 0.25);
    } else if (filesQueue.length > 0) {
      handleAnalyzeBatch('yolo', 0.25);
    }
  };

  const canRunScan =
    filesQueue.length > 0 &&
    (processingStage === 'idle' || processingStage === 'completed' || processingStage === 'error');

  const isAnalyzing =
    processingStage !== 'idle' &&
    processingStage !== 'completed' &&
    processingStage !== 'error';

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#FEFEFE] dark:bg-[#0A1120] text-[#114AB1] dark:text-[#FEFEFE] font-sans transition-colors selection:bg-[#6793AC] selection:text-[#FEFEFE]">
      {/* Top Unified Header Navigation */}
      <Header
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        queueCount={filesQueue.length}
        historyCount={historyRecords.length}
        hasResult={!!result}
        isBackendHealthy={isBackendHealthy}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        onOpenThreatAssessment={() => setIsThreatModalOpen(true)}
        onOpenAICoPilot={() => handleOpenAICoPilotWithPrompt()}
        theme={theme}
        onToggleTheme={toggleTheme}
        onQuickSelectSample={handleQuickLoadSample}
        onRunScan={handleTriggerActiveScan}
        canRunScan={canRunScan}
        isAnalyzing={isAnalyzing}
      />

      {/* Main Single-Screen Viewport Content */}
      <main className="flex-1 min-h-0 w-full relative overflow-hidden">
        {/* ================= SECTION 1: SONAR COCKPIT (ZERO-SCROLL WORKSPACE) ================= */}
        {activeSection === 'cockpit' && (
          <div className="h-full w-full p-2 sm:p-2.5 flex flex-col lg:flex-row gap-2.5 overflow-hidden">
            {/* Left / Center: Interactive Sonar Waterfall & Bathymetric Map Stage */}
            <div className="flex-1 min-h-0 flex flex-col bg-[#FEFEFE] dark:bg-[#0A1120] border border-[#EBF2F7] dark:border-[#114AB1]/40 rounded-lg overflow-hidden shadow-sm">
              {/* Stage Sub-Header Bar */}
              <div className="h-10 px-3 border-b border-[#EBF2F7] dark:border-[#114AB1]/40 bg-[#EBF2F7]/40 dark:bg-[#114AB1]/20 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 text-xs font-tech font-bold uppercase tracking-wider">
                  <span className="text-[#6793AC]">TRANSECT:</span>
                  <span className="text-[#114AB1] dark:text-[#FEFEFE] truncate max-w-[200px] sm:max-w-[340px]">
                    {selectedFile ? selectedFile.name : result ? result.result_id : 'Awaiting Sonar Waterfall'}
                  </span>
                  {result && (
                    <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-[#6793AC] text-[#FEFEFE] text-[10px] font-tech font-bold">
                      {result.detections.length} TARGETS DETECTED
                    </span>
                  )}
                </div>

                {/* Viewport Split / Single Switcher */}
                <div className="flex items-center bg-[#EBF2F7] dark:bg-[#114AB1]/20 border border-[#6793AC] dark:border-[#114AB1] rounded p-0.5 text-xs font-sans">
                  <button
                    onClick={() => setVisualLayoutMode('split')}
                    className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition cursor-pointer flex items-center gap-1 ${
                      visualLayoutMode === 'split'
                        ? 'bg-[#114AB1] text-[#FEFEFE]'
                        : 'text-[#114AB1]/70 dark:text-[#6793AC] hover:text-[#114AB1]'
                    }`}
                    title="Dual Side-by-Side View"
                  >
                    <Columns className="w-3 h-3" />
                    <span className="hidden sm:inline">Dual</span>
                  </button>
                  <button
                    onClick={() => setVisualLayoutMode('sonar')}
                    className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition cursor-pointer flex items-center gap-1 ${
                      visualLayoutMode === 'sonar'
                        ? 'bg-[#114AB1] text-[#FEFEFE]'
                        : 'text-[#114AB1]/70 dark:text-[#6793AC] hover:text-[#114AB1]'
                    }`}
                    title="Acoustic Waterfall Only"
                  >
                    <Scan className="w-3 h-3" />
                    <span className="hidden sm:inline">Waterfall</span>
                  </button>
                  <button
                    onClick={() => setVisualLayoutMode('map')}
                    className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition cursor-pointer flex items-center gap-1 ${
                      visualLayoutMode === 'map'
                        ? 'bg-[#114AB1] text-[#FEFEFE]'
                        : 'text-[#114AB1]/70 dark:text-[#6793AC] hover:text-[#114AB1]'
                    }`}
                    title="Hydrographic Map Only"
                  >
                    <MapPin className="w-3 h-3" />
                    <span className="hidden sm:inline">Map</span>
                  </button>
                </div>
              </div>

              {/* Stage Viewport Area (Zero overflow, exact container fit) */}
              <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2 p-2 overflow-hidden bg-[#114AB1]/5 dark:bg-black/20">
                {/* Sonar Waterfall Viewer Sub-Pane */}
                {(visualLayoutMode === 'split' || visualLayoutMode === 'sonar') && (
                  <div
                    className={`h-full min-h-0 ${
                      visualLayoutMode === 'split' ? 'w-full lg:w-[58%]' : 'w-full'
                    }`}
                  >
                    <SonarViewer
                      result={result}
                      selectedDetectionId={selectedDetectionId}
                      onSelectDetection={setSelectedDetectionId}
                      rawImagePreviewUrl={rawImagePreviewUrl}
                    />
                  </div>
                )}

                {/* Leaflet Marine Map Sub-Pane */}
                {(visualLayoutMode === 'split' || visualLayoutMode === 'map') && (
                  <div
                    className={`h-full min-h-0 ${
                      visualLayoutMode === 'split' ? 'w-full lg:w-[42%]' : 'w-full'
                    }`}
                  >
                    <MarineMap
                      detections={result ? result.detections : []}
                      selectedDetectionId={selectedDetectionId}
                      onSelectDetection={setSelectedDetectionId}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Clean Detection Targets & Target Inspector */}
            <div className="w-full lg:w-[380px] xl:w-[420px] h-full min-h-0 shrink-0 border border-[#EBF2F7] dark:border-[#114AB1]/40 rounded-lg overflow-hidden shadow-sm bg-[#FEFEFE] dark:bg-[#0A1120]">
              <CockpitTargetsPanel
                result={result}
                selectedDetectionId={selectedDetectionId}
                onSelectDetection={setSelectedDetectionId}
                onOpenTargetDiagnostics={(target) => setDiagnosticsTarget(target)}
                onOpenAICoPilot={(prompt) => handleOpenAICoPilotWithPrompt(prompt)}
                onMarkFalsePositive={(target) => setFalsePositiveTarget(target)}
                falsePositiveIds={falsePositiveIds}
                onOpenThreatAssessment={() => setIsThreatModalOpen(true)}
                onSwitchToIngest={() => setActiveSection('ingest')}
              />
            </div>
          </div>
        )}

        {/* ================= SECTION 2: DATA INGESTION & BATCH QUEUE ================= */}
        {activeSection === 'ingest' && (
          <div className="h-full w-full p-4 sm:p-6 overflow-y-auto max-w-[1500px] mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EBF2F7] dark:border-[#114AB1]/40">
              <div>
                <h2 className="text-base sm:text-lg font-tech font-bold uppercase tracking-wider text-[#114AB1] dark:text-[#FEFEFE] flex items-center gap-2">
                  <FolderUp className="w-5 h-5 text-[#114AB1] dark:text-[#6793AC]" />
                  <span>ACOUSTIC DATA ACQUISITION & BATCH INGESTION</span>
                </h2>
                <p className="text-xs text-[#6793AC] mt-0.5">
                  Import side-scan sonar image transects, configure YOLOv8 WASM sensitivity, and execute batch inference.
                </p>
              </div>

              {result && (
                <button
                  onClick={() => setActiveSection('cockpit')}
                  className="px-4 py-2 rounded-md bg-[#114AB1] hover:bg-[#114AB1]/90 text-[#FEFEFE] font-tech font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto"
                >
                  <span>Open Active Scan in Cockpit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Upload Dropzone & Queue Manager */}
              <div className="lg:col-span-7">
                <UploadPanel
                  filesQueue={filesQueue}
                  activeFileId={activeFileId}
                  onAddFiles={handleAddFiles}
                  onSelectQueuedFile={handleSelectQueuedFile}
                  onRemoveQueuedFile={handleRemoveQueuedFile}
                  onClearQueue={handleClearQueue}
                  onAnalyzeSingle={(id, mode, thresh) => {
                    handleAnalyzeSingle(id, mode, thresh);
                    setActiveSection('cockpit');
                  }}
                  onAnalyzeBatch={(mode, thresh) => {
                    handleAnalyzeBatch(mode, thresh);
                    setActiveSection('cockpit');
                  }}
                  onCancelBatch={handleCancelBatch}
                  isBatchRunning={isBatchRunning}
                  batchProgress={batchProgress}
                  selectedFile={selectedFile}
                  onFileSelect={(file) => handleAddFiles([file])}
                  onAnalyze={() => {
                    handleTriggerActiveScan();
                    setActiveSection('cockpit');
                  }}
                  processingStage={processingStage}
                  error={error}
                />
              </div>

              {/* Right Column: Mission Statistics & Processing Status */}
              <div className="lg:col-span-5 space-y-4">
                <MissionStatistics statistics={result ? result.statistics : null} />

                {processingStage !== 'idle' || isBatchRunning ? (
                  <ProcessingStatus
                    stage={processingStage}
                    error={error}
                    batchProgress={batchProgress}
                    isBatchRunning={isBatchRunning}
                  />
                ) : (
                  <div className="bg-[#FEFEFE] dark:bg-[#0A1120] border border-[#EBF2F7] dark:border-[#114AB1]/40 rounded-lg p-4 font-sans text-xs shadow-sm">
                    <div className="flex items-center gap-2 text-[#114AB1] dark:text-[#FEFEFE] font-tech font-bold uppercase tracking-wider mb-1">
                      <Activity className="w-4 h-4 text-[#114AB1] dark:text-[#6793AC]" />
                      <span>HYDROGRAPHIC PIPELINE STANDBY</span>
                    </div>
                    <p className="text-[11px] text-[#6793AC] leading-relaxed">
                      Select any queued transect and click "Analyze Single" or "Batch Scan All" to run automated YOLOv8 object detection on your sonar imagery.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 3: SURVEY ANALYTICS & THREAT INTEL ================= */}
        {activeSection === 'analytics' && (
          <div className="h-full w-full p-4 sm:p-6 overflow-y-auto max-w-[1500px] mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EBF2F7] dark:border-[#114AB1]/40">
              <div>
                <h2 className="text-base sm:text-lg font-tech font-bold uppercase tracking-wider text-[#114AB1] dark:text-[#FEFEFE] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#114AB1] dark:text-[#6793AC]" />
                  <span>SURVEY TELEMETRY & DEBRIS CLASSIFICATION ANALYTICS</span>
                </h2>
                <p className="text-xs text-[#6793AC] mt-0.5">
                  Aggregate anomaly counts, confidence distribution histogram, and marine ecological hazard breakdown.
                </p>
              </div>

              {result && (
                <button
                  onClick={() => setIsThreatModalOpen(true)}
                  className="px-4 py-2 rounded-md bg-[#E4580B] hover:bg-[#E4580B]/90 text-[#FEFEFE] font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch AI Threat Intel</span>
                </button>
              )}
            </div>

            <DashboardAnalytics
              currentResult={result}
              history={historyRecords}
              onSelectScan={(record) => {
                handleSelectHistoryScan(record);
                setActiveSection('cockpit');
              }}
            />
          </div>
        )}

        {/* ================= SECTION 4: MISSION HISTORY ARCHIVE ================= */}
        {activeSection === 'history' && (
          <div className="h-full w-full overflow-hidden">
            <MissionHistorySection
              history={historyRecords}
              onSelectScan={(record) => {
                handleSelectHistoryScan(record);
                setActiveSection('cockpit');
              }}
              onHistoryUpdate={setHistoryRecords}
              currentResultId={result?.result_id}
              onOpenCockpit={() => setActiveSection('cockpit')}
            />
          </div>
        )}
      </main>

      {/* ================= SYSTEM MODALS & DRAWERS ================= */}
      {/* Architecture Spec Modal */}
      <ArchitectureInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

      {/* AI Threat & Ecological Assessment Modal */}
      <AIThreatAssessmentModal
        isOpen={isThreatModalOpen}
        onClose={() => setIsThreatModalOpen(false)}
        result={result}
      />

      {/* AI Target Deep-Dive Diagnostics Modal */}
      <AITargetDiagnosticsModal
        target={diagnosticsTarget}
        scanMetadata={result?.metadata}
        isOpen={!!diagnosticsTarget}
        onClose={() => setDiagnosticsTarget(null)}
      />

      {/* AQUAVISION AI Hydrographic Co-Pilot Chat Drawer */}
      <AICoPilotChatDrawer
        isOpen={isCoPilotOpen}
        onClose={() => {
          setIsCoPilotOpen(false);
          setCoPilotInitialPrompt('');
        }}
        result={result}
        selectedDetection={activeTargetItem}
        initialPrompt={coPilotInitialPrompt}
      />

      {/* False Positive Feedback Modal */}
      <FalsePositiveModal
        isOpen={!!falsePositiveTarget}
        onClose={() => setFalsePositiveTarget(null)}
        target={falsePositiveTarget}
        onConfirm={handleConfirmFalsePositive}
      />
    </div>
  );
}
