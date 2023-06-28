// this is a model for user with all the neccessary details

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add the user name"],
    },
    uniqueCode: {
      type: Number,
    },
    email: {
      type: String,
      lowercase: true,
      required: [true, "Please add the email"],
      unique: [true, "Email address already taken"],
    },
    userImage: {
      type: String,
      default:
        "http://res.cloudinary.com/dbi3rrybd/image/upload/v1686048004/Discord/gh1v9hotmsfjnbjnmltd.ico",
    },
    password: {
      type: String,
      required: [true, "Please fill the password field"],
    },
    phoneNumber: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    passwordResetToken: { type: String },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  const hashedPassword = await bcrypt.hash(this.password, 12);
  this.password = hashedPassword;
  next();
});

const User = new mongoose.model("User", userSchema);
module.exports = User;
