import type { FastifyRequest, FastifyReply } from 'fastify';
import { CemeteryService } from './cemetery.service.js';

interface CemeterySearchQuery {
  lat?: string;
  lng?: string;
  radius?: string;
  q?: string;
  page?: string;
  limit?: string;
}

interface CemeteryParams {
  id: string;
}

export class CemeteryController {
  constructor(private service: CemeteryService) {}

  async search(request: FastifyRequest<{ Querystring: CemeterySearchQuery }>, reply: FastifyReply) {
    const query = request.query;
    const result = await this.service.search({
      lat: query.lat ? parseFloat(query.lat) : undefined,
      lng: query.lng ? parseFloat(query.lng) : undefined,
      radius: query.radius ? parseFloat(query.radius) : undefined,
      q: query.q,
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    });

    return reply.send({
      success: true,
      data: result.cemeteries,
      meta: result.meta,
    });
  }

  async getById(request: FastifyRequest<{ Params: CemeteryParams }>, reply: FastifyReply) {
    const id = parseInt(request.params.id, 10);
    if (isNaN(id)) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: { code: 'INVALID_ID', message: 'Cemetery ID must be a number' },
      });
    }

    const cemetery = await this.service.getById(id);
    return reply.send({
      success: true,
      data: cemetery,
    });
  }
}