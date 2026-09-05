# Marine Debris AI 🌊🛰️
**Side-Scan Sonar Anomaly Detection & Geolocation Pipeline**

A modular, full-stack prototype application for detecting artificial marine debris (such as ghost fishing nets, sunken containers, discarded cables, and derelict traps) in Side-Scan Sonar acoustic imagery.

---

## 🧭 Workflow Architecture

```
Upload Side-Scan Sonar Image (.png, .jpg, .tiff)
       ↓
OpenCV Modular Preprocessing Pipeline (Grayscale → Intensity Normalization → CLAHE → Bilateral Denoising)
       ↓
Acoustic Anomaly Detector Service (Deterministic Benchmark Saliency / YOLOv8/v11 Extension Point)
       ↓
WGS84 Geolocation Projection (Across-track & Along-track Transect Coordinate Engine)
       ↓
Operational React Dashboard (Interactive Sonar Waterfall Viewer + Leaflet Hydrographic Map)
       ↓
Standardized Survey Export (Full JSON Report + Hydrographic Survey CSV)
```

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Leaflet (`react-leaflet`), Lucide Icons, Motion
- **Backend:** Python 3.10+, FastAPI, OpenCV (`opencv-python-headless`), NumPy, Pydantic, Uvicorn
- **Storage:** Local filesystem persistence (`backend/data/uploads/`, `backend/data/results/`)
- **No external databases or heavy orchestration required.**

---

## 📁 Project Structure

```
marine-debris-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI server & CORS setup
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── analysis.py          # /api/analyze, /api/results/{id} endpoints
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── preprocessing.py     # OpenCV CLAHE + noise reduction
│   │   │   ├── detector.py          # Demo detector & YOLO extension point
│   │   │   ├── geolocation.py       # Pixel-to-GPS (WGS84) projection
│   │   │   └── reporting.py         # JSON and CSV generators
│   │   └── schemas/
│   │       ├── __init__.py
│   │       └── detection.py         # Pydantic schemas
│   ├── data/
│   │   ├── uploads/                 # Saved uploaded & processed imagery
│   │   └── results/                 # JSON survey results
│   └── requirements.txt             # Python dependencies
│
├── src/
│   ├── components/
│   │   ├── Header.tsx               # Marine survey operational header
│   │   ├── UploadPanel.tsx          # File selector & preset sample loader
│   │   ├── ProcessingStatus.tsx     # Step progression monitor
│   │   ├── SonarViewer.tsx          # Interactive waterfall canvas with SVG boxes
│   │   ├── DetectionPanel.tsx       # Anomaly target table with priority filter
│   │   ├── MissionStatistics.tsx    # Mission statistics cards
│   │   ├── ReportButtons.tsx        # JSON & CSV export buttons
│   │   └── ArchitectureInfoModal.tsx# YOLO & GeoTIFF architecture modal
│   ├── map/
│   │   └── MarineMap.tsx            # Interactive Leaflet map with radar markers
│   ├── services/
│   │   └── api.ts                   # Frontend API client
│   ├── types/
│   │   └── detection.ts             # TypeScript definitions
│   ├── App.tsx                      # Dashboard root
│   ├── main.tsx
│   └── index.css                    # Tailwind + Leaflet dark styling
│
├── server.ts                        # Full-stack runner (Node proxy + FastAPI)
├── package.json
└── README.md
```

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

---

### Method A: Single Command Full-Stack Mode (Recommended)

1. **Install Node dependencies:**
   ```bash
   npm install
   ```

2. **Install Python backend dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```
   *This automatically launches both the FastAPI backend on port 8000 and the Vite frontend on port 3000.*

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

---

### Method B: Independent Backend & Frontend Terminals

#### Terminal 1: FastAPI Backend
```bash
# 1. Navigate to backend
cd backend

# 2. (Optional) Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend API docs will be available at `http://localhost:8000/docs`.*

#### Terminal 2: React Frontend
```bash
# 1. In project root
npm install

# 2. Start Vite frontend
npm run dev
```
*Frontend will run at `http://localhost:3000` with automated proxying to the backend.*

---

## 🔌 Integrating a Real YOLO Model Later

The detector in `backend/app/services/detector.py` is clearly isolated. To replace it with a trained YOLO model (e.g. YOLOv8 / YOLOv11 acoustic sonar weights):

1. Install Ultralytics:
   ```bash
   pip install ultralytics
   ```
2. Place model weights in `backend/models/marine_debris_sonar.pt`.
3. In `backend/app/services/detector.py`, load the model and call:
   ```python
   from ultralytics import YOLO

   model = YOLO("backend/models/marine_debris_sonar.pt")

   def detect_marine_debris(preprocessed_bgr):
       results = model.predict(preprocessed_bgr, conf=0.45)
       # Parse bounding boxes and map coordinates through geolocation.py
       ...
   ```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend status and detector mode |
| `POST` | `/api/analyze` | Upload and analyze side-scan sonar image |
| `GET` | `/api/results/{id}` | Retrieve JSON result for given ID |
| `GET` | `/api/results/{id}/json` | Download JSON survey report |
| `GET` | `/api/results/{id}/csv` | Download CSV survey log |
