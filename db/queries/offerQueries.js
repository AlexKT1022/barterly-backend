// /db/queries/offerQueries.js
import prisma from '#db/client';

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
  message: r.message,
  status: r.status, // 'pending' | 'accepted' | 'rejected'
  created_at: r.createdAt,
  child_post_id: r.childPostId ?? null, // <-- NEW code, if something breaks
  author: r.author ? { id: r.author.id, username: r.author.username } : undefined,
  post:   r.post   ? { id: r.post.id, title: r.post.title, author_id: r.post.authorId ?? r.post.posted_by } : undefined,
  child_post: r.childPost
    ? { id: r.childPost.id, title: r.childPost.title, author_id: r.childPost.authorId }
    : undefined, // <-- NEW
  items: (r.items ?? []).map(it => ({
    id: it.id,
    name: it.name,
    description: it.description,
    condition: it.condition,
    image_url: it.imageUrl,
    quantity: it.quantity,
  })),
});

/* ---------- queries ---------- */

/** List offers for a post or by a user (any combination) */
export const listOffers = async ({
  post_id,
  user_id,
  status,
  limit = 20,
  offset = 0,
} = {}) => {
  const where = {
    ...(post_id ? { postId: Number(post_id) } : {}),
    ...(user_id ? { authorId: Number(user_id) } : {}),
    ...(status ? { status } : {}),
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
        items: true,
        author: { select: { id: true, username: true } },
        post:   { select: { id: true, title: true, authorId: true } },
        childPost: { select: { id: true, title: true, authorId: true } }, // <-- NEW code, if something breaks
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
      items: true,
      author: { select: { id: true, username: true } },
      post:   { select: { id: true, title: true, authorId: true } },
      childPost: { select: { id: true, title: true, authorId: true } }, // <-- NEW
    },
  });
  return r ? toPublicOffer(r) : null;
};

/** Create an offer (response) with its items */
export const createOfferWithItems = async ({
  post_id,
  user_id,
  message = '',
  items = [], // [{name, description?, condition?, image_url?, quantity?}, ...]
  child_post_id, // <-- NEW (optional)
}) => {
  // ensure parent post exists & is open
  const post = await prisma.post.findUnique({
    where: { id: Number(post_id) },
    select: { id: true, authorId: true, status: true },
  });
  if (!post) { const e = new Error('Post not found'); e.status = 404; throw e; }
  if (post.status === 'closed' || post.status === 'traded') {
    const e = new Error('Post is not open for offers'); e.status = 400; throw e;
  }

  // if provided, ensure child post exists
  if (child_post_id != null) {
    const child = await prisma.post.findUnique({
      where: { id: Number(child_post_id) },
      select: { id: true },
    });
    if (!child) { const e = new Error('child_post_id does not reference an existing post'); e.status = 400; throw e; }
  }

  const created = await prisma.response.create({
    data: {
      postId: Number(post_id),
      authorId: Number(user_id),
      message,
      status: 'pending',
      childPostId: child_post_id != null ? Number(child_post_id) : undefined, // <-- NEW code, if something breaks
      items: { create: normalizeOfferItems(items) },
    },
    include: {
      items: true,
      author: { select: { id: true, username: true } },
      post:   { select: { id: true, title: true, authorId: true } },
      childPost: { select: { id: true, title: true, authorId: true } }, // <-- NEW code, if something breaks
    },
  });

  return toPublicOffer(created);
};

/** Update your own offer's message */
export const updateMyOffer = async ({
  offer_id,
  user_id,
  message,
  items,          // optional: full replacement array
  child_post_id,  // <-- NEW (optional; pass null to clear)
}) => {
  const current = await prisma.response.findUnique({
    where: { id: Number(offer_id) },
    select: { id: true, authorId: true, status: true },
  });
  if (!current) { const e = new Error('Offer not found'); e.status = 404; throw e; }
  if (current.authorId !== Number(user_id)) { const e = new Error('Not your offer'); e.status = 403; throw e; }
  if (current.status !== 'pending') { const e = new Error('Only pending offers can be edited'); e.status = 400; throw e; }

  // validate child_post_id if provided (null allowed to clear)
  if (child_post_id !== undefined && child_post_id !== null) {
    const child = await prisma.post.findUnique({
      where: { id: Number(child_post_id) },
      select: { id: true },
    });
    if (!child) { const e = new Error('child_post_id does not reference an existing post'); e.status = 400; throw e; }
  }

  // If items is provided, we replace them
  if (Array.isArray(items)) {
    const normalized = normalizeOfferItems(items);
    await prisma.$transaction([
      prisma.responseItem.deleteMany({ where: { responseId: Number(offer_id) } }),
      ...(normalized.length
        ? [prisma.responseItem.createMany({
            data: normalized.map(it => ({ ...it, responseId: Number(offer_id) })),
          })]
        : []),
    ]);
  }

  const updated = await prisma.response.update({
    where: { id: Number(offer_id) },
    data: {
      ...(message !== undefined ? { message } : {}),
      ...(child_post_id !== undefined
        ? { childPostId: child_post_id === null ? null : Number(child_post_id) }
        : {}),
    },
    include: {
      items: true,
      author: { select: { id: true, username: true } },
      post:   { select: { id: true, title: true, authorId: true } },
      childPost: { select: { id: true, title: true, authorId: true } }, // <-- NEW code, if something breaks
    },
  });

  return toPublicOffer(updated);
};

/** Accept an offer (post owner only) → accept this, reject others, create trade, close post */
export const acceptOffer = async ({ offer_id, acting_user_id }) => {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.response.findUnique({
      where: { id: Number(offer_id) },
      include: { post: { select: { id: true, authorId: true, status: true } } },
    });
    if (!offer) { const e = new Error('Offer not found'); e.status = 404; throw e; }
    if (offer.post.authorId !== Number(acting_user_id)) {
      const e = new Error('Only the post owner can accept an offer'); e.status = 403; throw e;
    }
    if (offer.status !== 'pending') {
      const e = new Error('Only pending offers can be accepted'); e.status = 400; throw e;
    }

    await tx.response.update({ where: { id: offer.id }, data: { status: 'accepted' } });
    await tx.response.updateMany({
      where: { postId: offer.post.id, id: { not: offer.id }, status: 'pending' },
      data: { status: 'rejected' },
    });

    const trade = await tx.trade.create({
      data: { postId: offer.post.id, responseId: offer.id, agreedAt: new Date(), status: 'completed' },
    });

    await tx.post.update({
      where: { id: offer.post.id },
      data: { status: 'traded', updatedAt: new Date() },
    });

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
