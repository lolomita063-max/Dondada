import type { FastifyInstance } from 'fastify';
import { CemeteryController } from './cemetery.controller.js';
import { CemeteryService } from './cemetery.service.js';
import { CemeteryRepository } from './cemetery.repository.js';

export function registerCemeteryRoutes(app: FastifyInstance) {
  const repo = new CemeteryRepository();
  const service = new CemeteryService(repo);
  const controller = new CemeteryController(service);

  app.get('/api/v1/cemeteries', controller.search.bind(controller));
  app.get('/api/v1/cemeteries/:id', controller.getById.bind(controller));
}