import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { processSonarImage, getCachedResult } from './server/sonarProcessor';
import { exportToJsonString, exportToCsvString } from './server/reporting';
import {
  generateScanThreatAssessment,
  generateTargetDiagnostics,
  chatWithHydrographicAI,
} from './server/aiService';
import { HealthResponse } from './server/types';

const PORT = 3000;
const app = express();

// Middleware
app.use(express.json());

// CORS & Headers
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  next();
});

// Configure Multer for in-memory file ingestion
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

// Static Media serving for processed sonar imagery
const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');
app.use('/api/media/uploads', express.static(UPLOADS_DIR));

// Static ONNX Runtime WASM binaries & helpers
const ORT_DIST_DIR = path.join(process.cwd(), 'node_modules', 'onnxruntime-web', 'dist');
app.use(
  '/ort',
  express.static(ORT_DIST_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
      }
    },
  })
);

// Serve public static assets (models, samples, etc.)
const PUBLIC_DIR = path.join(process.cwd(), 'public');
app.use(
  express.static(PUBLIC_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
      } else if (filePath.endsWith('.onnx')) {
        res.setHeader('Content-Type', 'application/octet-stream');
      }
    },
  })
);

// 1. Health Check Endpoint
app.get('/api/health', (_req, res) => {
  const health: HealthResponse = {
    status: 'healthy',
    service: 'Marine Debris AI Sonar Backend',
    version: '2.0.0',
    detector_mode: 'Demonstration Saliency & Acoustic Anomaly Extractor (YOLO-Ready)',
  };
  res.json(health);
});

// 2. Sonar Image Analysis Endpoint
app.post('/api/analyze', upload.single('file'), async (req, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Please provide a sonar image.' });
      return;
    }

    const originalFilename = req.file.originalname || 'sonar_scan.png';
    const result = await processSonarImage(req.file.buffer, originalFilename);

    res.status(200).json(result);
  } catch (err: any) {
    console.error('[Analyze Error]', err);
    res.status(500).json({
      error: 'Analysis pipeline failed',
      detail: err.message || 'Internal sonar image processing error',
    });
  }
});

// 3. Get Result by ID
app.get('/api/results/:result_id', (req, res): void => {
  const { result_id } = req.params;
  const result = getCachedResult(result_id);

  if (!result) {
    res.status(404).json({ error: `Result ID '${result_id}' not found` });
    return;
  }

  res.json(result);
});

// 4. Download JSON Report
app.get('/api/results/:result_id/json', (req, res): void => {
  const { result_id } = req.params;
  const result = getCachedResult(result_id);

  if (!result) {
    res.status(404).json({ error: `Result ID '${result_id}' not found` });
    return;
  }

  const jsonStr = exportToJsonString(result);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="marine_debris_analysis_${result_id}.json"`
  );
  res.send(jsonStr);
});

// 5. Download CSV Report
app.get('/api/results/:result_id/csv', (req, res): void => {
  const { result_id } = req.params;
  const result = getCachedResult(result_id);

  if (!result) {
    res.status(404).json({ error: `Result ID '${result_id}' not found` });
    return;
  }

  const csvStr = exportToCsvString(result);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="marine_debris_detections_${result_id}.csv"`
  );
  res.send(csvStr);
});

// 6. AI Intelligence: Threat & Ecological Assessment
app.post('/api/ai/assess-scan', async (req, res): Promise<void> => {
  try {
    const { result } = req.body;
    if (!result || !result.detections) {
      res.status(400).json({ error: 'Valid detection result payload is required' });
      return;
    }

    const assessment = await generateScanThreatAssessment(result);
    res.json(assessment);
  } catch (err: any) {
    console.error('[AI Assess Scan Error]', err);
    res.status(500).json({ error: err.message || 'AI assessment failed' });
  }
});

// 7. AI Intelligence: Single Target Deep Acoustic Diagnostics
app.post('/api/ai/analyze-target', async (req, res): Promise<void> => {
  try {
    const { target, scanMetadata } = req.body;
    if (!target) {
      res.status(400).json({ error: 'Target detection object is required' });
      return;
    }

    const diagnostics = await generateTargetDiagnostics(target, scanMetadata);
    res.json(diagnostics);
  } catch (err: any) {
    console.error('[AI Target Diagnostics Error]', err);
    res.status(500).json({ error: err.message || 'AI diagnostics failed' });
  }
});

// 8. AI Intelligence: Hydrographic AI Co-Pilot Chat
app.post('/api/ai/chat', async (req, res): Promise<void> => {
  try {
    const { messages, currentScanContext, activeTarget } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    const reply = await chatWithHydrographicAI(messages, currentScanContext, activeTarget);
    res.json({ reply });
  } catch (err: any) {
    console.error('[AI Chat Error]', err);
    res.status(500).json({ error: err.message || 'AI Chat failed' });
  }
});

// 9. Vite / Static Server integration
async function setupFrontend() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (/\.(wasm|onnx|png|jpg|jpeg|svg|json|js|mjs|css|map|ico|ttf|woff|woff2)$/i.test(req.path)) {
        res.status(404).send('Asset not found');
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Marine Debris AI running at http://0.0.0.0:${PORT}`);
  });
}

setupFrontend().catch((err) => {
  console.error('[Server Setup Error]', err);
});
