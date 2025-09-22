// /db/queries/userQueries.js
import prisma from '#db/client';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const toPublicUser = (u) => ({
  id: u.id,
  username: u.username,
  first_name: u.first_name,
  last_name: u.last_name,
  bio: u.bio,
  profile_image_url: u.profileImageUrl, 
  location: u.location,
  created_at: u.createdAt,
});

// Just for reference. Prisma Error P2002 signifies a "Unique constraint failed" error.
/* -------------------- Auth / basic profile -------------------- */

export const createUser = async ({
  first_name,
  last_name,
  username,
  password,
  bio,
  profile_image_url,
  location,
}) => {
  if (!first_name || !last_name) {
    const e = new Error('first_name and last_name are required');
    e.status = 400; throw e;
  }
  if (!username || !password) {
    const e = new Error('username and password are required');
    e.status = 400; throw e;
  }
  if (password.length < 8) {
    const e = new Error('Password must be at least 8 characters');
    e.status = 400; throw e;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        first_name,
        last_name,
        username: username.trim(),
        password: hashed,
        // let DB defaults apply when undefined
        ...(bio !== undefined ? { bio } : {}),
        ...(location !== undefined ? { location } : {}),
        // prisma field is camelCase, mapped to DB profile_image_url
        profileImageUrl:
          profile_image_url ??
          `https://picsum.photos/seed/${encodeURIComponent(username)}/200/200`,
      },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        bio: true,
        profileImageUrl: true,
        location: true,
        createdAt: true,
      },
    });

    return toPublicUser(user);
  } catch (err) {
    if (err?.code === 'P2002') {
      const e = new Error('Username is already taken');
      e.status = 409; throw e;
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
      first_name: true,
      last_name: true,
      bio: true,
      profileImageUrl: true,
      location: true,
      createdAt: true,
    },
  });
  return u ? toPublicUser(u) : null;
};

export const getUserByCredentials = async (username, password) => {
  const u = await prisma.user.findUnique({ where: { username } });
  if (!u) return null;
  const ok = await bcrypt.compare(password, u.password);
  if (!ok) return null;
  return toPublicUser(u);
};

export const listUsers = async ({ q, limit = 50, offset = 0 } = {}) => {
  const where = q
    ? {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { first_name: { contains: q, mode: 'insensitive' } },
          { last_name: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {};

  const take = Number(limit);
  const skip = Number(offset);

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        bio: true,
        profileImageUrl: true,
        location: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      skip,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    total,
    limit: take,
    offset: skip,
    users: rows.map(toPublicUser),
  };
};

/* -------------------- “Me” refers to the logged-in user (/api/users/me*) -------------------- */

export const getMe = async (id) => getUserById(id);

export const updateMe = async (
  id,
  { username, profile_image_url, location, first_name, last_name, bio }
) => {
  try {
    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...(username !== undefined ? { username } : {}),
        ...(profile_image_url !== undefined ? { profileImageUrl: profile_image_url } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(first_name !== undefined ? { first_name } : {}),
        ...(last_name !== undefined ? { last_name } : {}),
        ...(bio !== undefined ? { bio } : {}),
      },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        bio: true,
        profileImageUrl: true,
        location: true,
        createdAt: true,
      },
    });
    return toPublicUser(updated);
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
    e.status = 404; throw e;
  }
  const ok = await bcrypt.compare(old_password, u.password);
  if (!ok) {
    const e = new Error('Old password is incorrect');
    e.status = 400; throw e;
  }
  if (!new_password || new_password.length < 8) {
    const e = new Error('New password must be at least 8 characters');
    e.status = 400; throw e;
  }
  const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
  await prisma.user.update({ where: { id: u.id }, data: { password: hashed } });
};

/* -------------------- My Posts & Activity -------------------- */

export const listMyPosts = async (
  id,
  { status, limit = 20, offset = 0 } = {}
) => {
  const where = { authorId: Number(id), ...(status ? { status } : {}) };
  const take = Number(limit);
  const skip = Number(offset);

  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take,
      skip,
      include: { items: true, _count: { select: { responses: true } } },
    }),
    prisma.post.count({ where }),
  ]);

  return { total, limit: take, offset: skip, posts: rows };
};

export const getMyActivity = async (id, { limit = 20, offset = 0 } = {}) => {
  const userId = Number(id);
  const lim = Math.min(100, Math.max(1, Number(limit) || 20));
  const off = Math.max(0, Number(offset) || 0);

  const [myNewPosts, responsesOnMyPosts, myResponses, myTrades] = await Promise.all([
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
        OR: [{ post: { authorId: userId } }, { response: { authorId: userId } }],
      },
      orderBy: { agreedAt: 'asc' }, // or 'desc' depending on how you want to see it
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
