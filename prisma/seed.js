import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const generateUsers = async () => {
  await prisma.user.createMany({
    data: [
      {
        first_name: 'Alice',
        last_name: 'Anderson',
        username: 'alice123',
        password: 'password1',
        profileImageUrl: faker.image.avatar(),
        location: 'New York',
        bio: 'Musician and trader.',
      },
      {
        first_name: 'Bob',
        last_name: 'Baker',
        username: 'bob456',
        password: 'password2',
        profileImageUrl: faker.image.avatar(),
        location: 'Los Angeles',
        bio: 'Collector of electronics.',
      },
      {
        first_name: 'Charlie',
        last_name: 'Chapman',
        username: 'charlie789',
        password: 'password3',
        profileImageUrl: faker.image.avatar(),
        location: 'Chicago',
        bio: 'Photographer and hobbyist.',
      },
      {
        first_name: 'Dana',
        last_name: 'Diaz',
        username: 'dana101',
        password: 'password4',
        profileImageUrl: faker.image.avatar(),
        location: 'San Francisco',
        bio: 'Vintage furniture enthusiast.',
      },
      {
        first_name: 'Ethan',
        last_name: 'Evans',
        username: 'ethan202',
        password: 'password5',
        profileImageUrl: faker.image.avatar(),
        location: 'Seattle',
        bio: 'Gamer and PC builder.',
      },
      {
        first_name: 'Fiona',
        last_name: 'Foster',
        username: 'fiona303',
        password: 'password6',
        profileImageUrl: faker.image.avatar(),
        location: 'Austin',
        bio: 'Loves handmade crafts and local art.',
      },
      {
        first_name: 'George',
        last_name: 'Geller',
        username: 'george404',
        password: 'password7',
        profileImageUrl: faker.image.avatar(),
        location: 'Miami',
        bio: 'Sports memorabilia collector.',
      },
    ],
    skipDuplicates: true,
  });

  return prisma.user.findMany();
};

const generateCategories = async () => {
  const categories = [
    { name: 'Electronics', icon: `<FaTv />` },
    { name: 'Clothing', icon: `<FaTshirt />` },
    { name: 'Books', icon: `<FaBook />` },
    { name: 'Home & Garden', icon: `<FaHome />` },
    { name: 'Sports', icon: `<FaFootballBall />` },
    { name: 'Automotive', icon: `<FaCar />` },
    { name: 'Toys & Games', icon: `<FaGamepad />` },
    { name: 'Jewelry & Accessories', icon: `<FaRegGem />` },
    { name: 'Office Supplies', icon: `<FaPencilRuler />` },
    { name: 'Pet Supplies', icon: `<FaCat />` },
    { name: 'Baby Products', icon: `<FaBabyCarriage />` },
    { name: 'Music & Instruments', icon: `<FaGuitar />` },
    { name: 'Art & Craft Supplies', icon: `<FaPaintBrush /> ` },
    { name: 'Tools & Hardware', icon: `<FaWrench />` },
    { name: 'Furniture', icon: `<FaCouch /> ` },
    { name: 'Services', icon: `<FaPeopleCarry />` },
  ];

  await prisma.category.createMany({
    data: categories.map((category) => {
      return { name: category.name };
    }),
  });

  return prisma.category.findMany();
};

const generatePosts = async (users) => {
  const entries = [
    {
      author: 'alice123',
      title: 'Vintage Guitar for Trade',
      description: 'Looking to trade my vintage acoustic guitar.',
      items: [
        {
          name: 'Vintage Acoustic Guitar',
          description: '70s era, warm sound.',
          condition: 'Used - Good',
          imageUrl: faker.image.url(),
          quantity: 1,
        },
      ],
    },
    {
      author: 'bob456',
      title: 'Gaming Laptop Available',
      description: 'High-end gaming laptop, open to trade offers.',
      items: [
        {
          name: 'Gaming Laptop',
          description: 'RTX 3080, 16GB RAM',
          condition: 'Like New',
          imageUrl: faker.image.url(),
          quantity: 1,
        },
      ],
    },
    {
      author: 'charlie789',
      title: 'Camera Lenses for Trade',
      description: 'Selling/trading a set of DSLR lenses.',
      items: [
        {
          name: 'Canon 50mm Lens',
          condition: 'Used - Excellent',
          imageUrl: faker.image.url(),
          quantity: 1,
        },
        {
          name: 'Canon 24-70mm Lens',
          condition: 'Used - Good',
          imageUrl: faker.image.url(),
          quantity: 1,
        },
      ],
    },
    {
      author: 'dana101',
      title: 'Antique Chair Set',
      description: 'Set of 4 antique wooden chairs in great condition.',
      items: [
        {
          name: 'Antique Wooden Chair',
          description: 'Solid oak, carved design.',
          condition: 'Used - Good',
          imageUrl: faker.image.url(),
          quantity: 4,
        },
      ],
    },
    {
      author: 'fiona303',
      title: 'Handmade Pottery Set',
      description: 'Beautiful handmade ceramic mugs and bowls.',
      items: [
        {
          name: 'Pottery Mug',
          condition: 'New',
          imageUrl: faker.image.url(),
          quantity: 4,
        },
        {
          name: 'Pottery Bowl',
          condition: 'New',
          imageUrl: faker.image.url(),
          quantity: 2,
        },
      ],
    },
  ];

  const posts = [];

  for (const entry of entries) {
    const authorId = users.find((u) => u.username === entry.author).id;
    const post = await prisma.post.create({
      data: {
        authorId,
        title: entry.title,
        description: entry.description,
        categoryId: Math.floor(Math.random() * 16) + 1,
        items: { create: entry.items },
      },
      include: { items: true },
    });

    posts.push(post);
  }

  return posts;
};

const generateResponses = async (posts, users) => {
  const replies = [
    {
      post: 'Guitar',
      author: 'bob456',
      message: 'Would you accept this DJ mixer for the guitar?',
      items: [
        {
          name: 'DJ Mixer',
          description: 'Professional mixer, barely used.',
          condition: 'Like New',
          imageUrl: faker.image.url(),
          quantity: 1,
        },
      ],
    },
    {
      post: 'Laptop',
      author: 'charlie789',
      message: 'I have a DSLR camera available for trade.',
      items: [
        {
          name: 'DSLR Camera',
          description: 'Canon EOS with two lenses.',
          condition: 'Used - Good',
          imageUrl: faker.image.url(),
          quantity: 1,
        },
      ],
    },
    {
      post: 'Chair',
      author: 'ethan202',
      message: 'Would you trade for a mechanical keyboard?',
      items: [
        {
          name: 'Mechanical Keyboard',
          description: 'RGB backlight, blue switches.',
          condition: 'Like New',
          imageUrl: faker.image.url(),
          quantity: 1,
        },
      ],
    },
    {
      post: 'Pottery',
      author: 'george404',
      message: 'I can offer a signed football in exchange.',
      items: [
        {
          name: 'Signed Football',
          description: 'Signed by a famous player.',
          condition: 'Mint',
          imageUrl: faker.image.url(),
          quantity: 1,
        },
      ],
    },
  ];

  const responses = [];

  for (const reply of replies) {
    const postId = posts.find((post) => post.title.includes(reply.post)).id;
    const authorId = users.find((user) => user.username === reply.author).id;
    const response = await prisma.response.create({
      data: {
        postId,
        authorId,
        message: reply.message,
        items: { create: reply.items },
      },
      include: { items: true },
    });

    responses.push(response);
  }

  return responses;
};

const generateTrades = async (posts, responses) => {
  const agreements = [
    { post: 'Guitar', response: 'DJ mixer', status: 'completed' },
    { post: 'Laptop', response: 'DSLR', status: 'completed' },
    { post: 'Pottery', response: 'football', status: 'pending' },
  ];

  const trades = [];

  for (const agreement of agreements) {
    const postId = posts.find((post) => post.title.includes(agreement.post)).id;
    const responseId = responses.find((response) =>
      response.message.includes(agreement.response)
    ).id;
    const trade = await prisma.trade.create({
      data: {
        postId,
        responseId,
        agreedAt: new Date(),
        status: agreement.status,
      },
    });

    trades.push(trade);
  }

  return trades;
};

const generateReviews = async (trades, posts, responses) => {
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
            rating: faker.number.int({ min: 3, max: 5 }),
            comment: faker.lorem.sentence(),
          },
          {
            reviewerId: response.authorId,
            revieweeId: post.authorId,
            tradeId: trade.id,
            rating: faker.number.int({ min: 3, max: 5 }),
            comment: faker.lorem.sentence(),
          },
        ],
        skipDuplicates: true,
      });
    }
  }
};

const seed = async () => {
  const users = await generateUsers();
  const categories = await generateCategories();
  const posts = await generatePosts(users);
  const responses = await generateResponses(posts, users);
  const trades = await generateTrades(posts, responses);

  await generateReviews(trades, posts, responses);
};

await prisma.$connect();

await seed();

await prisma.$disconnect();
