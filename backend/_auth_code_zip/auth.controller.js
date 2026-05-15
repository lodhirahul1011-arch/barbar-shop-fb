const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cacheClient = require("../services/chache.service");
const emailTemplate = require("../utils/emailTemplate");
const { sendMail } = require("../services/mail.service");

const isProd = process.env.NODE_ENV === "production";

/* ================= COOKIE OPTIONS ================= */
const cookieOptions = {
  httpOnly: true,
  secure: isProd,                      // true on HTTPS
  sameSite: isProd ? "none" : "lax",   // cross-site in prod
  maxAge: 7 * 24 * 60 * 60 * 1000,     // 7 days
  path: "/",
};

/* ================= HELPERS ================= */
const blacklistKey = (token) => `bl:${token}`;

const createTokenAndSetCookie = (user, res) => {
  const token = user.JWTTokenGenration();
  res.cookie("token", token, cookieOptions);
  return token;
};

/* ================= REGISTER ================= */
const registerController = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(422).json({ msg: "All fields are required" });
    }

    const existUser = await userModel.findOne({ email });
    if (existUser) {
      return res.status(409).json({ msg: "User already exists" });
    }

    const newUser = await userModel.create({ email, password, fullName });

    createTokenAndSetCookie(newUser, res);

    const safeUser = await userModel
      .findById(newUser._id)
      .select("-password");

    return res.status(201).json({
      msg: "User registered successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("register error:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

/* ================= LOGIN ================= */
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    createTokenAndSetCookie(user, res);

    const safeUser = await userModel
      .findById(user._id)
      .select("-password");

    return res.status(200).json({
      msg: "Login successful",
      user: safeUser,
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

/* ================= LOGOUT ================= */
const logOutController = async (req, res) => {
  try {
    const token = req.cookies?.token;

   if (token) {
  await cacheClient.set(
    blacklistKey(token),
    "1",
    "EX",
    7 * 24 * 60 * 60 // 7 days
  );
}


    res.clearCookie("token", cookieOptions);

    return res.status(200).json({
      msg: "User logged out successfully",
    });
  } catch (error) {
    console.error("logout error:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

/* ================= FORGOT PASSWORD ================= */
const forgotPasscontroller = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const rawToken = jwt.sign(
      { id: user._id },
      process.env.JWT_RAW_SECRET,
      { expiresIn: "30m" }
    );

    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password/${rawToken}`;

    const resetTemplate = emailTemplate({
      fullName: user.fullName,
      resetLink,
    });

    await sendMail(user.email, "Reset Password", resetTemplate);

    return res.status(200).json({ msg: "Reset email sent" });
  } catch (error) {
    console.error("forgot password error:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

/* ================= RESET PASSWORD ================= */
const resetPasswordController = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ msg: "Token and password are required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_RAW_SECRET);
    } catch {
      return res.status(400).json({ msg: "Invalid or expired token" });
    }

    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return res.status(200).json({
      msg: "Password updated successfully",
    });
  } catch (error) {
    console.error("reset password error:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

module.exports = {
  registerController,
  loginController,
  logOutController,
  forgotPasscontroller,
  resetPasswordController,
};
