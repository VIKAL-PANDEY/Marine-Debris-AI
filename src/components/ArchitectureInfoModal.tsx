import React, { useState } from 'react';
import { X, Cpu, Layers, ShieldCheck, Code, Zap, Database, Server, Map, FileCode, CheckCircle2, Terminal } from 'lucide-react';

interface ArchitectureInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'stack' | 'backend' | 'yolo' | 'docker';

export const ArchitectureInfoModal: React.FC<ArchitectureInfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('stack');

  if (!isOpen) return null;

  const TECH_STACK_DATA = [
    {
      layer: 'Frontend',
      technology: 'React + TypeScript + Tailwind CSS',
      purpose: 'Responsive dashboard, upload, tables and UI.',
      status: 'Active',
      icon: Cpu,
    },
    {
      layer: 'Mapping',
      technology: 'Leaflet + GeoJSON (or MapLibre GL JS)',
      purpose: 'Interactive map and spatial overlays.',
      status: 'Active',
      icon: Map,
    },
    {
      layer: 'Backend',
      technology: 'FastAPI + Python',
      purpose: 'REST API, uploads, inference orchestration and reports.',
      status: 'Implemented (/backend)',
      icon: Server,
    },
    {
      layer: 'AI/ML',
      technology: 'PyTorch + Ultralytics YOLO',
      purpose: 'Training/inference for detection or segmentation.',
      status: 'Active & ONNX Ready',
      icon: Zap,
    },
    {
      layer: 'Image processing',
      technology: 'OpenCV + NumPy',
      purpose: 'Preprocessing, tiling and post-processing.',
      status: 'Integrated',
      icon: Layers,
    },
    {
      layer: 'Geospatial',
      technology: 'GeoPandas + Shapely + pyproj',
      purpose: 'Coordinate and spatial operations.',
      status: 'Integrated',
      icon: Map,
    },
    {
      layer: 'Database',
      technology: 'PostgreSQL + PostGIS',
      purpose: 'Detections, metadata and spatial queries.',
      status: 'Schema & Dockerized',
      icon: Database,
    },
    {
      layer: 'Data exchange',
      technology: 'JSON + CSV + GeoJSON',
      purpose: 'API, reports and map-ready output.',
      status: 'Full Support',
      icon: FileCode,
    },
    {
      layer: 'Optimization',
      technology: 'ONNX Runtime + TensorRT',
      purpose: 'Inference optimization on supported hardware.',
      status: 'WASM & GPU Ready',
      icon: Zap,
    },
    {
      layer: 'Deployment',
      technology: 'Docker',
      purpose: 'Reproducible packaging.',
      status: 'Compose & Dockerfile',
      icon: Server,
    },
    {
      layer: 'Version control',
      technology: 'Git + GitHub',
      purpose: 'Collaboration and source control.',
      status: 'Configured',
      icon: Terminal,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A111E]/80 backdrop-blur-sm">
      <div className="bg-[#0F1A2C] border border-[#93A8BC]/25 rounded max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#FFFFFF]">
        {/* Modal Header */}
        <div className="p-3.5 border-b border-[#93A8BC]/25 bg-[#142238] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#1BDFC8]/15 border border-[#1BDFC8]/40 flex items-center justify-center text-[#1BDFC8]">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-tech font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
                <span>HEIMDALL</span>
                <span className="text-[#93A8BC] font-normal">|</span>
                <span className="text-[#1BDFC8]">SIH26057</span>
                <span className="text-[#93A8BC] font-normal">|</span>
                <span className="text-[#2E96DB]">AllSpark</span>
              </h3>
              <div className="text-[10px] text-[#93A8BC] font-sans">
                Project Technology Stack & Architecture Specification
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#93A8BC] hover:text-[#FFFFFF] hover:bg-[#0B1320] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#93A8BC]/20 bg-[#0B1320] px-4 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('stack')}
            className={`px-3 py-1.5 border-b-2 font-tech font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stack'
                ? 'border-[#1BDFC8] text-[#1BDFC8] bg-[#142238]/60 rounded-t'
                : 'border-transparent text-[#93A8BC] hover:text-[#FFFFFF]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Technology Stack Table</span>
          </button>

          <button
            onClick={() => setActiveTab('backend')}
            className={`px-3 py-1.5 border-b-2 font-tech font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backend'
                ? 'border-[#1BDFC8] text-[#1BDFC8] bg-[#142238]/60 rounded-t'
                : 'border-transparent text-[#93A8BC] hover:text-[#FFFFFF]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>FastAPI + PostGIS</span>
          </button>

          <button
            onClick={() => setActiveTab('yolo')}
            className={`px-3 py-1.5 border-b-2 font-tech font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'yolo'
                ? 'border-[#1BDFC8] text-[#1BDFC8] bg-[#142238]/60 rounded-t'
                : 'border-transparent text-[#93A8BC] hover:text-[#FFFFFF]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>PyTorch YOLO & ONNX</span>
          </button>

          <button
            onClick={() => setActiveTab('docker')}
            className={`px-3 py-1.5 border-b-2 font-tech font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'docker'
                ? 'border-[#1BDFC8] text-[#1BDFC8] bg-[#142238]/60 rounded-t'
                : 'border-transparent text-[#93A8BC] hover:text-[#FFFFFF]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Docker Deployment</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#FFFFFF]">
          {/* TAB 1: Technology Stack Table */}
          {activeTab === 'stack' && (
            <div className="space-y-4">
              <div className="border border-[#93A8BC]/25 rounded overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#142238] border-b border-[#93A8BC]/25 text-[#1BDFC8] font-tech text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 border-r border-[#93A8BC]/20">Layer</th>
                      <th className="py-2.5 px-3 border-r border-[#93A8BC]/20">Technology</th>
                      <th className="py-2.5 px-3">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#93A8BC]/15 font-sans text-xs">
                    {TECH_STACK_DATA.map((row) => {
                      const Icon = row.icon;
                      return (
                        <tr key={row.layer} className="hover:bg-[#142238]/50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[#FFFFFF] border-r border-[#93A8BC]/15 whitespace-nowrap flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-[#1BDFC8]" />
                            <span>{row.layer}</span>
                          </td>
                          <td className="py-2.5 px-3 font-tech text-[#1BDFC8] border-r border-[#93A8BC]/15 font-bold">
                            {row.technology}
                          </td>
                          <td className="py-2.5 px-3 text-[#93A8BC]">
                            {row.purpose}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-center text-[11px] font-tech text-[#93A8BC] tracking-widest uppercase pt-1">
                HEIMDALL | SIH26057 | <span className="text-[#1BDFC8]">AllSpark</span>
              </div>
            </div>
          )}

          {/* TAB 2: FastAPI + PostGIS */}
          {activeTab === 'backend' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded bg-[#142238] border border-[#93A8BC]/25 text-[#FFFFFF]">
                <div className="flex items-center gap-2 font-tech font-bold uppercase tracking-wider mb-1 text-[#1BDFC8]">
                  <Server className="w-4 h-4" />
                  <span>FASTAPI + PYTHON BACKEND ARCHITECTURE</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#93A8BC] font-sans">
                  The Python FastAPI core resides in <code className="text-[#1BDFC8] font-tech font-bold">/backend</code> with modules for
                  OpenCV backscatter enhancement, PyTorch Ultralytics YOLO object detection, GeoPandas & Shapely geodetic mapping, and PostGIS spatial storage.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-[#142238] border border-[#93A8BC]/25 rounded space-y-2 text-[11px]">
                  <span className="text-[#1BDFC8] font-tech font-bold uppercase">FASTAPI REST ENDPOINTS:</span>
                  <ul className="space-y-1 text-[#93A8BC] font-tech">
                    <li><span className="text-[#FFFFFF]">GET /api/health</span> - Health & stack status</li>
                    <li><span className="text-[#FFFFFF]">POST /api/analyze</span> - Sonar image ingestion</li>
                    <li><span className="text-[#FFFFFF]">GET /api/results/&#123;id&#125;</span> - Detection payloads</li>
                    <li><span className="text-[#FFFFFF]">GET /api/results/&#123;id&#125;/geojson</span> - RFC 7946 GeoJSON</li>
                    <li><span className="text-[#FFFFFF]">GET /api/results/&#123;id&#125;/csv</span> - Survey CSV</li>
                    <li><span className="text-[#FFFFFF]">POST /api/spatial/query</span> - PostGIS ST_DWithin</li>
                  </ul>
                </div>

                <div className="p-3 bg-[#142238] border border-[#93A8BC]/25 rounded space-y-2 text-[11px]">
                  <span className="text-[#2E96DB] font-tech font-bold uppercase">POSTGRESQL + POSTGIS SCHEMA:</span>
                  <ul className="space-y-1 text-[#93A8BC] font-tech">
                    <li><span className="text-[#FFFFFF]">survey_missions</span> (trackline_geom LINESTRING)</li>
                    <li><span className="text-[#FFFFFF]">debris_detections</span> (point_geom POINT, polygon_geom POLYGON)</li>
                    <li><span className="text-[#FFFFFF]">ST_DWithin</span> (range queries around towfish)</li>
                    <li><span className="text-[#FFFFFF]">SRID 4326</span> (WGS84 global geodetic standard)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PyTorch YOLO & ONNX */}
          {activeTab === 'yolo' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded bg-[#142238] border border-[#93A8BC]/25 text-[#FFFFFF]">
                <div className="flex items-center gap-2 font-tech font-bold uppercase tracking-wider mb-1 text-[#1BDFC8]">
                  <Zap className="w-4 h-4" />
                  <span>PYTORCH ULTRALYTICS YOLO & ONNX RUNTIME INFERENCE</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#93A8BC] font-sans">
                  The HeimDall pipeline accepts custom-trained YOLO weights (<code className="text-[#1BDFC8] font-tech">.pt</code> or <code className="text-[#1BDFC8] font-tech">.onnx</code>).
                  Images are preprocessed with OpenCV CLAHE backscatter equalization, sliced into 640×640 overlapping tiles, and decoded with IoU NMS.
                </p>
              </div>

              <div className="p-3 bg-[#0B1320] border border-[#93A8BC]/25 rounded font-tech text-[11px] text-[#1BDFC8] overflow-x-auto">
                <pre className="text-[#93A8BC] font-bold">
{`# 1. Export trained model from Ultralytics YOLO CLI:
yolo export model=marine_debris_best.pt format=onnx imgsz=640 opset=12

# 2. Or export directly via Python:
from ultralytics import YOLO
model = YOLO('marine_debris_best.pt')
model.export(format='onnx', imgsz=640, opset=12)

# 3. Target model locations:
# Python FastAPI backend: backend/models/marine_debris_best.pt
# In-browser WASM engine: public/models/marine-debris.onnx`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: Docker */}
          {activeTab === 'docker' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded bg-[#142238] border border-[#93A8BC]/25 text-[#FFFFFF]">
                <div className="flex items-center gap-2 font-tech font-bold uppercase tracking-wider mb-1 text-[#1BDFC8]">
                  <Terminal className="w-4 h-4" />
                  <span>REPRODUCIBLE MULTI-CONTAINER DOCKER DEPLOYMENT</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#93A8BC] font-sans">
                  The project includes ready-to-deploy <code className="text-[#1BDFC8] font-tech">Dockerfile</code> and <code className="text-[#1BDFC8] font-tech">docker-compose.yml</code> files
                  linking PostgreSQL 15 with PostGIS, the Python FastAPI backend, and the React + Vite dashboard.
                </p>
              </div>

              <div className="p-3 bg-[#0B1320] border border-[#93A8BC]/25 rounded font-tech text-[11px] text-[#1BDFC8] overflow-x-auto">
                <pre className="text-[#93A8BC] font-bold">
{`# Launch entire HeimDall stack with Docker Compose:
docker-compose up --build -d

# Services instantiated:
# 1. db: postgis/postgis:15-3.3 on port 5432
# 2. backend: FastAPI Python server on port 8000
# 3. frontend: React + TypeScript + Tailwind on port 3000`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#142238] border-t border-[#93A8BC]/25 flex items-center justify-between">
          <div className="text-[10px] text-[#93A8BC] font-tech uppercase">
            HEIMDALL • SIH26057 | AllSpark • Smart India Hackathon
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#1BDFC8] hover:bg-[#1BDFC8]/90 text-[#0A111E] font-sans font-bold uppercase tracking-wider transition cursor-pointer text-xs"
          >
            CLOSE MATRIX
          </button>
        </div>
      </div>
    </div>
  );
};
