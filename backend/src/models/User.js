
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'owner', 'admin'],
      default: 'customer',
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    whatsappEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toAuthJSON = function toAuthJSON() {
  return {
    id: this._id,
    _id: this._id,
    uid: String(this._id),
    name: this.name,
    fullName: this.fullName || this.name,
    displayName: this.fullName || this.name,
    email: this.email,
    phone: this.phone || '',
    phoneNumber: this.phone || this.email,
    role: this.role,
    whatsappEnabled: Boolean(this.whatsappEnabled),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);
