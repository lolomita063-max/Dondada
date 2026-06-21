import { ReviewRepository, CreateReviewInput } from './review.repository.js';
import { CemeteryRepository } from '../cemeteries/cemetery.repository.js';
import { AppError } from '../../middleware/error-handler.js';

export class ReviewService {
  constructor(
    private repo: ReviewRepository,
    private cemeteryRepo: CemeteryRepository
  ) {}

  getByCemeteryId(cemeteryId: number, page?: number, limit?: number) {
    // Verify cemetery exists
    const cemetery = this.cemeteryRepo.findById(cemeteryId);
    if (!cemetery) {
      throw new AppError(404, 'NOT_FOUND', `Cemetery with id ${cemeteryId} not found`);
    }

    return this.repo.findByCemeteryId(cemeteryId, page, limit);
  }

  create(cemeteryId: number, input: CreateReviewInput) {
    // Verify cemetery exists
    const cemetery = this.cemeteryRepo.findById(cemeteryId);
    if (!cemetery) {
      throw new AppError(404, 'NOT_FOUND', `Cemetery with id ${cemeteryId} not found`);
    }

    // Validate rating
    if (input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating)) {
      throw new AppError(400, 'INVALID_RATING', 'Rating must be an integer between 1 and 5');
    }

    // Validate author name
    if (!input.author_name || input.author_name.trim().length === 0) {
      throw new AppError(400, 'INVALID_AUTHOR', 'Author name is required');
    }

    return this.repo.create(cemeteryId, {
      ...input,
      author_name: input.author_name.trim(),
    });
  }
}