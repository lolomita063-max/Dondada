import type { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../../config.js';
import { AppError } from '../../middleware/error-handler.js';

interface GeocodeQuery {
  q: string;
}

interface ReverseGeocodeQuery {
  lat: string;
  lng: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

export class GeocodeController {
  async forwardGeocode(
    request: FastifyRequest<{ Querystring: GeocodeQuery }>,
    reply: FastifyReply
  ) {
    const { q } = request.query;
    if (!q || q.trim().length === 0) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: { code: 'MISSING_QUERY', message: 'Query parameter q is required' },
      });
    }

    try {
      const url = new URL('/search', config.nominatimBaseUrl);
      url.searchParams.set('q', q);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '5');
      url.searchParams.set('addressdetails', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'CemeteryFinder/1.0 (coreforge@example.com)',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new AppError(502, 'GEOCODE_ERROR', 'Geocoding service returned an error');
      }

      const results: NominatimResult[] = await response.json();
      return reply.send({ success: true, data: results });
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(502, 'GEOCODE_ERROR', 'Failed to reach geocoding service');
    }
  }

  async reverseGeocode(
    request: FastifyRequest<{ Querystring: ReverseGeocodeQuery }>,
    reply: FastifyReply
  ) {
    const { lat, lng } = request.query;
    if (!lat || !lng) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: { code: 'MISSING_PARAMS', message: 'Both lat and lng parameters are required' },
      });
    }

    try {
      const url = new URL('/reverse', config.nominatimBaseUrl);
      url.searchParams.set('lat', lat);
      url.searchParams.set('lon', lng);
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'CemeteryFinder/1.0 (coreforge@example.com)',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new AppError(502, 'GEOCODE_ERROR', 'Reverse geocoding service returned an error');
      }

      const result: NominatimResult = await response.json();
      return reply.send({ success: true, data: result });
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(502, 'GEOCODE_ERROR', 'Failed to reach geocoding service');
    }
  }
}