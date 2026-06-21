import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      data: null,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // Fastify validation errors
  if ('validation' in error && error.validation) {
    return reply.status(400).send({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    });
  }

  // Unknown errors
  console.error('Unhandled error:', error);
  return reply.status(500).send({
    success: false,
    data: null,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}