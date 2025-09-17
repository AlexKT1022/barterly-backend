import {
  createPostWithItems as createPostWithItemsQuery,
  deletePostByOwner as deletePostByOwnerQuery,
  getPostById as getPostByIdQuery,
  listPosts as listPostsQuery,
  updatePostByOwner as updatePostByOwnerQuery,
} from '#db/queries/postQueries';

export const getPosts = async (req, res, next) => {
  try {
    const rows = await listPostsQuery(req.query);

    res.send(rows);
  } catch (e) {
    next(e);
  }
};

export const getPostById = async (req, res, next) => {
  try {
    const post = await getPostByIdQuery(Number(req.params.id));
    if (!post) return res.status(404).send('Post not found');

    res.send(post);
  } catch (e) {
    next(e);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { title, description = '', items } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).send('items array required');

    const post = await createPostWithItemsQuery({
      userId: req.user.id,
      title,
      description,
      items,
    });

    res.status(201).send(post);
  } catch (e) {
    next(e);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const updated = await updatePostByOwnerQuery({
      id: Number(req.params.id),
      ownerId: req.user.id,
      fields: req.body,
    });

    res.send(updated);
  } catch (e) {
    next(e);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    await deletePostByOwnerQuery({
      id: Number(req.params.id),
      ownerId: req.user.id,
    });

    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
