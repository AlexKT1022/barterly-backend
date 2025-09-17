import {
  getPostById as getPostByIdQuery,
  getPosts as getPostsQuery,
} from '#db/queries/postQueries';

export const getPosts = async (req, res) => {
  const posts = await getPostsQuery();

  res.send(posts);
};

export const getPostById = async (req, res) => {
  const id = Number(req.params.id);
  const post = await getPostByIdQuery(id);

  res.send(post);
};
