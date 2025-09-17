import prisma from '#db/client';

export const getPosts = async () => {
  const posts = await prisma.post.findMany();

  return posts;
};

export const getPostById = async (postId) => {
  const posts = await prisma.post.findFirst({ where: { id: postId } });

  return posts;
};
