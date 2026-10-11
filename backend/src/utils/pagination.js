const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

/**
 * Parse pagination kutoka query
 */
const parsePagination = (query) => {
  let limit = parseInt(query.limit, 10) || DEFAULT_LIMIT;
  let offset = parseInt(query.offset, 10) || 0;

  // Weka mipaka
  if (limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  if (offset < 0) offset = 0;

  return { limit, offset };
};

/**
 * Tengeneza pagination metadata
 */
const buildPaginationMeta = ({ total, limit, offset, count }) => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return {
    total,
    count,
    limit,
    offset,
    current_page: currentPage,
    total_pages: totalPages,
    has_next: offset + limit < total,
    has_prev: offset > 0,
  };
};

module.exports = {
  parsePagination,
  buildPaginationMeta,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
