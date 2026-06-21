import { getDb } from '../../db/connection.js';
import { haversineDistance } from '../../utils/haversine.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationMeta } from '../../utils/pagination.js';

export interface CemeteryRow {
  id: number;
  name: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  country: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  hours: string | null;
  services: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CemeteryWithStats extends CemeteryRow {
  avg_rating: number;
  review_count: number;
  distance?: number;
}

export interface CemeterySearchParams {
  lat?: number;
  lng?: number;
  radius?: number;
  q?: string;
  page?: number;
  limit?: number;
}

export interface CemeterySearchResult {
  cemeteries: CemeteryWithStats[];
  meta: PaginationMeta;
}

export class CemeteryRepository {
  findById(id: number): CemeteryWithStats | undefined {
    const db = getDb();
    const row = db.prepare(`
      SELECT c.*, COALESCE(cs.avg_rating, 0) AS avg_rating, COALESCE(cs.review_count, 0) AS review_count
      FROM cemeteries c
      LEFT JOIN cemetery_stats cs ON cs.cemetery_id = c.id
      WHERE c.id = ?
    `).get(id) as CemeteryWithStats | undefined;
    return row;
  }

  search(params: CemeterySearchParams): CemeterySearchResult {
    const db = getDb();

    // Build query conditions
    const conditions: string[] = [];
    const queryParams: any[] = [];
    let baseQuery = `
      FROM cemeteries c
      LEFT JOIN cemetery_stats cs ON cs.cemetery_id = c.id
    `;

    // Text search across name/city/state
    if (params.q) {
      conditions.push('(c.name LIKE ? OR c.city LIKE ? OR c.state LIKE ?)');
      const searchTerm = `%${params.q}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // If lat/lng provided, we'll filter by radius in-memory after fetching
    // For efficiency, we do a rough bounding box first
    let useLocationFilter = false;
    let roughConditions: string[] = [];

    if (params.lat !== undefined && params.lng !== undefined && params.radius) {
      useLocationFilter = true;
      // Rough bounding box (~111km per degree)
      const latDelta = params.radius / 111;
      const lngDelta = params.radius / (111 * Math.cos(toRadians(params.lat)));
      roughConditions.push('c.latitude BETWEEN ? AND ?');
      roughConditions.push('c.longitude BETWEEN ? AND ?');
      queryParams.push(params.lat - latDelta, params.lat + latDelta);
      queryParams.push(params.lng - lngDelta, params.lng + lngDelta);
    }

    // Count query
    const countSql = `SELECT COUNT(*) as total ${baseQuery}` +
      (conditions.length > 0 || roughConditions.length > 0
        ? ` WHERE ${[...conditions, ...roughConditions].join(' AND ')}` : '');

    const { total } = db.prepare(countSql).get(...queryParams) as { total: number };

    // Pagination
    const pag = getPaginationParams(params.page, params.limit);
    const offset = (pag.page - 1) * pag.limit;

    // Data query
    const selectSql = `SELECT c.*, COALESCE(cs.avg_rating, 0) AS avg_rating, COALESCE(cs.review_count, 0) AS review_count ${baseQuery}` +
      (conditions.length > 0 || roughConditions.length > 0
        ? ` WHERE ${[...conditions, ...roughConditions].join(' AND ')}` : '') +
      ` ORDER BY c.name ASC LIMIT ? OFFSET ?`;

    queryParams.push(pag.limit, offset);
    const rows = db.prepare(selectSql).all(...queryParams) as CemeteryWithStats[];

    // If location filtering, compute actual distances and re-filter
    let filtered = rows;
    if (useLocationFilter && params.radius) {
      filtered = rows
        .map(c => ({
          ...c,
          distance: haversineDistance(params.lat!, params.lng!, c.latitude, c.longitude),
        }))
        .filter(c => c.distance! <= params.radius!)
        .sort((a, b) => a.distance! - b.distance!);
    }

    return {
      cemeteries: filtered,
      meta: buildPaginationMeta(total, pag),
    };
  }

  create(data: Omit<CemeteryRow, 'id' | 'created_at' | 'updated_at'>): number {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO cemeteries (name, description, address, city, state, zip, country, latitude, longitude, phone, website, hours, services, image_url)
      VALUES (@name, @description, @address, @city, @state, @zip, @country, @latitude, @longitude, @phone, @website, @hours, @services, @image_url)
    `).run(data);
    return Number(result.lastInsertRowid);
  }

  update(id: number, data: Partial<CemeteryRow>): boolean {
    const db = getDb();
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    const result = db.prepare(
      `UPDATE cemeteries SET ${fields.join(', ')} WHERE id = ?`
    ).run(...values);

    return result.changes > 0;
  }

  delete(id: number): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM cemeteries WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}