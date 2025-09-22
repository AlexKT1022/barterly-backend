import client from '#db/client';

const generateUsers = () => {
  return Promise.all([
    client.user.create({
      data: {
        username: 'sam',
        password: 'hashedpassword456',
        profileImageUrl: '/images/default.png',
        location: 'San Francisco',
      },
    }),
    client.user.create({
      data: {
        username: 'alex',
        password: 'hashedpassword123',
        profileImageUrl: '/images/default.png',
        location: 'New York',
      },
    }),
    client.user.create({
      data: {
        username: 'jordan',
        password: 'hashedpassword789',
        profileImageUrl: '/images/default.png',
        location: 'Chicago',
      },
    }),
  ]);
};

const generatePosts = async (users) => {
  const [sam, alex, jordan] = users;

  const post1 = await client.post.create({
    data: {
      title: 'Synth in Mint Condition',
      description: 'Want to trade for a guitar.',
      authorId: sam.id,
      items: {
        create: [
          {
            name: 'Moog Sub 37',
            condition: 'Like New',
            quantity: 1,
          },
        ],
      },
    },
  });

  const post2 = await client.post.create({
    data: {
      title: 'Vintage Guitar for Trade',
      description: 'Looking to trade my Fender Strat for a synth.',
      authorId: alex.id,
      items: {
        create: [
          {
            name: 'Fender Stratocaster',
            condition: 'Used - Good',
            quantity: 1,
          },
        ],
      },
    },
  });

  return [post1, post2];
};

const generateResponses = async (posts, users) => {
  const [post1, post2] = posts;
  const [sam, alex] = users;

  const response1 = await client.response.create({
    data: {
      postId: post2.id,
      authorId: sam.id,
      message: 'I can trade my Moog Sub 37 for your guitar.',
      items: {
        create: [
          {
            name: 'Moog Sub 37',
            condition: 'Like New',
            quantity: 1,
          },
        ],
      },
    },
  });

  const response2 = await client.response.create({
    data: {
      postId: post1.id,
      authorId: alex.id,
      message: 'I can trade my Fender Strat for your synth.',
      items: {
        create: [
          {
            name: 'Fender Stratocaster',
            condition: 'Used - Good',
            quantity: 1,
          },
        ],
      },
    },
  });

  return [response1, response2];
};

const generateTrades = async (posts, responses) => {
  const [post1, post2] = posts;
  const [response1, response2] = responses;

  await client.trade.create({
    data: {
      postId: post1.id,
      responseId: response2.id,
      agreedAt: new Date(),
      status: 'completed',
    },
  });

  await client.trade.create({
    data: {
      postId: post2.id,
      responseId: response1.id,
      agreedAt: new Date(),
      status: 'completed',
    },
  });
};

const main = async () => {
  console.log('🌱 Starting database seed...');

  const users = await generateUsers();
  const posts = await generatePosts(users);
  const responses = await generateResponses(posts, users);

  await generateTrades(posts, responses);

  console.log('✅ Database has been seeded!');
};

main()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await client.$disconnect();
  });
