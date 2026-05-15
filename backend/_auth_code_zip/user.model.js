const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    // optional split fields for profile UI
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 4,
    },

    // ✅ Role-based access (admin/user)
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    // profile info
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },

    // DP
    dp: {
      type: String,
      default: "",
    },

    // bank details
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      bankName: { type: String, trim: true },
      branchName: { type: String, trim: true },
    },

    // PAN details
    panDetails: {
      panNumber: { type: String, trim: true },
      panHolderName: { type: String, trim: true },
      fatherName: { type: String, trim: true },
      dateOfBirth: { type: Date },
      panCardImage: { type: String, trim: true },
    },

    // existing fields
    post: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "posts",
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    blockedUser: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.JWTTokenGenration = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

userSchema.methods.comparePassword = async function (pass) {
  return await bcrypt.compare(pass, this.password);
};

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
