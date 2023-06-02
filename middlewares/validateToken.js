// this middleware is basically for authorization of each and every request after login

const AppError = require("../ErrorHandlers/AppError");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const validateToken = asyncHandler(async (req, res, next) => {
  const temp = req.headers.authorization;

  if (temp && temp.startsWith("Bearer")) {
    const token = temp.split(" ")[1];

    jwt.verify(
      token,
      process.env.JWT_SECRET,
      asyncHandler(async (err, decoded) => {
        if (err) {
          return next(new AppError("Please Login Again", 401));
        } else {
          const userExists = await User.findById(decoded._id);
          if (!userExists) {
            return next(new AppError("User does not exists", 401));
          }
          req.user = userExists;
          next();
        }
      })
    );
  } else {
    return next(new AppError("Please login", 401));
  }
});

module.exports = validateToken;
