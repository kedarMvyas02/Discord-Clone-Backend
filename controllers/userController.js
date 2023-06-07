const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sendEmail = require("../config/nodemailer");
const crypto = require("crypto");
const User = require("../models/userModel");
const Server = require("../models/serverModel");
const Member = require("../models/memeberModel");
const Friend = require("../models/friendsModel");

// generates a random token for forgot password functionality
const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
// hashes the same token for reset password functionality
const hashToken = (token) => {
  const sha256 = crypto.createHash("sha256");
  sha256.update(token);
  return sha256.digest("hex");
};

// unique discord code generator
const generateUniqueCode = async () => {
  // Generates a random 4-digit number between 1000 and 9999
  const code = Math.floor(1000 + Math.random() * 9000);
  const codeInUse = await User.find({ uniqueCode: code });

  if (codeInUse.length > 0) {
    return generateUniqueCode();
  } else {
    return code;
  }
};

// generates a jwtoken
const JWTokenGenerator = async (user) => {
  const accessToken = await jwt.sign(
    {
      _id: user._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
  return accessToken;
};

// register a user
const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, userImage } = req.body;
  const uniqueCode = await generateUniqueCode();
  const username = name?.split(" ")?.join("")?.trim();

  const user = await User.create({
    name: username,
    uniqueCode,
    email,
    password,
    userImage,
  });

  if (user) {
    const message = `Hey ${user.name}, \n You have successfully registered in Discord chatting application :) \n  Thanks a lot xD for registering into our application`;

    try {
      // await sendEmail({
      //   email: user.email,
      //   subject:
      //     "You have successfully registered into Discord clone by Kedar Vyas",
      //   message,
      // });

      await Member.create({
        server: "647ac5284561c78fcf7ce1ce",
        user: user._id,
      });

      return res.status(200).json({
        message: "User successfully created",
        _id: user._id,
        name: `${name}#${uniqueCode}`,
        email,
      });
    } catch (err) {
      return next(new AppError({ err }, 500));
    }
  } else {
    return next(new AppError("Something went wrong", 500));
  }
});

// login user with assigning a jwtoken
const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(
      new AppError("Both email and password fields are neccessary", 400)
    );

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("Email is not registered yet", 400));
  }

  const passCompare = await bcrypt.compare(password, user.password);

  if (passCompare) {
    const accessToken = await JWTokenGenerator(user);
    return res.status(200).json({
      message: "You have successfully logged in :) ",
      _id: user._id,
      accessToken,
    });
  } else {
    return next(new AppError("Password is incorrect", 401));
  }
});

// deletes user only if same user is logged in
const deleteUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(
      new AppError("Both email and password fields are neccessary", 400)
    );
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("Email is not registered yet", 400));
  }

  if (req.user.email !== email)
    return next(new AppError("Can't delete another user", 400));

  const passCompare = await bcrypt.compare(password, user.password);

  if (passCompare) {
    const allLikes = await Like.find({ user_id: user._id });
    if (allLikes.length > 0) await Like.deleteMany({ _id: allLikes[0]._id });

    const allDislikes = await Dislike.find({ user_id: user._id });
    if (allDislikes.length > 0)
      await Dislike.deleteMany({ _id: allDislikes[0]._id });

    const allComments = await Comment.find({ user_id: user._id });
    if (allComments.length > 0)
      await Comment.deleteMany({ _id: allComments[0]._id });

    const temp = await User.deleteOne(user);
    if (temp) {
      res.status(200).json({
        message: "User deleted successfully",
      });
    }
  }
});

// sends a email with a token for authentication to change password
const forgotPassword = asyncHandler(async (req, res, next) => {
  const email = req.body.email;
  if (!email) return next(new AppError("Email field is compulsary", 403));

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("Email is not registered yet", 403));

  const resetToken = generateToken();
  const tokenDB = hashToken(resetToken);
  await user.updateOne({
    passwordResetToken: tokenDB,
  });

  const resetURL = `http://127.0.0.1:3000/resetPassword/${resetToken}`;
  const message = `Hey ${user.name}, \n Forgot your password? Don't Worry :) \n Submit a PATCH request with your new password to: ${resetURL} \n If you didn't forget your password, please ignore this email ! `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token is only valid for 10 mins!",
      message,
    });

    return res.status(200).json({
      message: "Forgot Password Token sent to email!",
      token: resetToken,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError({ err }, 500));
  }
});

// checks forgotpassword token and then resets password
const resetPassword = asyncHandler(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;
  if (!password || !passwordConfirm) {
    return next(
      new AppError("Both password & passwordConfirm fields are neccessary")
    );
  }
  if (password !== passwordConfirm) {
    return next(
      new AppError("Password and password fields are not the same", 400)
    );
  }

  const token = req.params.token;
  if (token == "null") {
    return next(
      new AppError("Token not present, click forgot password again", 403)
    );
  }

  const hashedToken = hashToken(token);
  const user = await User.findOne({ passwordResetToken: hashedToken });
  if (!user) {
    return next(
      new AppError(
        "Reset Token must have expired, please click forgot password again",
        401
      )
    );
  }

  user.password = password;
  user.passwordResetToken = undefined;
  const created = await user.save();
  if (created) {
    res.status(200).json({
      message: "Password successfully changed",
    });
  } else {
    return next(new AppError("Something went wrong", 500));
  }
});

const getUser = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (id) {
    if (!mongoose.Types.ObjectId.isValid(id))
      return next(new AppError("Id is invalid", 400));

    const user = await User.findOne({ _id: id }, { password: 0 }, { __v: 0 });

    if (!user) return next(new AppError("User is not registered yet", 404));
    return res.status(200).json({
      userWithId: user,
    });
  } else {
    const user = await User.findById(req.user._id).select("-password -__v");
    return res.status(200).json({
      userWithLogin: user,
    });
  }
});

const sendFriendRequest = asyncHandler(async (req, res, next) => {
  const { uniqueCode } = req.body;
  const friend = await User.findOne({ uniqueCode });
  if (!friend) return next(new AppError("Friend does not exist", 400));
  if (req.user.uniqueCode == uniqueCode)
    return next(
      new AppError("You cannot send friend request to yourself", 400)
    );
  const requestExists = await Friend.findOne({
    user: req.user.id,
    friend: friend._id,
    accepted: false,
  });
  if (requestExists)
    return next(new AppError("Friend Request sent already!", 400));
  const friendExists = await Friend.findOne({
    user: req.user.id,
    friend: friend._id,
    accepted: true,
  });
  if (friendExists)
    return next(new AppError("You both are friend already!", 400));

  const done = await Friend.create({
    user: req.user.id,
    friend: friend._id,
    accepted: false,
  });

  if (!done)
    return next(new AppError("Something went wrong with friend model", 500));

  return res.status(200).json({
    msg: "Friend request sent successfully",
  });
});

const acceptFriendRequest = asyncHandler(async (req, res, next) => {
  const { uniqueCode } = req.body;

  const friend = await User.findOne({ uniqueCode });
  if (!friend) return next(new AppError("Friend does not exist", 400));

  const requestExists = await Friend.findOne({
    user: friend._id,
    friend: req.user.id,
    accepted: false,
  });

  if (!requestExists)
    return next(new AppError("Friend Request does not exists", 400));

  await Friend.findByIdAndUpdate(
    { _id: requestExists._id },
    {
      accepted: true,
    },
    { new: true }
  );

  const done = await Friend.create({
    user: req.user.id,
    friend: friend._id,
    accepted: true,
  });

  if (!done)
    return next(new AppError("Something went wrong with friend model", 500));

  return res.status(200).json({
    msg: "You are friends now yayy!!!",
  });
});

const getFriends = asyncHandler(async (req, res, next) => {
  const friends = await Friend.find({ user: req.user.id, accepted: true })
    .populate("user")
    .populate("friend");

  if (friends.length == 0)
    return next(new AppError("you don't have any friends", 404));

  console.log(friends);

  const friendsNames = friends.map((friend) => ({
    _id: friend.friend._id,
    friend: friend.friend.name,
    uniqueCode: friend.friend.uniqueCode,
    userImage: friend.friend.userImage,
  }));

  return res.status(200).json({
    allFriends: friendsNames,
  });
});

const getPendingRequests = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id });

  const friends = await Friend.find({ user: user._id, accepted: false })
    .populate("user")
    .populate("friend");
  if (friends.length == 0)
    return next(new AppError("you don't have any pending requests", 404));

  const friendsNames = friends.map((friend) => ({
    _id: friend.friend._id,
    friend: friend.friend.name,
    uniqueCode: friend.friend.uniqueCode,
    userImage: friend.friend.userImage,
  }));

  return res.status(200).json({
    pendingReq: friendsNames,
  });
});

const getArrivedFriendRequests = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id });

  const friends = await Friend.find({ friend: user._id, accepted: false })
    .populate("user")
    .populate("friend");
  if (friends.length == 0)
    return next(
      new AppError("you don't have any arrived friend requests", 404)
    );

  const friendsNames = friends.map((friend) => ({
    _id: friend.user._id,
    user: friend.user.name,
    uniqueCode: friend.user.uniqueCode,
    userImage: friend.user.userImage,
  }));

  return res.status(200).json({
    arrivedReq: friendsNames,
  });
});

const rejectFriendReq = asyncHandler(async (req, res, next) => {
  const { uniqueCode } = req.body;

  const friend = await User.findOne({ uniqueCode });
  if (!friend) return next(new AppError("Friend does not exist", 400));

  const requestExists = await Friend.findOne({
    user: friend._id,
    friend: req.user.id,
    accepted: false,
  });

  if (!requestExists)
    return next(new AppError("Friend Request does not exists", 400));

  const done = await Friend.findByIdAndDelete({ _id: requestExists._id });

  if (!done)
    return next(new AppError("Something went wrong with friend model", 500));

  return res.status(200).json({
    msg: "Friend Request Rejected Successfully",
  });
});

const cancelFriendReq = asyncHandler(async (req, res, next) => {
  const { uniqueCode } = req.body;

  const friend = await User.findOne({ uniqueCode });
  if (!friend) return next(new AppError("Friend does not exist", 400));

  const requestExists = await Friend.findOne({
    user: req.user.id,
    friend: friend._id,
    accepted: false,
  });

  if (!requestExists)
    return next(new AppError("Friend Request does not exists", 400));

  const done = await Friend.findByIdAndDelete({ _id: requestExists._id });

  if (!done)
    return next(new AppError("Something went wrong with friend model", 500));

  return res.status(200).json({
    msg: "Friend Request Deleted Successfully",
  });
});

module.exports = {
  registerUser,
  loginUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  getUser,
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  getPendingRequests,
  getArrivedFriendRequests,
  rejectFriendReq,
  cancelFriendReq,
};
