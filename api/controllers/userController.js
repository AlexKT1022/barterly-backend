import {
  createUser as createUserQuery,
  getUserByCredentials as getUserByCredentialsQuery,
  getUserById as getUserByIdQuery,
} from '#db/queries/userQueries';

export const getUserById = async (req, res, next) => {
  try {
    const user = await getUserByIdQuery(Number(req.params.id));
    if (!user) return res.status(404).send('User not found');

    res.send(user);
  } catch (e) {
    next(e);
  }
};

export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, profile_image_url, location } = req.body;
    const user = await createUserQuery(
      username,
      email,
      password,
      profile_image_url,
      location
    );
    const token = createToken({ id: user.id, username: user.username });

    res.status(201).send({ token, user });
  } catch (e) {
    next(e);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const user = await getUserByCredentialsQuery(
      req.body.email,
      req.body.password
    );
    if (!user) return res.status(401).send('Invalid email or password');

    const token = createToken({ id: user.id, username: user.username });

    res.send({ token, user });
  } catch (e) {
    next(e);
  }
};
