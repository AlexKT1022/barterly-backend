import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createUsers = async () => {
  await prisma.user.createMany({
    data: [
      {
        first_name: 'Alice',
        last_name: 'Anderson',
        username: 'alice123',
        password: 'password1',
        profileImageUrl:
          'https://i.pinimg.com/736x/08/af/17/08af176fb062281fc1e44a1635d62e13.jpg',
        location: 'New York',
        bio: 'Musician and trader.',
      },
      {
        first_name: 'Bob',
        last_name: 'Baker',
        username: 'bob456',
        password: 'password2',
        profileImageUrl:
          'https://i.pinimg.com/1200x/4b/f0/76/4bf0769cf5d98ce71311fdd83bed94c1.jpg',
        location: 'Los Angeles',
        bio: 'Collector of electronics.',
      },
      {
        first_name: 'Charlie',
        last_name: 'Chapman',
        username: 'charlie789',
        password: 'password3',
        profileImageUrl:
          'https://preview.redd.it/the-original-image-of-the-monkey-thinking-meme-v0-ea1hkdjnx9af1.jpeg?width=640&crop=smart&auto=webp&s=a2441b38e0de398d58f2fea15cf7c8e14f9d93b2',
        location: 'Chicago',
        bio: 'Photographer and hobbyist.',
      },
      {
        first_name: 'Dana',
        last_name: 'Diaz',
        username: 'dana101',
        password: 'password4',
        profileImageUrl:
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRB9HqlHjtBP56SMXewHXXjDRjYoDYZcNfckQ&s',
        location: 'San Francisco',
        bio: 'Vintage furniture enthusiast.',
      },
      {
        first_name: 'Ethan',
        last_name: 'Evans',
        username: 'ethan202',
        password: 'password5',
        profileImageUrl:
          'https://i.kym-cdn.com/entries/icons/facebook/000/042/635/xddtree.jpg',
        location: 'Seattle',
        bio: 'Gamer and PC builder.',
      },
    ],
    skipDuplicates: true,
  });

  return prisma.user.findMany();
};

const createPosts = async (users) => {
  const posts = [];
  const post1 = await prisma.post.create({
    data: {
      authorId: users.find((user) => user.username === 'alice123').id,
      title: 'Vintage Guitar for Trade',
      description: 'Looking to trade my vintage acoustic guitar.',
      items: {
        create: [
          {
            name: 'Vintage Acoustic Guitar',
            description: '70s era, warm sound.',
            condition: 'Used - Good',
            imageUrl: 'https://example.com/guitar.png',
            quantity: 1,
          },
        ],
      },
    },
    include: { items: true },
  });

  posts.push(post1);

  const post2 = await prisma.post.create({
    data: {
      authorId: users.find((user) => user.username === 'bob456').id,
      title: 'Gaming Laptop Available',
      description: 'High-end gaming laptop, open to trade offers.',
      items: {
        create: [
          {
            name: 'Gaming Laptop',
            description: 'RTX 3080, 16GB RAM',
            condition: 'Like New',
            imageUrl: 'https://example.com/laptop.png',
            quantity: 1,
          },
        ],
      },
    },
    include: { items: true },
  });
  posts.push(post2);

  const post3 = await prisma.post.create({
    data: {
      authorId: users.find((user) => user.username === 'charlie789').id,
      title: 'Camera Lenses for Trade',
      description: 'Selling/trading a set of DSLR lenses.',
      items: {
        create: [
          {
            name: 'Canon 50mm Lens',
            condition: 'Used - Excellent',
            imageUrl: 'https://example.com/lens.png',
            quantity: 1,
          },
          {
            name: 'Canon 24-70mm Lens',
            condition: 'Used - Good',
            imageUrl: 'https://example.com/lens2.png',
            quantity: 1,
          },
        ],
      },
    },
    include: { items: true },
  });
  posts.push(post3);

  const post4 = await prisma.post.create({
    data: {
      authorId: users.find((user) => user.username === 'dana101').id,
      title: 'Antique Chair Set',
      description: 'Set of 4 antique wooden chairs in great condition.',
      items: {
        create: [
          {
            name: 'Antique Wooden Chair',
            description: 'Solid oak, carved design.',
            condition: 'Used - Good',
            imageUrl: 'https://example.com/chair.png',
            quantity: 4,
          },
        ],
      },
    },
    include: { items: true },
  });
  posts.push(post4);

  return posts;
};

const createResponses = async (posts, users) => {
  const responses = [];

  const response1 = await prisma.response.create({
    data: {
      postId: posts.find((post) => post.title.includes('Guitar')).id,
      authorId: users.find((user) => user.username === 'bob456').id,
      message: 'Would you accept this DJ mixer for the guitar?',
      items: {
        create: [
          {
            name: 'DJ Mixer',
            description: 'Professional mixer, barely used.',
            condition: 'Like New',
            imageUrl: 'https://example.com/mixer.png',
            quantity: 1,
          },
        ],
      },
    },
    include: { items: true },
  });
  responses.push(response1);

  const response2 = await prisma.response.create({
    data: {
      postId: posts.find((post) => post.title.includes('Laptop')).id,
      authorId: users.find((user) => user.username === 'charlie789').id,
      message: 'I have a DSLR camera available for trade.',
      items: {
        create: [
          {
            name: 'DSLR Camera',
            description: 'Canon EOS with two lenses.',
            condition: 'Used - Good',
            imageUrl: 'https://example.com/camera.png',
            quantity: 1,
          },
        ],
      },
    },
    include: { items: true },
  });
  responses.push(response2);

  const response3 = await prisma.response.create({
    data: {
      postId: posts.find((post) => post.title.includes('Chair')).id,
      authorId: users.find((user) => user.username === 'ethan202').id,
      message: 'Would you trade for a mechanical keyboard?',
      items: {
        create: [
          {
            name: 'Mechanical Keyboard',
            description: 'RGB backlight, blue switches.',
            condition: 'Like New',
            imageUrl: 'https://example.com/keyboard.png',
            quantity: 1,
          },
        ],
      },
    },
    include: { items: true },
  });
  responses.push(response3);

  return responses;
};

const createTrades = async (posts, responses) => {
  const trades = [];

  const trade1 = await prisma.trade.create({
    data: {
      postId: posts.find((post) => post.title.includes('Guitar')).id,
      responseId: responses.find((response) =>
        response.message.includes('DJ mixer')
      ).id,
      agreedAt: new Date(),
      status: 'completed',
    },
  });
  trades.push(trade1);

  const trade2 = await prisma.trade.create({
    data: {
      postId: posts.find((post) => post.title.includes('Laptop')).id,
      responseId: responses.find((response) =>
        response.message.includes('DSLR')
      ).id,
      agreedAt: new Date(),
      status: 'completed',
    },
  });
  trades.push(trade2);

  return trades;
};

const createReviews = async (trades, posts, responses) => {
  for (const trade of trades) {
    const post = posts.find((post) => post.id === trade.postId);
    const response = responses.find(
      (response) => response.id === trade.responseId
    );

    if (post && response) {
      await prisma.review.createMany({
        data: [
          {
            reviewerId: post.authorId,
            revieweeId: response.authorId,
            tradeId: trade.id,
          },
          {
            reviewerId: response.authorId,
            revieweeId: post.authorId,
            tradeId: trade.id,
          },
        ],
        skipDuplicates: true,
      });
    }
  }
};

const seed = async () => {
  const users = await createUsers();
  const posts = await createPosts(users);
  const responses = await createResponses(posts, users);
  const trades = await createTrades(posts, responses);

  await createReviews(trades, posts, responses);
};

seed()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
