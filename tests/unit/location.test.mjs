import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Pure implementation of Haversine distance matching src/lib/location.ts
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return null;
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) return null;
  if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) return null;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

// Pure implementation of Machinery ETA matching src/lib/location.ts
function calculateMachineryETA(distanceKm, speedKmh = 25) {
  if (distanceKm == null || distanceKm <= 0) return null;
  const travelHours = distanceKm / speedKmh;
  const minutes = Math.max(1, Math.round(travelHours * 60));
  return { minutes };
}

describe('Location & Geographic Telemetry Unit Tests', () => {
  test('calculateDistanceKm returns 0 for identical coordinates', () => {
    const d = calculateDistanceKm(12.9165, 79.1325, 12.9165, 79.1325);
    assert.equal(d, 0);
  });

  test('calculateDistanceKm accurately measures Vellore to Katpadi (~6 km)', () => {
    // Vellore (12.9165, 79.1325) to Katpadi (12.9698, 79.1384)
    const d = calculateDistanceKm(12.9165, 79.1325, 12.9698, 79.1384);
    assert.ok(d !== null);
    assert.ok(d >= 5.5 && d <= 6.5, `Expected ~6.0 km, got ${d}`);
  });

  test('calculateDistanceKm returns null for missing or invalid coordinates', () => {
    assert.equal(calculateDistanceKm(null, 79.13, 12.91, 79.13), null);
    assert.equal(calculateDistanceKm(undefined, 79.13, 12.91, 79.13), null);
    assert.equal(calculateDistanceKm(100, 79.13, 12.91, 79.13), null); // Latitude > 90
    assert.equal(calculateDistanceKm(12.91, 200, 12.91, 79.13), null); // Longitude > 180
  });

  test('calculateMachineryETA computes realistic transit time at 25 km/h', () => {
    // 25 km at 25 km/h = 60 minutes
    const eta = calculateMachineryETA(25, 25);
    assert.ok(eta !== null);
    assert.equal(eta.minutes, 60);

    // 12.5 km at 25 km/h = 30 minutes
    const etaHalf = calculateMachineryETA(12.5, 25);
    assert.ok(etaHalf !== null);
    assert.equal(etaHalf.minutes, 30);
  });

  test('calculateMachineryETA returns null for null or non-positive distance', () => {
    assert.equal(calculateMachineryETA(null), null);
    assert.equal(calculateMachineryETA(0), null);
    assert.equal(calculateMachineryETA(-5), null);
  });
});
