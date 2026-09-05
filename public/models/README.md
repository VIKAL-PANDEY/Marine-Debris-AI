# Marine Debris AI - ONNX Models Directory

Place your custom trained YOLO ONNX model file directly in this folder:

```
public/models/marine-debris.onnx
```

### Exporting your custom model from Ultralytics YOLO:
If you trained a YOLOv8, YOLOv11, or YOLOv5 model on marine debris sonar data, you can export it to ONNX using Python:

```bash
# Using Ultralytics CLI:
yolo export model=best.pt format=onnx imgsz=640 opset=12

# Or in Python:
from ultralytics import YOLO
model = YOLO('best.pt')
model.export(format='onnx', imgsz=640, opset=12)
```

Rename the resulting `.onnx` file to `marine-debris.onnx` and place it in this `public/models/` folder.

### Supported YOLO Models:
- **YOLOv8 / YOLOv11** (`[1, 4+C, 8400]` or `[1, 8400, 4+C]`)
- **YOLOv5 / YOLOv7** (`[1, 25200, 5+C]`)
- **End-to-End ONNX with NMS** (`[1, 300, 6]`)
