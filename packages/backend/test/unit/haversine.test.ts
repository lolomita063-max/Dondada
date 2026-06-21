import { describe, it, expect } from 'vitest';
import { haversineDistance } from '../src/utils/haversine.js';

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    const dist = haversineDistance(40.7128, -74.0060, 40.7128, -74.0060);
    expect(dist).toBe(0);
  });

  it('calculates distance between New York and Los Angeles (~3944 km)', () => {
    const dist = haversineDistance(40.7128, -74.0060, 34.0522, -118.2437);
    expect(dist).toBeGreaterThan(3900);
    expect(dist).toBeLessThan(4000);
  });

  it('calculates distance between London and Paris (~344 km)', () => {
    const dist = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(330);
    expect(dist).toBeLessThan(360);
  });

  it('calculates distance between Chicago and New York (~1145 km)', () => {
    const dist = haversineDistance(41.8781, -87.6298, 40.7128, -74.0060);
    expect(dist).toBeGreaterThan(1100);
    expect(dist).toBeLessThan(1200);
  });

  it('handles points near the equator', () => {
    const dist = haversineDistance(0, 0, 0, 1);
    // 1 degree at equator ≈ 111.2 km
    expect(dist).toBeGreaterThan(110);
    expect(dist).toBeLessThan(112);
  });
});