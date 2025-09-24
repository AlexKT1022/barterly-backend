import prisma from '#lib/prisma';

export const listPosts = async ({ status, user_id, q } = {}) => {
  const where = {
    ...(status ? { status } : {}),
    ...(user_id ? { authorId: Number(user_id) } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const posts = await prisma.post.findMany({
    where,
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    take: 100,
    include: {
      author: { select: { username: true } },
      _count: { select: { responses: true } },
    },
  });
  return posts.map(({ author, _count, ...rest }) => ({
    ...rest,
    username: author.username,
    response_count: _count.responses,
  }));
};

export const getPostById = async (id) => {
  const post = await prisma.post.findUnique({
    where: { id: Number(id) },
    include: { author: { select: { username: true } }, items: true },
  });
  if (!post) return null;
  const summary = await prisma.response.groupBy({
    by: ['status'],
    where: { postId: Number(id) },
    _count: { _all: true },
  });
  return {
    ...post,
    username: post.author.username,
    responses_summary: summary.map((s) => ({
      status: s.status,
      count: s._count._all,
    })),
  };
};

export const createPostWithItems = async ({
  userId,
  title,
  description = '',
  items,
}) => {
  if (!Array.isArray(items) || !items.length) {
    const e = new Error('items array required');
    e.status = 400;
    throw e;
  }
  const created = await prisma.post.create({
    data: {
      authorId: Number(userId),
      title,
      description,
      status: 'open',
      updatedAt: new Date(),
      items: {
        create: items.map((it) => ({
          name: it.name,
          description: it.description ?? '',
          condition: it.condition ?? null,
          imageUrl: it.image_url ?? null,
          quantity: it.quantity ?? 1,
        })),
      },
    },
    include: { items: true },
  });
  return created;
};

export const updatePostByOwner = async ({ id, ownerId, fields }) => {
  const post = await prisma.post.findUnique({
    where: { id: Number(id) },
    select: { authorId: true },
  });
  if (!post) {
    const e = new Error('Post not found');
    e.status = 404;
    throw e;
  }
  if (post.authorId !== Number(ownerId)) {
    const e = new Error('Not your post');
    e.status = 403;
    throw e;
  }
  return prisma.post.update({
    where: { id: Number(id) },
    data: {
      ...(fields.title !== undefined ? { title: fields.title } : {}),
      ...(fields.description !== undefined
        ? { description: fields.description }
        : {}),
      ...(fields.status !== undefined ? { status: fields.status } : {}),
      updatedAt: new Date(),
    },
  });
};

export const deletePostByOwner = async ({ id, ownerId }) => {
  const post = await prisma.post.findUnique({
    where: { id: Number(id) },
    select: { authorId: true },
  });
  if (!post) {
    const e = new Error('Post not found');
    e.status = 404;
    throw e;
  }
  if (post.authorId !== Number(ownerId)) {
    const e = new Error('Not your post');
    e.status = 403;
    throw e;
  }
  await prisma.post.delete({ where: { id: Number(id) } });
};
