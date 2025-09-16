import prisma from '#db/client';

export const createPost = async (data) => {
  await prisma.post.create();
};
