// /db/queries/offerQueries.js
import prisma from '#db/client.js';

const toPublicOffer = (r) => ({
  id: r.id,
  post_id: r.postId,
  user_id: r.authorId,
  message: r.message,
  status: r.status,                 // 'pending' | 'accepted' | 'rejected'
  created_at: r.createdAt,
  author: r.author ? { id: r.author.id, username: r.author.username } : undefined,
  post:   r.post   ? { id: r.post.id, title: r.post.title, author_id: r.post.authorId ?? r.post.posted_by } : undefined,
  items: (r.items ?? []).map(it => ({
    id: it.id,
    name: it.name,
    description: it.description,
    condition: it.condition,
    image_url: it.imageUrl,
    quantity: it.quantity,
  })),
});

/** List offers for a post or by a user (any combination); */
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
}) => {
  // optional: ensure post exists
  const post = await prisma.post.findUnique({
    where: { id: Number(post_id) },
    select: { id: true, authorId: true, status: true },
  });
  if (!post) {
    const e = new Error('Post not found');
    e.status = 404; throw e;
  }
  if (post.status === 'closed' || post.status === 'traded') {
    const e = new Error('Post is not open for offers');
    e.status = 400; throw e;
  }

  const created = await prisma.response.create({
    data: {
      postId: Number(post_id),
      authorId: Number(user_id),
      message,
      status: 'pending',
      items: {
        create: (items || []).map(it => ({
          name: it.name,
          description: it.description ?? null,
          condition: it.condition ?? null,
          imageUrl: it.image_url ?? null,
          quantity: it.quantity ?? 1,
        })),
      },
    },
    include: {
      items: true,
      author: { select: { id: true, username: true } },
      post:   { select: { id: true, title: true, authorId: true } },
    },
  });

  return toPublicOffer(created);
};

/** Update your own offer's message (and optionally replace items) */
export const updateMyOffer = async ({
  offer_id,
  user_id,
  message,
  items, // optional: full replacement array
}) => {
  const current = await prisma.response.findUnique({
    where: { id: Number(offer_id) },
    select: { id: true, authorId: true, status: true },
  });
  if (!current) {
    const e = new Error('Offer not found'); e.status = 404; throw e;
  }
  if (current.authorId !== Number(user_id)) {
    const e = new Error('Not your offer'); e.status = 403; throw e;
  }
  if (current.status !== 'pending') {
    const e = new Error('Only pending offers can be edited'); e.status = 400; throw e;
  }

  // If items is provided, we replace them
  if (Array.isArray(items)) {
    await prisma.$transaction([
      prisma.responseItem.deleteMany({ where: { responseId: Number(offer_id) } }),
      prisma.responseItem.createMany({
        data: items.map(it => ({
          responseId: Number(offer_id),
          name: it.name,
          description: it.description ?? null,
          condition: it.condition ?? null,
          imageUrl: it.image_url ?? null,
          quantity: it.quantity ?? 1,
        })),
      }),
    ]);
  }

  const updated = await prisma.response.update({
    where: { id: Number(offer_id) },
    data: { ...(message !== undefined ? { message } : {}) },
    include: {
      items: true,
      author: { select: { id: true, username: true } },
      post:   { select: { id: true, title: true, authorId: true } },
    },
  });

  return toPublicOffer(updated);
};

/** Accept an offer (post owner only) → marks offer accepted, others rejected, creates trade, closes post */
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

    // 1) Accept this offer
    await tx.response.update({
      where: { id: offer.id },
      data: { status: 'accepted' },
    });

    // 2) Reject all other offers for the same post that are still pending( We dont have to do this, just wanted to cover all bases whie I was in the code zone
    await tx.response.updateMany({
      where: { postId: offer.post.id, id: { not: offer.id }, status: 'pending' },
      data: { status: 'rejected' },
    });

    // 3) Create trade
    const trade = await tx.trade.create({
      data: {
        postId: offer.post.id,
        responseId: offer.id,
        agreedAt: new Date(),
        status: 'completed',
      },
    });

    // 4) Mark post as traded (or closed)
    await tx.post.update({
      where: { id: offer.post.id },
      data: { status: 'traded', updatedAt: new Date() },
    });

    return trade; // or return the accepted offer; up to your API
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
    },
  });

  return toPublicOffer(updated);
};
