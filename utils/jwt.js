import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

/** Creates a token with the given payload */
export const createToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

/** Extracts the payload from a token */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
