/**
 * Geolocation Service for Side-Scan Sonar Imagery
 * Converts pixel-space image detections to geographic coordinates (WGS84 Latitude/Longitude).
 */

export const DEFAULT_TRANSECT_ORIGIN_LAT = 21.1428;
export const DEFAULT_TRANSECT_ORIGIN_LON = 72.5842;
export const DEFAULT_HEADING_DEG = 45.0;
export const DEFAULT_ACROSS_TRACK_RANGE_M = 100.0;
export const DEFAULT_ALONG_TRACK_LENGTH_M = 200.0;

export function mapPixelToCoordinates(
  pixelX: number,
  pixelY: number,
  imageWidth: number,
  imageHeight: number,
  originLat = DEFAULT_TRANSECT_ORIGIN_LAT,
  originLon = DEFAULT_TRANSECT_ORIGIN_LON,
  headingDeg = DEFAULT_HEADING_DEG,
  swathWidthM = DEFAULT_ACROSS_TRACK_RANGE_M,
  trackLengthM = DEFAULT_ALONG_TRACK_LENGTH_M
): [number, number] {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return [originLat, originLon];
  }

  // Normalized coordinates [0, 1]
  const normX = pixelX / imageWidth;
  const normY = pixelY / imageHeight;

  // Across-track offset in meters from track centerline: [-swathWidth/2, +swathWidth/2]
  const acrossTrackM = (normX - 0.5) * swathWidthM;

  // Along-track offset in meters from start of segment: [0, trackLength]
  const alongTrackM = normY * trackLengthM;

  // Convert heading to radians
  const headingRad = (headingDeg * Math.PI) / 180.0;

  // Rotate across-track and along-track
  const deltaNorth = alongTrackM * Math.cos(headingRad) - acrossTrackM * Math.sin(headingRad);
  const deltaEast = alongTrackM * Math.sin(headingRad) + acrossTrackM * Math.cos(headingRad);

  // Approximate WGS84 degree translation
  const metersPerLatDeg = 111139.0;
  const metersPerLonDeg = 111139.0 * Math.cos((originLat * Math.PI) / 180.0) || 111139.0;

  const targetLat = originLat + deltaNorth / metersPerLatDeg;
  const targetLon = originLon + deltaEast / metersPerLonDeg;

  return [Number(targetLat.toFixed(6)), Number(targetLon.toFixed(6))];
}

export function calculateGeoCoordinates(
  bboxX: number,
  bboxY: number,
  bboxW: number,
  bboxH: number,
  imgWidth: number,
  imgHeight: number,
  baseLat = DEFAULT_TRANSECT_ORIGIN_LAT,
  baseLon = DEFAULT_TRANSECT_ORIGIN_LON
): [number, number] {
  const centerX = bboxX + bboxW / 2.0;
  const centerY = bboxY + bboxH / 2.0;
  return mapPixelToCoordinates(centerX, centerY, imgWidth, imgHeight, baseLat, baseLon);
}
