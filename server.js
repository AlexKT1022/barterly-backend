import app from '#app';
import prisma from '#db/client';

const PORT = process.env.PORT ?? 3000;

await prisma.connect();

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
