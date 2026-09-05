import { DetectionResult, DetectionItem } from '../types/detection';

export interface StoredScanRecord {
  id: string;
  timestamp: string;
  filename: string;
  previewUrl: string;
  result: DetectionResult;
  detectionCount: number;
  criticalCount: number;
  engineUsed: 'yolo' | 'server';
  falsePositiveIds: string[];
}

const STORAGE_KEY = 'marine_debris_ai_scan_history_v1';
const MAX_HISTORY_ITEMS = 30;

export function getScanHistory(): StoredScanRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse scan history from localStorage:', err);
    return [];
  }
}

export function saveScanToHistory(
  result: DetectionResult,
  filename: string,
  previewUrl: string,
  engineUsed: 'yolo' | 'server' = 'yolo',
  falsePositiveIds: string[] = []
): StoredScanRecord[] {
  try {
    const history = getScanHistory();
    // Avoid duplicate saves of the same result_id
    const existingIndex = history.findIndex((h) => h.result.result_id === result.result_id);

    const record: StoredScanRecord = {
      id: result.result_id || `SCAN-${Date.now()}`,
      timestamp: result.created_at || new Date().toISOString(),
      filename: filename || result.metadata.filename || 'sonar_scan.png',
      // If previewUrl is a blob URL, keep it or use the original_image_url
      previewUrl: previewUrl || result.original_image_url || result.preprocessed_image_url,
      result,
      detectionCount: result.detections.length,
      criticalCount: result.detections.filter((d) => d.priority === 'high').length,
      engineUsed,
      falsePositiveIds,
    };

    let updated: StoredScanRecord[];
    if (existingIndex >= 0) {
      updated = [...history];
      updated[existingIndex] = record;
    } else {
      updated = [record, ...history].slice(0, MAX_HISTORY_ITEMS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save scan to localStorage:', err);
    return getScanHistory();
  }
}

export function updateFalsePositivesInHistory(scanId: string, falsePositiveIds: string[]): StoredScanRecord[] {
  try {
    const history = getScanHistory();
    const updated = history.map((h) =>
      h.id === scanId ? { ...h, falsePositiveIds } : h
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to update false positives:', err);
    return getScanHistory();
  }
}

export function deleteScanFromHistory(id: string): StoredScanRecord[] {
  try {
    const history = getScanHistory();
    const updated = history.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to delete scan from localStorage:', err);
    return getScanHistory();
  }
}

export type ScanHistoryRecord = StoredScanRecord;

export function flagFalsePositiveInScan(
  scanId: string,
  targetId: string,
  reason?: string,
  notes?: string
): StoredScanRecord[] {
  try {
    const history = getScanHistory();
    const updated = history.map((h) => {
      if (h.id === scanId || h.result.result_id === scanId) {
        const currentIds = h.falsePositiveIds || [];
        const newIds = currentIds.includes(targetId) ? currentIds : [...currentIds, targetId];
        return { ...h, falsePositiveIds: newIds };
      }
      return h;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to flag false positive in scan history:', err);
    return getScanHistory();
  }
}

export function clearAllScanHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear scan history:', err);
  }
}
