<<<<<<< HEAD
// /db/queries/postQueries.js
import db from '#db/client';

//  List posts with optional filters 
export const listPosts = async ({ status, user_id, q }) => {
  const where = [];
  const params = [];

  if (status) { params.push(status); where.push(`p.status = $${params.length}`); }
  if (user_id) { params.push(Number(user_id)); where.push(`p.user_id = $${params.length}`); }
  if (q) {
    params.push(`%${q}%`);
    where.push(`(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }

  const sql = `
    SELECT p.*, u.username,
           COALESCE(rs.response_count, 0)::int AS response_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS response_count
      FROM responses GROUP BY post_id
    ) rs ON rs.post_id = p.id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY COALESCE(p.updated_at, p.created_at) DESC, p.id DESC
    LIMIT 100;
  `;
  const { rows } = await db.query(sql, params);
  return rows;
};

//  Get a post with items/response status summary
export const getPostById = async (id) => {
  const { rows: postRows } = await db.query(
    `SELECT p.*, u.username, u.profile_image_url 
     FROM posts p JOIN users u ON u.id = p.user_id
     WHERE p.id = $1`,
    [id]
  );
  if (!postRows.length) return null;

  const { rows: items } = await db.query(
    `SELECT id, name, description, condition, image_url, quantity
     FROM post_items WHERE post_id = $1 ORDER BY id`,
    [id]
  );

  const { rows: summary } = await db.query(
    `SELECT status, COUNT(*)::int AS count
     FROM responses WHERE post_id = $1 GROUP BY status`,
    [id]
  );

  return { ...postRows[0], items, responses_summary: summary };
};

//  Create A Post As well as its items
export const createPostWithItems = async ({ userId, title, description = '', items }) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows: pRows } = await client.query(
      `INSERT INTO posts (user_id, title, description, status, created_at, updated_at)
       VALUES ($1,$2,$3,'open',NOW(),NOW())
       RETURNING *`,
      [userId, title, description]
    );
    const post = pRows[0];

    const params = [];
    const vals = [];
    items.forEach((it) => {
      params.push(post.id, it.name, it.description ?? '', it.condition ?? null, it.image_url ?? null, it.quantity ?? 1);
      vals.push(`($${params.length-5},$${params.length-4},$${params.length-3},$${params.length-2},$${params.length-1},$${params.length})`);
    });

    await client.query(
      `INSERT INTO post_items (post_id, name, description, condition, image_url, quantity)
       VALUES ${vals.join(',')}`,
      params
    );

    await client.query('COMMIT');
    return post;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    throw err;
  } finally {
    client.release();
  }
};

// User Updates (This can only be down by the owner)
export const updatePostByOwner = async ({ id, ownerId, fields }) => {
  const { rows: chk } = await db.query(`SELECT user_id FROM posts WHERE id=$1`, [id]);
  if (!chk.length) throw Object.assign(new Error('Post not found'), { status: 404 });
  if (chk[0].user_id !== ownerId) throw Object.assign(new Error('Not your post'), { status: 403 });

  const sets = [];
  const params = [];
  if (fields.title !== undefined) { params.push(fields.title); sets.push(`title=$${params.length}`); }
  if (fields.description !== undefined) { params.push(fields.description); sets.push(`description=$${params.length}`); }
  if (fields.status !== undefined) { params.push(fields.status); sets.push(`status=$${params.length}`); }
  if (!sets.length) throw Object.assign(new Error('No updatable fields'), { status: 400 });

  params.push(id);
  const { rows } = await db.query(
    `UPDATE posts SET ${sets.join(', ')}, updated_at=NOW()
     WHERE id=$${params.length} RETURNING *`,
    params
  );
  return rows[0];
};

// Delete A Post along with Items and Responses
export const deletePostByOwner = async ({ id, ownerId }) => {
  const { rows: chk } = await db.query(`SELECT user_id FROM posts WHERE id=$1`, [id]);
  if (!chk.length) throw Object.assign(new Error('Post not found'), { status: 404 });
  if (chk[0].user_id !== ownerId) throw Object.assign(new Error('Not your post'), { status: 403 });

  await db.query(`DELETE FROM post_items WHERE post_id=$1`, [id]);
  await db.query(`DELETE FROM posts WHERE id=$1`, [id]);
};
=======
import prisma from '#db/client';

export const createPost = async (data) => {
  await prisma.post.create();
};
>>>>>>> beaa17da9e5c0a104183f75210e79eee867a0ffb
