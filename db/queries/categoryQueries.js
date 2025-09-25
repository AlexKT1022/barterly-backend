// /db/queries/categoryQueries.js
import prisma from '#lib/prisma';

/** List all categories. Added pagination */
export const listCategories = async ({ q, limit = 100, offset = 0 } = {}) => {
  const where = q
    ? { name: { contains: q, mode: 'insensitive' } }
    : {};

  const take = Math.max(1, Math.min(200, Number(limit) || 100));
  const skip = Math.max(0, Number(offset) || 0);

  const [rows, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      take,
      skip,
      select: {
        id: true,
        name: true,
        _count: { select: { posts: true } }, 
      },
    }),
    prisma.category.count({ where }),
  ]);

  return {
    total,
    limit: take,
    offset: skip,
    categories: rows.map(c => ({
      id: c.id,
      name: c.name,
      post_count: c._count.posts,
    })),
  };
};
