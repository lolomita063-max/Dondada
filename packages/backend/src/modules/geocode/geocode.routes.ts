import type { FastifyInstance } from 'fastify';
import { GeocodeController } from './geocode.controller.js';

export function registerGeocodeRoutes(app: FastifyInstance) {
  const controller = new GeocodeController();

  app.get('/api/v1/geocode', controller.forwardGeocode.bind(controller));
  app.get('/api/v1/reverse-geocode', controller.reverseGeocode.bind(controller));
}