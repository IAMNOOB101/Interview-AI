import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.accountType !== "guest" && !decoded.id) {
      return res.status(403).json({ message: "Invalid token payload" });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      accountType: decoded.accountType,
    };
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
