import React, { useRef, useState, useEffect } from 'react';
import {
  Upload,
  FileImage,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Sliders,
  Info,
  Layers,
  Play,
  Trash2,
  X,
  Eye,
  StopCircle,
  Plus,
  RefreshCw,
  ListOrdered,
  Clock,
} from 'lucide-react';
import { ProcessingStage, QueuedSonarFile, BatchProgress } from '../types/detection';
import { checkModelAvailability, MODEL_CONFIG } from '../services/yoloInference';

interface UploadPanelProps {
  // Legacy / fallback props
  selectedFile?: File | null;
  onFileSelect?: (file: File) => void;
  onAnalyze?: (engineMode: 'yolo' | 'server', confThreshold: number) => void;

  // Multi-file queue props
  filesQueue: QueuedSonarFile[];
  activeFileId: string | null;
  onAddFiles: (files: File[]) => void;
  onSelectQueuedFile: (fileId: string) => void;
  onRemoveQueuedFile: (fileId: string) => void;
  onClearQueue: () => void;
  onAnalyzeSingle: (fileId: string, engineMode: 'yolo' | 'server', confThreshold: number) => void;
  onAnalyzeBatch: (engineMode: 'yolo' | 'server', confThreshold: number) => void;
  onCancelBatch?: () => void;
  isBatchRunning?: boolean;
  batchProgress?: BatchProgress | null;

  processingStage: ProcessingStage;
  error: string | null;
}

const SAMPLE_IMAGES = [
  {
    id: 'ghost_net',
    name: 'Sector 4: Ghost Net',
    fileUrl: '/samples/sample_ghost_net.png',
    filename: 'sonar_transect_sector4_ghostnet.png',
    desc: 'Synthetic net mesh backscatter with acoustic shadow',
  },
  {
    id: 'metal_debris',
    name: 'Sector 7: Metal Debris',
    fileUrl: '/samples/sample_metal_debris.png',
    filename: 'sonar_transect_sector7_metal_debris.png',
    desc: 'Specular acoustic return with boundary shadow',
  },
  {
    id: 'trawl_gear',
    name: 'Sector 9: Derelict Trap',
    fileUrl: '/samples/sample_trawl_gear.png',
    filename: 'sonar_transect_sector9_derelict_trap.png',
    desc: 'Cluster of acoustic targets near shelf',
  },
];

export const UploadPanel: React.FC<UploadPanelProps> = ({
  selectedFile,
  onFileSelect,
  onAnalyze,
  filesQueue,
  activeFileId,
  onAddFiles,
  onSelectQueuedFile,
  onRemoveQueuedFile,
  onClearQueue,
  onAnalyzeSingle,
  onAnalyzeBatch,
  onCancelBatch,
  isBatchRunning = false,
  batchProgress = null,
  processingStage,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const [loadingAllPresets, setLoadingAllPresets] = useState(false);
  const [engineMode, setEngineMode] = useState<'yolo' | 'server'>('yolo');
  const [confThreshold, setConfThreshold] = useState<number>(MODEL_CONFIG.confidenceThreshold);
  const [isModelAvailable, setIsModelAvailable] = useState<boolean | null>(null);
  const [modelFileSize, setModelFileSize] = useState<number | null>(null);

  const isBusy =
    isBatchRunning ||
    (processingStage !== 'idle' && processingStage !== 'completed' && processingStage !== 'error');

  // Check ONNX model availability on mount
  useEffect(() => {
    let isMounted = true;
    const verifyModel = async () => {
      try {
        const res = await checkModelAvailability();
        if (isMounted) {
          setIsModelAvailable(res.available);
          if (res.sizeBytes) setModelFileSize(res.sizeBytes);
        }
      } catch {
        if (isMounted) setIsModelAvailable(false);
      }
    };
    verifyModel();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      validateAndAddFiles(filesArray);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      validateAndAddFiles(filesArray);
    }
  };

  const validateAndAddFiles = (files: File[]) => {
    const validExtensions = ['.png', '.jpg', '.jpeg', '.tif', '.tiff'];
    const validFiles: File[] = [];
    const invalidNames: string[] = [];

    files.forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (validExtensions.includes(ext)) {
        validFiles.push(file);
      } else {
        invalidNames.push(file.name);
      }
    });

    if (invalidNames.length > 0) {
      alert(
        `Ignored ${invalidNames.length} invalid file(s): ${invalidNames.join(
          ', '
        )}. Supported formats: PNG, JPG, JPEG, TIFF.`
      );
    }

    if (validFiles.length > 0) {
      onAddFiles(validFiles);
    }
  };

  const loadSample = async (sample: (typeof SAMPLE_IMAGES)[0]) => {
    try {
      setLoadingSample(sample.id);
      const res = await fetch(sample.fileUrl);
      const blob = await res.blob();
      const file = new File([blob], sample.filename, { type: 'image/png' });
      onAddFiles([file]);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    } finally {
      setLoadingSample(null);
    }
  };

  const loadAllPresets = async () => {
    try {
      setLoadingAllPresets(true);
      const fetchedFiles: File[] = [];
      for (const sample of SAMPLE_IMAGES) {
        const res = await fetch(sample.fileUrl);
        const blob = await res.blob();
        const file = new File([blob], sample.filename, { type: 'image/png' });
        fetchedFiles.push(file);
      }
      onAddFiles(fetchedFiles);
    } catch (err) {
      console.error('Failed to load all sample presets:', err);
    } finally {
      setLoadingAllPresets(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const pendingCount = filesQueue.filter((f) => f.status === 'queued').length;
  const completedCount = filesQueue.filter((f) => f.status === 'completed').length;
  const activeFile = filesQueue.find((f) => f.id === activeFileId);

  return (
    <div className="bg-[#FEFEFE] border border-[#EBF2F7] rounded p-4 flex flex-col gap-3.5 shadow-sm font-sans">
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-tech font-bold uppercase tracking-widest text-[#114AB1] flex items-center gap-1.5">
          <FileImage className="w-3.5 h-3.5 text-[#114AB1]" />
          <span>ACOUSTIC DATA ACQUISITION & YOLO INFERENCE</span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-tech text-[#114AB1] font-bold bg-[#6793AC] px-2 py-0.5 rounded border border-[#114AB1]/20 uppercase tracking-wider">
            MULTI-TRANSECT QUEUE
          </span>
        </div>
      </div>

      {/* Engine Selection & Model Status */}
      <div className="bg-[#EBF2F7] border border-[#6793AC] rounded p-2.5 flex flex-col gap-2 font-sans text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#114AB1]" />
            <span className="text-[11px] font-tech font-bold uppercase tracking-wider text-[#114AB1]">INFERENCE ENGINE:</span>
          </div>

          <div className="flex items-center gap-1 bg-[#FEFEFE] p-0.5 rounded border border-[#6793AC]">
            <button
              id="btn-engine-yolo"
              type="button"
              onClick={() => setEngineMode('yolo')}
              className={`px-2.5 py-1 rounded text-[10px] font-sans font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                engineMode === 'yolo'
                  ? 'bg-[#114AB1] text-[#FEFEFE] shadow-sm'
                  : 'text-[#114AB1]/70 hover:text-[#114AB1]'
              }`}
            >
              <span>YOLO ONNX (Browser WASM)</span>
            </button>
            <button
              id="btn-engine-server"
              type="button"
              onClick={() => setEngineMode('server')}
              className={`px-2.5 py-1 rounded text-[10px] font-sans font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                engineMode === 'server'
                  ? 'bg-[#114AB1] text-[#FEFEFE] shadow-sm'
                  : 'text-[#114AB1]/70 hover:text-[#114AB1]'
              }`}
            >
              <span>Acoustic Server</span>
            </button>
          </div>
        </div>

        {/* Model File Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-1 border-t border-[#6793AC] text-[#114AB1]/80 font-normal">
          <div className="flex items-center gap-1.5">
            <span className="text-[#114AB1]/80 font-medium">ONNX Model:</span>
            <code className="text-[#114AB1] font-tech font-semibold bg-[#FEFEFE] px-1.5 py-0.5 rounded border border-[#6793AC]">
              /models/marine-debris.onnx
            </code>
            <span className="text-[#114AB1]/80 font-tech tabular-nums">
              ({MODEL_CONFIG.inputWidth}×{MODEL_CONFIG.inputHeight})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isModelAvailable === true ? (
              <span className="text-[#114AB1] flex items-center gap-1 font-sans font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6793AC] border border-[#114AB1] animate-pulse" />
                <span className="font-tech tabular-nums">ONNX Ready {modelFileSize ? `(${formatFileSize(modelFileSize)})` : ''}</span>
              </span>
            ) : isModelAvailable === false ? (
              <span className="text-[#E4580B] flex items-center gap-1 font-sans font-semibold">
                <Info className="w-3 h-3 text-[#E4580B]" />
                <span>Place file in /public/models/</span>
              </span>
            ) : (
              <span className="text-[#114AB1]/70 font-sans font-medium">Checking model...</span>
            )}
          </div>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#6793AC] text-[10px]">
          <div className="flex items-center gap-1.5 text-[#114AB1]">
            <Sliders className="w-3 h-3 text-[#114AB1]" />
            <span className="font-sans font-medium">Confidence Threshold:</span>
            <span className="text-[#114AB1] font-tech tabular-nums font-bold">{(confThreshold * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.10"
            max="0.90"
            step="0.05"
            value={confThreshold}
            onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
            className="w-28 sm:w-36 h-1.5 bg-[#FEFEFE] rounded-lg appearance-none cursor-pointer accent-[#114AB1]"
          />
        </div>
      </div>

      {/* Multi-File Drag and Drop Ingestion Zone */}
      <div
        id="sonar-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded p-3 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
          isDragging
            ? 'border-[#114AB1] bg-[#EBF2F7] shadow-sm'
            : filesQueue.length > 0
            ? 'border-[#6793AC] hover:border-[#114AB1] bg-[#EBF2F7]'
            : 'border-[#6793AC] hover:border-[#114AB1] bg-[#EBF2F7] py-6'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.tif,.tiff"
          onChange={handleFileChange}
          className="hidden"
          disabled={isBatchRunning}
        />

        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-[#114AB1] animate-bounce" />
          <span className="text-xs font-sans font-semibold text-[#114AB1]">
            {filesQueue.length > 0
              ? 'Drop additional sonar waterfall images here'
              : 'Drop side-scan sonar waterfall or acoustic imagery here'}
          </span>
        </div>

        <p className="text-[10px] text-[#114AB1]/70 font-sans font-normal">
          Multi-file selection supported • PNG, JPG, JPEG, TIFF
        </p>

        <button
          type="button"
          className="mt-0.5 bg-[#FEFEFE] hover:bg-[#6793AC] text-[#114AB1] border border-[#114AB1]/30 px-3 py-1 rounded text-[10px] font-sans font-bold uppercase tracking-wider transition-colors"
        >
          {filesQueue.length > 0 ? '+ Add More Sonar Files' : 'Browse & Select Files (Multi-Select)'}
        </button>
      </div>

      {/* Preset Demo Samples Row */}
      <div className="flex flex-col gap-1.5 pt-0.5">
        <div className="flex items-center justify-between text-[10px] font-tech text-[#114AB1]/80 uppercase tracking-wider font-bold">
          <span>Survey Transect Presets:</span>
          <button
            type="button"
            onClick={loadAllPresets}
            disabled={isBusy || loadingAllPresets}
            className="text-[10px] text-[#114AB1] hover:text-[#E4580B] flex items-center gap-1 font-sans font-semibold cursor-pointer disabled:opacity-50"
            title="Queue all 3 sample transect files for sequential analysis"
          >
            {loadingAllPresets ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            <span>Queue All 3 Presets</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {SAMPLE_IMAGES.map((sample) => {
            const isQueued = filesQueue.some((f) => f.file.name === sample.filename);
            return (
              <button
                key={sample.id}
                id={`preset-${sample.id}`}
                onClick={() => loadSample(sample)}
                disabled={isBusy}
                className={`p-2 rounded border text-left text-xs transition cursor-pointer flex flex-col justify-between gap-0.5 ${
                  isQueued
                    ? 'border-[#114AB1] bg-[#6793AC] text-[#114AB1] shadow-sm font-bold'
                    : 'border-[#6793AC] bg-[#EBF2F7] hover:bg-[#6793AC]/50 hover:border-[#114AB1] text-[#114AB1]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold font-tech text-[10px] truncate text-[#114AB1]">
                    {sample.name}
                  </span>
                  {loadingSample === sample.id ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E4580B] animate-ping" />
                  ) : isQueued ? (
                    <span className="text-[8px] font-tech font-bold px-1 py-0.2 rounded bg-[#114AB1] text-[#FEFEFE] uppercase tracking-wider">
                      QUEUED
                    </span>
                  ) : null}
                </div>
                <p className="text-[9px] text-[#114AB1]/70 line-clamp-1 font-sans font-normal leading-tight">
                  {sample.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Queued Sonar Files List & Sequential Batch Controller */}
      {filesQueue.length > 0 && (
        <div className="bg-[#EBF2F7] border border-[#6793AC] rounded p-2.5 flex flex-col gap-2 font-sans">
          {/* Queue Header & Stats */}
          <div className="flex items-center justify-between border-b border-[#6793AC] pb-1.5">
            <div className="flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5 text-[#114AB1]" />
              <span className="text-xs font-tech font-bold uppercase tracking-wider text-[#114AB1]">
                QUEUED TRANSECTS ({filesQueue.length})
              </span>
              <span className="text-[10px] text-[#114AB1]/70 font-tech tabular-nums font-medium">
                • {completedCount}/{filesQueue.length} Analyzed
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onClearQueue}
                disabled={isBatchRunning}
                className="text-[10px] text-[#114AB1]/70 hover:text-[#E4580B] transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#6793AC] hover:border-[#E4580B] cursor-pointer disabled:opacity-50 font-sans font-semibold"
                title="Clear all queued transect images"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Active Batch Progress Banner if running */}
          {isBatchRunning && batchProgress && (
            <div className="p-2 bg-[#FEFEFE] border border-[#6793AC] rounded text-xs flex flex-col gap-1.5 font-sans">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#114AB1] font-tech font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#E4580B] animate-ping" />
                  <span className="tabular-nums">
                    SEQUENTIAL ANALYSIS: SCAN {batchProgress.current} OF {batchProgress.total}
                  </span>
                </div>
                {onCancelBatch && (
                  <button
                    type="button"
                    onClick={onCancelBatch}
                    className="px-2 py-0.5 rounded bg-[#E4580B] hover:bg-[#6793AC] text-[#FEFEFE] border border-[#E4580B] text-[10px] font-sans font-bold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                  >
                    <StopCircle className="w-3 h-3" />
                    <span>Stop Queue</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[#114AB1] truncate font-sans font-medium">
                Processing: <span className="font-tech font-bold">{batchProgress.currentFilename}</span>
              </p>
              <div className="w-full h-1.5 bg-[#EBF2F7] rounded-full overflow-hidden border border-[#6793AC]">
                <div
                  className="h-full bg-gradient-to-r from-[#6793AC] via-[#E4580B] to-[#6793AC] transition-all duration-300"
                  style={{
                    width: `${Math.max(
                      8,
                      ((batchProgress.current - 0.5) / batchProgress.total) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Queued Items Scrollable List */}
          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 text-xs font-sans">
            {filesQueue.map((item, index) => {
              const isActive = item.id === activeFileId;
              const isItemAnalyzing = item.status === 'analyzing';
              const isItemCompleted = item.status === 'completed';
              const isItemError = item.status === 'error';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectQueuedFile(item.id)}
                  className={`p-2 rounded border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                    isActive
                      ? 'border-[#114AB1] bg-[#FEFEFE] shadow-sm ring-1 ring-[#114AB1]'
                      : 'border-[#6793AC] bg-[#FEFEFE]/70 hover:bg-[#FEFEFE] hover:border-[#114AB1]'
                  }`}
                >
                  {/* Left: Thumbnail & Index */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[10px] text-[#114AB1]/70 font-tech tabular-nums w-4 shrink-0 text-center font-bold">
                      #{index + 1}
                    </span>

                    {/* Image Thumbnail */}
                    <div className="w-8 h-8 rounded border border-[#6793AC] bg-[#FEFEFE] overflow-hidden shrink-0 flex items-center justify-center">
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt="Sonar thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileImage className="w-4 h-4 text-[#114AB1]/40" />
                      )}
                    </div>

                    {/* File Meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`font-semibold truncate text-[11px] font-tech ${
                            isActive ? 'text-[#114AB1] font-bold' : 'text-[#114AB1]'
                          }`}
                          title={item.file.name}
                        >
                          {item.file.name}
                        </p>
                        {isActive && (
                          <span className="text-[8px] bg-[#114AB1] text-[#FEFEFE] px-1 rounded font-bold font-tech uppercase tracking-wider shrink-0">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-[#114AB1]/70 font-tech tabular-nums">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status Pill & Actions */}
                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Status Pill */}
                    {isItemAnalyzing ? (
                      <span className="text-[9px] font-tech font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#6793AC] text-[#114AB1] border border-[#E4580B] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E4580B] animate-ping" />
                        <span>ANALYZING</span>
                      </span>
                    ) : isItemCompleted ? (
                      <span className="text-[9px] font-tech font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#6793AC] text-[#114AB1] border border-[#114AB1]/30 flex items-center gap-1 tabular-nums">
                        <CheckCircle2 className="w-3 h-3 text-[#114AB1]" />
                        <span>
                          {item.detectionCount !== undefined
                            ? `${item.detectionCount} DETECTIONS`
                            : 'COMPLETED'}
                        </span>
                      </span>
                    ) : isItemError ? (
                      <span
                        className="text-[9px] font-tech font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E4580B] text-[#FEFEFE] border border-[#E4580B] flex items-center gap-1"
                        title={item.error || 'Inference error'}
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span>FAILED</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-tech font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FEFEFE] text-[#114AB1]/70 border border-[#6793AC] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>QUEUED</span>
                      </span>
                    )}

                    {/* View Button */}
                    <button
                      type="button"
                      onClick={() => onSelectQueuedFile(item.id)}
                      className={`p-1 rounded transition text-[10px] cursor-pointer ${
                        isActive
                          ? 'text-[#114AB1] bg-[#6793AC]'
                          : 'text-[#114AB1]/70 hover:text-[#114AB1] hover:bg-[#6793AC]'
                      }`}
                      title="View this sonar scan in dashboard"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Individual Run Button */}
                    <button
                      type="button"
                      disabled={isBatchRunning || isItemAnalyzing}
                      onClick={() => onAnalyzeSingle(item.id, engineMode, confThreshold)}
                      className="p-1 rounded text-[#114AB1]/70 hover:text-[#114AB1] hover:bg-[#6793AC] transition cursor-pointer disabled:opacity-40"
                      title={
                        isItemCompleted
                          ? 'Re-analyze this scan individually'
                          : 'Analyze this scan individually'
                      }
                    >
                      {isItemCompleted ? (
                        <RefreshCw className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Remove from Queue Button */}
                    <button
                      type="button"
                      disabled={isBatchRunning || isItemAnalyzing}
                      onClick={() => onRemoveQueuedFile(item.id)}
                      className="p-1 rounded text-[#114AB1]/60 hover:text-[#E4580B] hover:bg-[#E4580B]/20 transition cursor-pointer disabled:opacity-40"
                      title="Remove from queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-2.5 rounded bg-[#EBF2F7] border border-[#E4580B] flex flex-col gap-1.5 text-xs text-[#E4580B] font-sans">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E4580B]" />
            <div className="flex-1 font-sans text-[11px]">
              <span className="font-tech font-bold uppercase tracking-wider">INFERENCE ERROR: </span>
              <span>{error}</span>
            </div>
          </div>
          {error.includes('marine-debris.onnx') && (
            <div className="pl-6 text-[10px] font-sans text-[#114AB1]">
              <p className="font-semibold text-[#E4580B]">How to fix:</p>
              <p>
                Place your exported YOLO ONNX weights at{' '}
                <code className="text-[#114AB1] font-tech font-bold bg-[#FEFEFE] px-1 py-0.5 rounded border border-[#6793AC]">public/models/marine-debris.onnx</code>
              </p>
              <button
                type="button"
                onClick={() => {
                  setEngineMode('server');
                  if (activeFileId) {
                    onAnalyzeSingle(activeFileId, 'server', confThreshold);
                  } else if (onAnalyze) {
                    onAnalyze('server', confThreshold);
                  }
                }}
                className="mt-1 text-[10px] text-[#E4580B] underline hover:text-[#114AB1] cursor-pointer font-sans font-semibold"
              >
                Or switch to the Server Acoustic Pipeline now →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Action Bar: Sequential Analysis & Single Analysis */}
      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 font-sans">
        {/* Primary Sequential Batch Analysis Button */}
        <button
          id="btn-analyze-batch"
          type="button"
          onClick={() => onAnalyzeBatch(engineMode, confThreshold)}
          disabled={filesQueue.length === 0 || isBatchRunning}
          className={`flex-1 w-full py-2.5 px-3 rounded text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            filesQueue.length === 0 || isBatchRunning
              ? 'bg-[#EBF2F7] text-[#114AB1]/40 border border-[#EBF2F7] cursor-not-allowed'
              : 'bg-[#E4580B] hover:bg-[#6793AC] text-[#FEFEFE] border border-[#E4580B] shadow-sm font-bold'
          }`}
        >
          {isBatchRunning ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-[#FEFEFE] border-t-transparent rounded-full animate-spin" />
              <span className="tabular-nums">
                SEQUENTIAL BATCH IN PROGRESS ({batchProgress?.current || 1}/{batchProgress?.total || filesQueue.length})...
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span className="tabular-nums">
                {pendingCount > 0
                  ? `RUN SEQUENTIAL ANALYSIS (${pendingCount} PENDING)`
                  : filesQueue.length > 0
                  ? `RE-ANALYZE QUEUE (${filesQueue.length} TRANSECTS)`
                  : 'QUEUE TRANSECTS TO ANALYZE'}
              </span>
            </>
          )}
        </button>

        {/* Analyze Active Scan Button */}
        {filesQueue.length > 0 && (
          <button
            id="btn-analyze-active"
            type="button"
            disabled={!activeFileId || isBatchRunning || isBusy}
            onClick={() => {
              if (activeFileId) {
                onAnalyzeSingle(activeFileId, engineMode, confThreshold);
              }
            }}
            className={`w-full sm:w-auto py-2.5 px-3 rounded text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
              !activeFileId || isBatchRunning || isBusy
                ? 'bg-[#EBF2F7] text-[#114AB1]/40 border-[#EBF2F7] cursor-not-allowed'
                : 'bg-[#EBF2F7] hover:bg-[#6793AC] text-[#114AB1] border-[#6793AC] font-bold'
            }`}
            title="Analyze only the currently active selected scan"
          >
            <Play className="w-3 h-3 text-[#114AB1]" />
            <span>ANALYZE ACTIVE SCAN</span>
          </button>
        )}
      </div>
    </div>
  );
};
