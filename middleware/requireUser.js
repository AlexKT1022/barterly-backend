/** Requires a logged-in user */
const requireUser = async (req, res, next) => {
  if (!req.user) return res.status(401).send('Unauthorized');

  next();
};

export default requireUser;
