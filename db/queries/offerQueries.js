// /db/queries/offerQueries.js
import prisma from '#lib/prisma';

// I created this because of the issue we were having with postman, prisma doesnt like undefined at all
const normalizeOfferItems = (items = []) =>
  (Array.isArray(items) ? items : [])
    .filter(it => it && typeof it.name === 'string' && it.name.trim().length > 0) // require name
    .map(it => ({
      name: String(it.name).trim(),
      description: it.description ?? null,
      // Default condition so Prisma doesn't error if schema requires it
      condition: it.condition ?? 'unspecified',
      imageUrl: it.image_url ?? null,   // client sends image_url; DB field is imageUrl
      quantity: Number.isFinite(it.quantity) ? Number(it.quantity) : 1,
    }));

const toPublicOffer = (r) => ({
  id: r.id,
  post_id: r.postId,
  user_id: r.authorId,
  child_post_id: r.childPostId ?? null,
  message: r.message,
  status: r.status,                 // 'pending' | 'accepted' | 'rejected'
  created_at: r.createdAt,
  author: r.author ? { id: r.author.id, username: r.author.username } : undefined,
  post:   r.post   ? { id: r.post.id, title: r.post.title, author_id: r.post.authorId } : undefined,
  child_post: r.childPost ? { id: r.childPost.id, title: r.childPost.title, author_id: r.childPost.authorId } : undefined,
});

/** List offers with optional filters */
export const listOffers = async ({
  post_id,
  user_id,
  status,
  child_post_id,
  limit = 20,
  offset = 0,
} = {}) => {
  const where = {
    ...(post_id ? { postId: Number(post_id) } : {}),
    ...(user_id ? { authorId: Number(user_id) } : {}),
    ...(status ? { status } : {}),
    ...(child_post_id ? { childPostId: Number(child_post_id) } : {}),
  };

  const take = Math.max(1, Math.min(100, Number(limit)));
  const skip = Math.max(0, Number(offset) || 0);

  const [rows, total] = await Promise.all([
    prisma.response.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      skip,
      include: {
        author:    { select: { id: true, username: true } },
        post:      { select: { id: true, title: true, authorId: true } },
        childPost: { select: { id: true, title: true, authorId: true } },
      },
    }),
    prisma.response.count({ where }),
  ]);

  return { total, limit: take, offset: skip, offers: rows.map(toPublicOffer) };
};

/** Get single offer by id */
export const getOfferById = async (id) => {
  const r = await prisma.response.findUnique({
    where: { id: Number(id) },
    include: {
      author:    { select: { id: true, username: true } },
      post:      { select: { id: true, title: true, authorId: true } },
      childPost: { select: { id: true, title: true, authorId: true } },
    },
  });
  return r ? toPublicOffer(r) : null;
};

/** Create an offer (no items) with optional child_post_id */
export const createOffer = async ({
  post_id,
  user_id,
  message = '',
  child_post_id, // optional
}) => {
  // make sure parent post exists & is open
  const parent = await prisma.post.findUnique({
    where: { id: Number(post_id) },
    select: { id: true, authorId: true, status: true },
  });
  if (!parent) { const e = new Error('Post not found'); e.status = 404; throw e; }
  if (parent.status === 'closed' || parent.status === 'traded') {
    const e = new Error('Post is not open for offers'); e.status = 400; throw e;
  }

  // if child_post_id provided, make sure it exists and belongs to the offering user
  let childData = {};
  if (child_post_id != null) {
    const child = await prisma.post.findUnique({
      where: { id: Number(child_post_id) },
      select: { id: true, authorId: true },
    });
    if (!child) { const e = new Error('child_post_id not found'); e.status = 404; throw e; }
    if (child.authorId !== Number(user_id)) {
      const e = new Error('child_post_id must belong to the offering user'); e.status = 403; throw e;
    }
    if (child.id === parent.id) {
      const e = new Error('child_post_id cannot equal post_id'); e.status = 400; throw e;
    }
    childData = { childPostId: child.id };
  }

  const created = await prisma.response.create({
    data: {
      postId: Number(post_id),
      authorId: Number(user_id),
      message,
      status: 'pending',
      ...childData,
    },
    include: {
      author:    { select: { id: true, username: true } },
      post:      { select: { id: true, title: true, authorId: true } },
      childPost: { select: { id: true, title: true, authorId: true } },
    },
  });

  return toPublicOffer(created);
};

/** Update your own offer’s message and/or child_post_id (pending only) */
export const updateMyOffer = async ({
  offer_id,
  user_id,
  message,
  child_post_id,
}) => {
  const current = await prisma.response.findUnique({
    where: { id: Number(offer_id) },
    select: { id: true, authorId: true, status: true },
  });
  if (!current) { const e = new Error('Offer not found'); e.status = 404; throw e; }
  if (current.authorId !== Number(user_id)) { const e = new Error('Not your offer'); e.status = 403; throw e; }
  if (current.status !== 'pending') { const e = new Error('Only pending offers can be edited'); e.status = 400; throw e; }

  const data = {};
  if (message !== undefined) data.message = message;

  if (child_post_id !== undefined) {
    if (child_post_id === null) {
      data.childPostId = null; // allow clearing the link
    } else {
      const child = await prisma.post.findUnique({
        where: { id: Number(child_post_id) },
        select: { id: true, authorId: true },
      });
      if (!child) { const e = new Error('child_post_id not found'); e.status = 404; throw e; }
      if (child.authorId !== Number(user_id)) {
        const e = new Error('child_post_id must belong to the offering user'); e.status = 403; throw e;
      }
      data.childPostId = child.id;
    }
  }

  const updated = await prisma.response.update({
    where: { id: Number(offer_id) },
    data,
    include: {
      author:    { select: { id: true, username: true } },
      post:      { select: { id: true, title: true, authorId: true } },
      childPost: { select: { id: true, title: true, authorId: true } },
    },
  });

  return toPublicOffer(updated);
};

/** Accept an offer (post owner only) → accept this, reject others, create trade, close post. I didnt change anything below here as I dont think any changes are needed for no items.  */

export const acceptOffer = async ({ offer_id, acting_user_id }) => {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.response.findUnique({
      where: { id: Number(offer_id) },
      include: {
        post: { select: { id: true, authorId: true, status: true } },   // parent post
        childPost: { select: { id: true, status: true } },               // (This might be null)
      },
    });

    if (!offer) {
      const e = new Error('Offer not found'); e.status = 404; throw e;
    }
    if (offer.post.authorId !== Number(acting_user_id)) {
      const e = new Error('Only the post owner can accept an offer'); e.status = 403; throw e;
    }
    if (offer.status !== 'pending') {
      const e = new Error('Only pending offers can be accepted'); e.status = 400; throw e;
    }

    const now = new Date();

    // 1) Mark this offer accepted
    await tx.response.update({
      where: { id: offer.id },
      data: { status: 'accepted' },
    });

    // 2) Reject any other pending offers on the parent post
    await tx.response.updateMany({
      where: { postId: offer.post.id, id: { not: offer.id }, status: 'pending' },
      data: { status: 'rejected' },
    });

    // 3) Create the trade record
    const trade = await tx.trade.create({
      data: {
        postId: offer.post.id,
        responseId: offer.id,
        agreedAt: now,
        status: 'completed',
      },
    });

    // 4) Close the parent post
    await tx.post.update({
      where: { id: offer.post.id },
      data: { status: 'traded', updatedAt: now },
    });

    // 5) If this offer referenced a child post
    if (offer.childPost?.id) {
      await tx.post.update({
        where: { id: offer.childPost.id },
        data: { status: 'traded', updatedAt: now },
      });

      // OPTIONAL: This should close out any other offers that were made on the post if trade is accepted. 
      await tx.response.updateMany({
        where: { postId: offer.childPost.id, status: 'pending' },
        data: { status: 'rejected' },
      });
    }

    return trade;
  });
};

/** Reject an offer (post owner only) */
export const rejectOffer = async ({ offer_id, acting_user_id }) => {
  const offer = await prisma.response.findUnique({
    where: { id: Number(offer_id) },
    include: { post: { select: { id: true, authorId: true } } },
  });
  if (!offer) { const e = new Error('Offer not found'); e.status = 404; throw e; }
  if (offer.post.authorId !== Number(acting_user_id)) {
    const e = new Error('Only the post owner can reject an offer'); e.status = 403; throw e;
  }
  if (offer.status !== 'pending') {
    const e = new Error('Only pending offers can be rejected'); e.status = 400; throw e;
  }

  const updated = await prisma.response.update({
    where: { id: Number(offer_id) },
    data: { status: 'rejected' },
    include: {
      items: true,
      author: { select: { id: true, username: true } },
      post:   { select: { id: true, title: true, authorId: true } },
      childPost: { select: { id: true, title: true, authorId: true } }, // <-- NEW code, if something breaks
    },
  });

  return toPublicOffer(updated);
};
