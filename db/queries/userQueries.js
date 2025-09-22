// /db/queries/userQueries.js
import prisma from '#db/client';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const toPublic = (u) => ({
  id: u.id,
  username: u.username,
  profile_image_url: u.profileImageUrl,
  location: u.location,
  created_at: u.createdAt,
});

// Just for reference. Prisma Error P2002 signifies a "Unique constraint failed" error.
/* -------------------- Auth / basic profile -------------------- */

export const createUser = async (
  username,
  password,
  profileImageUrl = null,
  location = null
) => {
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const u = await prisma.user.create({
      data: {
        username,
        password: hashed,
        profileImageUrl:
          profileImageUrl ?? `https://picsum.photos/seed/${username}/200/200`,
        location: location ?? 'Unknown',
      },
      select: {
        id: true,
        username: true,
        profileImageUrl: true,
        location: true,
        createdAt: true,
      },
    });
    return toPublic(u);
  } catch (err) {
    if (err?.code === 'P2002') {
      const e = new Error('Username is already taken');
      e.status = 409;
      throw e;
    }
    throw err;
  }
};

export const getUserById = async (id) => {
  const u = await prisma.user.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      username: true,
      profileImageUrl: true,
      location: true,
      createdAt: true,
    },
  });
  return u ? toPublic(u) : null;
};

export const getUserByCredentials = async (username, password) => {
  const u = await prisma.user.findUnique({ where: { username } });
  if (!u) return null;
  const ok = await bcrypt.compare(password, u.password);
  if (!ok) return null;
  return toPublic(u);
};

export const listUsers = async ({ q, limit = 50, offset = 0 } = {}) => {
  const where = q
    ? {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        profileImageUrl: true,
        location: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: Number(limit),
      skip: Number(offset),
    }),
    prisma.user.count({ where }),
  ]);

  return {
    total,
    limit: Number(limit),
    offset: Number(offset),
    users: rows.map(toPublic),
  };
};

/* -------------------- “Me” refers to the user logged in  /api/users/me* -------------------- */

export const getMe = async (id) => getUserById(id);

export const updateMe = async (
  id,
  { username, profile_image_url, location }
) => {
  try {
    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...(username !== undefined ? { username } : {}),
        ...(profile_image_url !== undefined
          ? { profileImageUrl: profile_image_url }
          : {}),
        ...(location !== undefined ? { location } : {}),
      },
      select: {
        id: true,
        username: true,
        profileImageUrl: true,
        location: true,
        createdAt: true,
      },
    });
    return toPublic(updated);
  } catch (e) {
    if (e?.code === 'P2002') {
      e.status = 409;
      e.message = 'Username already taken';
    }
    throw e;
  }
};

export const changeMyPassword = async (id, old_password, new_password) => {
  const u = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!u) {
    const e = new Error('User not found');
    e.status = 404;
    throw e;
  }
  const ok = await bcrypt.compare(old_password, u.password);
  if (!ok) {
    const e = new Error('Old password is incorrect');
    e.status = 400;
    throw e;
  }
  const hashed = await bcrypt.hash(new_password, 10);
  await prisma.user.update({ where: { id: u.id }, data: { password: hashed } });
};

/* -------------------- My Products & Activity -------------------- */

export const listMyPosts = async (
  id,
  { status, limit = 20, offset = 0 } = {}
) => {
  const where = { authorId: Number(id), ...(status ? { status } : {}) };
  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: Number(limit),
      skip: Number(offset),
      include: { items: true, _count: { select: { responses: true } } },
    }),
    prisma.post.count({ where }),
  ]);
  return { total, limit: Number(limit), offset: Number(offset), posts: rows };
};

export const getMyActivity = async (id, { limit = 20, offset = 0 } = {}) => {
  const userId = Number(id);
  const lim = Math.min(100, Math.max(1, Number(limit) || 20));
  const off = Math.max(0, Number(offset) || 0);

  const [myNewPosts, responsesOnMyPosts, myResponses, myTrades] =
    await Promise.all([
      prisma.post.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: lim,
        skip: off,
        select: { id: true, title: true, createdAt: true },
      }),
      prisma.response.findMany({
        where: { post: { authorId: userId } }, // others → my posts
        orderBy: { createdAt: 'desc' },
        take: lim,
        skip: off,
        include: {
          author: { select: { username: true } },
          post: { select: { title: true } },
        },
      }),
      prisma.response.findMany({
        where: { authorId: userId }, // my responses
        orderBy: { createdAt: 'desc' },
        take: lim,
        skip: off,
        include: { post: { select: { title: true } } },
      }),
      prisma.trade.findMany({
        where: {
          OR: [
            { post: { authorId: userId } },
            { response: { authorId: userId } },
          ],
        },
        orderBy: { agreedAt: 'desc' },
        take: lim,
        skip: off,
        include: { post: { select: { title: true } }, response: true },
      }),
    ]);

  const items = [
    ...myNewPosts.map((p) => ({
      type: 'post_created',
      at: p.createdAt,
      post_id: p.id,
      title: p.title,
    })),
    ...responsesOnMyPosts.map((r) => ({
      type: 'response_on_my_post',
      at: r.createdAt,
      post_title: r.post.title,
      from: r.author.username,
      response_id: r.id,
    })),
    ...myResponses.map((r) => ({
      type: 'my_response',
      at: r.createdAt,
      post_title: r.post.title,
      response_id: r.id,
    })),
    ...myTrades.map((t) => ({
      type: 'trade',
      at: t.agreedAt,
      status: t.status,
      post_title: t.post.title,
      trade_id: t.id,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, lim);

  return { items, limit: lim, offset: off };
};
