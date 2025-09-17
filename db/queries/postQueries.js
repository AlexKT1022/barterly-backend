import client from '#db/client';

export const getPosts = async () => {
  const posts = await client.posts();

  console.log(posts);

  return posts;
};

export const getPostById = (postId) => {};
