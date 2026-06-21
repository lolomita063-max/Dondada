import { CemeteryRepository, CemeterySearchParams, CemeteryWithStats } from './cemetery.repository.js';
import { AppError } from '../../middleware/error-handler.js';

export class CemeteryService {
  constructor(private repo: CemeteryRepository) {}

  async search(params: CemeterySearchParams) {
    // Validate lat/lng together if provided
    if ((params.lat !== undefined && params.lng === undefined) ||
        (params.lat === undefined && params.lng !== undefined)) {
      throw new AppError(400, 'INVALID_PARAMS', 'Both lat and lng must be provided together');
    }

    return this.repo.search(params);
  }

  async getById(id: number): Promise<CemeteryWithStats> {
    const cemetery = this.repo.findById(id);
    if (!cemetery) {
      throw new AppError(404, 'NOT_FOUND', `Cemetery with id ${id} not found`);
    }
    return cemetery;
  }
}