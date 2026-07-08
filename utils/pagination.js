function parsePagination(query, defaultLimit = 10) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

function buildPaginationMeta(total, page, limit) {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    return {
        page: safePage,
        limit,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: safePage < totalPages,
        from: total === 0 ? 0 : (safePage - 1) * limit + 1,
        to: Math.min(safePage * limit, total)
    };
}

module.exports = { parsePagination, buildPaginationMeta };
