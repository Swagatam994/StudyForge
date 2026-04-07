import jwt from 'jsonwebtoken';
import "dotenv/config";
import UserModel from '../models/user.js';

export const protectRoute = async (req, res, next) => {
  try {
    let token = req.cookies?.jwt;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({ message: "Unauthorized - invalid token" });
    }

    const user = await UserModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized - invalid token" });
    }

    console.log("Error in protectRoute middleware:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export default protectRoute;
