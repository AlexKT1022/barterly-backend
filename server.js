import app from '#app';
import prisma from '#lib/prisma';

const PORT = process.env.PORT ?? 3000;

await prisma.$connect();

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
