import { getUserById } from '#db/queries/userQueries';
import { verifyToken } from '#utils/jwt';

/** Attaches the user to the request if a valid token is provided */
const getUserFromToken = async (req, res, next) => {
  const authorization = req.get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) return next();

  const token = authorization.split(' ')[1];

  try {
    const { id } = verifyToken(token);
    const user = await getUserById(id);
    if (!user) {
      return res.status(401).send('User not found.');
    }
    req.user = user;

    next();
  } catch {
    res.status(401).send('Invalid token.');
  }
};

export default getUserFromToken;
