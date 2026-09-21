export const getPagination = (page = 1, limit = 10) => {
    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.max(parseInt(limit) || 10, 1);

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};

export const buildPaginationMeta = (
    page,
    limit,
    totalRecords
) => {
    return {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        hasNext: page * limit < totalRecords,
        hasPrevious: page > 1,
    };
};