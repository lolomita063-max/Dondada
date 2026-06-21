import { getDb } from '../../db/connection.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import type { PaginationMeta } from '../../utils/pagination.js';

export interface ReviewRow {
  id: number;
  cemetery_id: number;
  author_name: string;
  author_email: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface CreateReviewInput {
  author_name: string;
  author_email?: string;
  rating: number;
  comment?: string;
}

export class ReviewRepository {
  findByCemeteryId(
    cemeteryId: number,
    page?: number,
    limit?: number
  ): { reviews: ReviewRow[]; meta: PaginationMeta } {
    const db = getDb();
    const pag = getPaginationParams(page, limit);
    const offset = (pag.page - 1) * pag.limit;

    const { total } = db
      .prepare('SELECT COUNT(*) as total FROM reviews WHERE cemetery_id = ?')
      .get(cemeteryId) as { total: number };

    const reviews = db
      .prepare(
        'SELECT * FROM reviews WHERE cemetery_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .all(cemeteryId, pag.limit, offset) as ReviewRow[];

    return {
      reviews,
      meta: buildPaginationMeta(total, pag),
    };
  }

  create(cemeteryId: number, input: CreateReviewInput): ReviewRow {
    const db = getDb();
    const result = db
      .prepare(
        `INSERT INTO reviews (cemetery_id, author_name, author_email, rating, comment)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(cemeteryId, input.author_name, input.author_email || null, input.rating, input.comment || null);

    return db
      .prepare('SELECT * FROM reviews WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as ReviewRow;
  }
}