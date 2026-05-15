const express = require("express");
const {
  registerController,
  loginController,
  logOutController,
  forgotPasscontroller,
  resetPasswordController,
} = require("../controllers/auth.controller");
const authMiddleware = require("../middlwares/auth.middleware");
const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const router = express.Router();

// ✅ GET current logged-in user
router.get("/me", authMiddleware, (req, res) => {
  return res.status(200).json({
    msg: "Current logged-in user",
    user: req.user,
  });
});

// ✅ Update password
router.post("/update-password/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!id || !password) {
      return res.status(400).json({
        msg: "Bad request: missing id or password",
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const updateUser = await userModel.findByIdAndUpdate(
      id,
      { password: hashed },
      { new: true }
    );

    return res.status(200).json({
      msg: "Password updated successfully",
      user: updateUser,
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({
      msg: "Internal server error",
      error,
    });
  }
});

// ✅ Register route
router.post("/register", registerController);

// ✅ Login route
// Add `res.cookie` if loginController returns a JWT or session token
router.post("/login", async (req, res, next) => {
  try {
    // Call your existing login controller
    await loginController(req, res, next);

    // If loginController sets token/session, make sure cookie is sent
    // Example: res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ msg: "Login failed", error });
  }
});

// ✅ Logout route
router.post("/logout", authMiddleware, logOutController);

// ✅ Forgot/reset password
router.post("/forgot-password", forgotPasscontroller);
router.post("/reset-password", resetPasswordController);

// ✅ Export router
module.exports = router;
