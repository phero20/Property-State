import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // get token from cookies (hope it's there!)
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "You need to login first!" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
    if (err) {
      return res.status(403).json({ message: "Hmm, token looks weird." });
    }
    req.userId = payload.id;
    next();
  });
};
