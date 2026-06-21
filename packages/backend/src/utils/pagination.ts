export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function getPaginationParams(
  page?: number | string,
  limit?: number | string
): PaginationParams {
  const p = typeof page === 'string' ? parseInt(page, 10) : (page ?? 1);
  const l = typeof limit === 'string' ? parseInt(limit, 10) : (limit ?? 20);
  return {
    page: Math.max(1, isNaN(p) ? 1 : p),
    limit: Math.min(100, Math.max(1, isNaN(l) ? 20 : l)),
  };
}

export function buildPaginationMeta(
  total: number,
  params: PaginationParams
): PaginationMeta {
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit),
  };
}