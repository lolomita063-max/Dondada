import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CemeteryRepository } from '../src/modules/cemeteries/cemetery.repository.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.join(__dirname, '..', '..', 'test-data', 'test-cemetery.db');

describe('CemeteryRepository (integration)', () => {
  let repo: CemeteryRepository;

  beforeAll(() => {
    // Set test DB path
    const testDir = path.dirname(testDbPath);
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

    // Override config
    process.env.DB_PATH = testDbPath;

    // Reset requires - we need to use a fresh DB for tests
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

    const db = new Database(testDbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS cemeteries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip TEXT,
        country TEXT NOT NULL DEFAULT 'US',
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        phone TEXT,
        website TEXT,
        hours TEXT,
        services TEXT,
        image_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_cemeteries_location ON cemeteries(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_cemeteries_city_state ON cemeteries(city, state);
      CREATE INDEX IF NOT EXISTS idx_cemeteries_name ON cemeteries(name);

      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cemetery_id INTEGER NOT NULL REFERENCES cemeteries(id) ON DELETE CASCADE,
        author_name TEXT NOT NULL,
        author_email TEXT,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_reviews_cemetery ON reviews(cemetery_id);

      CREATE TABLE IF NOT EXISTS cemetery_stats (
        cemetery_id INTEGER PRIMARY KEY REFERENCES cemeteries(id) ON DELETE CASCADE,
        avg_rating REAL DEFAULT 0,
        review_count INTEGER DEFAULT 0
      );
    `);

    // Seed test data
    db.exec(`
      INSERT INTO cemeteries (name, address, city, state, zip, country, latitude, longitude, description)
      VALUES 
        ('Arlington National Cemetery', '1 Memorial Ave', 'Arlington', 'VA', '22211', 'US', 38.8796, -77.0733, 'US military cemetery'),
        ('Hollywood Forever', '6000 Santa Monica Blvd', 'Los Angeles', 'CA', '90038', 'US', 34.0897, -118.3199, 'Historic LA cemetery'),
        ('Green-Wood Cemetery', '500 25th St', 'Brooklyn', 'NY', '11232', 'US', 40.6522, -73.9908, 'Brooklyn historic cemetery');
      INSERT INTO cemetery_stats (cemetery_id, avg_rating, review_count) VALUES (1, 4.5, 10), (2, 4.2, 5), (3, 4.8, 15);
    `);

    db.close();

    // Now import the repository module
    repo = new CemeteryRepository();
  });

  afterAll(() => {
    try {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
      const walPath = testDbPath + '-wal';
      const shmPath = testDbPath + '-shm';
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch {}
  });

  it('finds a cemetery by id', () => {
    const result = repo.findById(1);
    expect(result).toBeDefined();
    expect(result!.name).toBe('Arlington National Cemetery');
    expect(result!.avg_rating).toBe(4.5);
    expect(result!.review_count).toBe(10);
  });

  it('returns undefined for non-existent id', () => {
    const result = repo.findById(999);
    expect(result).toBeUndefined();
  });

  it('searches cemeteries by text query', () => {
    const result = repo.search({ q: 'Hollywood' });
    expect(result.cemeteries.length).toBeGreaterThan(0);
    expect(result.cemeteries[0].name).toContain('Hollywood');
  });

  it('searches cemeteries and returns all when no filter', () => {
    const result = repo.search({});
    expect(result.cemeteries.length).toBe(3);
  });

  it('searches with pagination', () => {
    const result = repo.search({ page: 1, limit: 2 });
    expect(result.cemeteries.length).toBe(2);
    expect(result.meta.total).toBe(3);
    expect(result.meta.totalPages).toBe(2);
  });

  it('searches by location with radius', () => {
    // Search near Arlington, VA (lat: 38.8796, lng: -77.0733) with large radius
    const result = repo.search({ lat: 38.88, lng: -77.07, radius: 50 });
    expect(result.cemeteries.length).toBeGreaterThanOrEqual(1);
  });

  it('finds nearby cemeteries sorted by distance', () => {
    const result = repo.search({ lat: 38.88, lng: -77.07, radius: 2000 });
    expect(result.cemeteries.length).toBeGreaterThan(0);
    if (result.cemeteries.length > 1) {
      // First result should be closest
      expect(result.cemeteries[0].name).toBe('Arlington National Cemetery');
    }
  });
});