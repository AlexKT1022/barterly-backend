<<<<<<< HEAD
import app from '#app';
import db from '#db/client';
=======
import app from "#app";
import db from "#db/client";
>>>>>>> 306aa6ea20abe8a79c84983792bd13dc356f7b85

const PORT = process.env.PORT ?? 3000;

await db.connect();

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
