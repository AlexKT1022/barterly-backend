import client from '#db/client';

export const createPost = async (data) => {
  await client;
};

export const getPosts = async () => {
  const posts = await client.post();

  console.log(posts);
};

export const getPostById = (postId) => {};
