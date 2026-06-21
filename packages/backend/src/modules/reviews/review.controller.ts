import type { FastifyRequest, FastifyReply } from 'fastify';
import { ReviewService } from './review.service.js';

interface CemeteryParams {
  id: string;
}

interface CreateReviewBody {
  author_name: string;
  author_email?: string;
  rating: number;
  comment?: string;
}

export class ReviewController {
  constructor(private service: ReviewService) {}

  async getByCemeteryId(
    request: FastifyRequest<{ Params: CemeteryParams }>,
    reply: FastifyReply
  ) {
    const cemeteryId = parseInt(request.params.id, 10);
    if (isNaN(cemeteryId)) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: { code: 'INVALID_ID', message: 'Cemetery ID must be a number' },
      });
    }

    const query = request.query as { page?: string; limit?: string };
    const result = this.service.getByCemeteryId(
      cemeteryId,
      query.page ? parseInt(query.page, 10) : undefined,
      query.limit ? parseInt(query.limit, 10) : undefined
    );

    return reply.send({
      success: true,
      data: result.reviews,
      meta: result.meta,
    });
  }

  async create(
    request: FastifyRequest<{ Params: CemeteryParams; Body: CreateReviewBody }>,
    reply: FastifyReply
  ) {
    const cemeteryId = parseInt(request.params.id, 10);
    if (isNaN(cemeteryId)) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: { code: 'INVALID_ID', message: 'Cemetery ID must be a number' },
      });
    }

    const review = this.service.create(cemeteryId, request.body);

    return reply.status(201).send({
      success: true,
      data: review,
    });
  }
}