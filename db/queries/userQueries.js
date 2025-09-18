// /db/queries/userQueries.js
import prisma from '#db/client';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const toPublicUser = (u) => ({
  id: u.id,
  username: u.username,
  profile_image_url: u.profileImageUrl,
  location: u.location,
  created_at: u.createdAt,
});

export const createUser = async (
  username,
  password,
  profileImageUrl = null,
  location = null
) => {
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        password: hashed, // stored in 'password' column
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

    return toPublicUser(user);
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
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      username: true,
      profileImageUrl: true,
      location: true,
      createdAt: true,
    },
  });
  return user ? toPublicUser(user) : null;
};

export const getUserByCredentials = async (username, password) => {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  return toPublicUser(user);
};
