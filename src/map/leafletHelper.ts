import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Canonical Leaflet initialization as specified for the HeimDall mapping system.
 * Centers on India coordinates [20.5937, 78.9629] at zoom level 5 with OpenStreetMap tiles.
 *
 * @param containerIdOrElement The container DOM id (defaults to 'map') or HTMLElement
 * @returns Initialized Leaflet Map instance
 */
export function createLeafletMap(
  containerIdOrElement: string | HTMLElement = 'map',
  center: [number, number] = [20.5937, 78.9629],
  zoom: number = 5
): L.Map {
  const map = L.map(containerIdOrElement).setView(center, zoom); // India center

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  return map;
}

export const INDIA_CENTER_COORDINATES: [number, number] = [20.5937, 78.9629];
export const DEFAULT_INDIA_ZOOM = 5;
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';
