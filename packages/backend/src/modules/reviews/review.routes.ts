import type { FastifyInstance } from 'fastify';
import { ReviewController } from './review.controller.js';
import { ReviewService } from './review.service.js';
import { ReviewRepository } from './review.repository.js';
import { CemeteryRepository } from '../cemeteries/cemetery.repository.js';

export function registerReviewRoutes(app: FastifyInstance) {
  const repo = new ReviewRepository();
  const cemeteryRepo = new CemeteryRepository();
  const service = new ReviewService(repo, cemeteryRepo);
  const controller = new ReviewController(service);

  app.get('/api/v1/cemeteries/:id/reviews', controller.getByCemeteryId.bind(controller));
  app.post('/api/v1/cemeteries/:id/reviews', controller.create.bind(controller));
}