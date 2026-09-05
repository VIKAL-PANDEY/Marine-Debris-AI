import { DetectionResult } from './types';

export function exportToJsonString(result: DetectionResult): string {
  return JSON.stringify(result, null, 2);
}

export function exportToCsvString(result: DetectionResult): string {
  const rows: string[] = [
    'id,class_name,confidence,latitude,longitude,priority,bbox_x,bbox_y,bbox_width,bbox_height',
  ];

  for (const item of result.detections) {
    rows.push(
      [
        item.id,
        item.class_name,
        item.confidence.toFixed(4),
        item.latitude.toFixed(6),
        item.longitude.toFixed(6),
        item.priority,
        item.bbox.x,
        item.bbox.y,
        item.bbox.width,
        item.bbox.height,
      ].join(',')
    );
  }

  return rows.join('\n');
}
