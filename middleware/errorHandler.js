const errorHandler = (err, req, res, next) => {
  // A switch statement can be used instead of if statements
  // when multiple cases are handled the same way.
  switch (err.code) {
    // Invalid type
    case '22P02':
      return res.status(400).send(err.message);
    // Unique constraint violation
    case '23505':
    // Foreign key violation
    case '23503':
      return res.status(400).send(err.detail);
    default:
      console.error(err);

      return res.status(500).send('Sorry! Something went wrong.');
  }
};

export default errorHandler;
