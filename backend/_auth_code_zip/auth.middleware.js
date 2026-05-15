const userModel = require("../models/user.model");
const cacheClient = require("../services/chache.service");
const jwt = require("jsonwebtoken");

const blacklistKey = (token) => `bl:${token}`;

const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization &&
        req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        msg: "Authentication token missing",
      });
    }

    // ✅ FIXED: prefixed redis key
    const isBlacklisted = await cacheClient.get(blacklistKey(token));
    if (isBlacklisted) {
      return res.status(401).json({
        msg: "Token expired or blacklisted",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        msg: "Invalid or expired token",
      });
    }

    const user = await userModel.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        msg: "User not found for this token",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("authMiddleware error", error);
    return res.status(500).json({
      msg: "Internal server error",
    });
  }
};

module.exports = authMiddleware;
