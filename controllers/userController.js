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
const Dm = require("../models/DmModel");
const axios = require("axios");

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

  if (codeInUse.length !== 0) {
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

/////////// REGISTER USER //////////////
const registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, userImage } = req.body;
  const uniqueCode = await generateUniqueCode();
  const username = name?.split(" ")?.join("")?.trim();
  let user;

  if (userImage) {
    user = await User.create({
      name: username,
      uniqueCode,
      email,
      password,
      userImage,
    });
  } else {
    user = await User.create({
      name: username,
      uniqueCode,
      email,
      password,
    });
  }
  console.log(user);

  if (user) {
    const message = `
  <html>
    <head>
      <style>
        /* Add your custom CSS styles here */
        body {
          font-family: Arial, sans-serif;
          background-color: #f7f7f7;
          padding: 20px;
        }

        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header {
          text-align: center;
          margin-bottom: 20px;
        }

        .logo {
          width: 100px;
          height: 100px;
          margin-bottom: 10px;
        }

        .message {
          margin-bottom: 20px;
        }

        
.button_slide {
  color: #FFF;
  border: 2px solid rgb(216, 2, 134);
  border-radius: 0px;
  padding: 18px 36px;
  display: inline-block;
  font-family: "Lucida Console", Monaco, monospace;
  font-size: 14px;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: inset 0 0 0 0 #D80286;
  -webkit-transition: ease-out 0.4s;
  -moz-transition: ease-out 0.4s;
  transition: ease-out 0.4s;
}

.slide_right:hover {
  box-shadow: inset 400px 0 0 0 #D80286;
}

</style>
</head>
<body>

      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://static.vecteezy.com/system/resources/previews/006/892/625/large_2x/discord-logo-icon-editorial-free-vector.jpg" alt="Discord Logo" class="logo">
          <h1>Welcome to Discord Chatting Application</h1>
        </div>
        <div class="message">
          <p>Hey ${user.name},</p>
          <p>You have successfully registered in the Discord Chatting Application. Thank you for joining us!</p>
        </div>
        <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
        <p>Happy chatting!</p>
        <a href="http://127.0.0.1:3000/" class="button_slide slide_right">Open Discord</a>
      </div>
    </body>
  </html>
`;

    try {
      await sendEmail({
        email: user.email,
        subject:
          "You have successfully registered into Discord clone by Kedar Vyas",
        html: message,
      });

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

/////////// LOGIN USER //////////////
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

/////////// UPDATE USER //////////////
const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
  });

  return res.status(200).json({
    user,
  });
});

/////////// DELETE USER //////////////
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

/////////// FORGOT PASSWORD //////////////
const forgotPassword = asyncHandler(async (req, res, next) => {
  const email = req.body.email;
  if (!email) return next(new AppError("Email field is compulsary", 400));

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("Email is not registered yet", 400));

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

/////////// RESEST PASSWORD //////////////
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
      new AppError("Token not present, click forgot password again", 400)
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

/////////// GET USER BY ID //////////////
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

/////////// SEND FRIEND REQUEST //////////////
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
    return next(new AppError("You both are friends already!", 400));

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

/////////// ACCEPT FRIEND REQUEST //////////////
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

  // generate managemenet token
  // let managementToken = "";

  // const app_access_key = process.env.APP_ACCESS_KEY;
  // const app_secret = process.env.APP_SECRET;
  // console.log(app_access_key, app_secret);
  // const payload = {
  //   access_key: app_access_key,
  //   type: "management",
  //   version: 2,
  //   iat: Math.floor(Date.now() / 1000),
  //   nbf: Math.floor(Date.now() / 1000),
  // };

  // await jwt.sign(
  //   payload,
  //   app_secret,
  //   {
  //     algorithm: "HS256",
  //     expiresIn: "24h",
  //     jwtid: uuid4(),
  //   },
  //   function (err, token) {
  //     if (err) {
  //       console.log(err);
  //     }
  //     managementToken = token;
  //   }
  // );

  // console.log("managementToken", managementToken);
  // console.log("mToken", mToken);

  // generate a room
  const template_id = process.env.TEMPLATE_ID;
  const managementToken = process.env.MANAGEMENT_TOKEN;
  const roomUrl = "https://api.100ms.live/v2/rooms";

  const requestData = {
    name: `${req.user.name}_${Date.now()}`,
    description: "This is a sample description for the room",
    template_id: template_id,
    region: "in",
  };

  const response = await axios.post(roomUrl, requestData, {
    headers: {
      Authorization: `Bearer ${managementToken}`,
      "Content-Type": "application/json",
    },
  });

  const createdRoom = response.data;
  console.log("Room created id:", createdRoom?.id);

  // create room code

  const roomId = createdRoom?.id;
  const roomCodeUrl = `https://api.100ms.live/v2/room-codes/room/${roomId}`;

  const resp = await axios.post(roomCodeUrl, null, {
    headers: {
      Authorization: `Bearer ${managementToken}`,
      "Content-Type": "application/json",
    },
  });

  const roomCode = resp.data.data[0].code;
  console.log("Room code created:", roomCode);

  await Friend.findByIdAndUpdate(
    { _id: requestExists._id },
    {
      accepted: true,
      roomCode: roomCode,
    },
    { new: true }
  );

  const done = await Friend.create({
    user: req.user.id,
    friend: friend._id,
    accepted: true,
    roomCode: roomCode,
  });

  if (!done)
    return next(new AppError("Something went wrong with friend model", 500));

  return res.status(200).json({
    msg: "You are friends now yayy!!!",
  });
});

/////////// GET ALL FRIENDS //////////////
const getFriends = asyncHandler(async (req, res, next) => {
  // const name = req.query.name;
  // const regex = new RegExp(name, "i");
  const friends = await Friend.find({
    user: req.user.id,
    accepted: true,
    // $or: [
    //   { "user.name": { $regex: regex } },
    //   { "friend.name": { $regex: regex } },
    // ],
  })
    .populate("user")
    .populate("friend");

  // if (friends.length == 0)
  //   return next(
  //     new AppError(
  //       "You don't have any Friends, don't worry wumpus is your bff :)",
  //       404
  //     )
  //   );

  const friendsNames = friends.map((friend) => {
    return {
      _id: friend.friend._id,
      friend: friend.friend.name,
      uniqueCode: friend.friend.uniqueCode,
      userImage: friend.friend.userImage,
      roomCode: friend.roomCode,
      status: friend.status,
    };
  });

  return res.status(200).json({
    allFriends: friendsNames,
  });
});

/////////// GET PENDING FRIEND REQUEST //////////////
const getPendingRequests = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id });

  const friends = await Friend.find({ user: user._id, accepted: false })
    .populate("user")
    .populate("friend");

  // if (friends.length == 0)
  //   return next(
  //     new AppError(
  //       "You don't have any Pending Friend Requests, dw i'm your friend",
  //       404
  //     )
  //   );

  const friendsNames = friends?.map((friend) => ({
    _id: friend.friend._id,
    friend: friend.friend.name,
    uniqueCode: friend.friend.uniqueCode,
    userImage: friend.friend.userImage,
  }));

  return res.status(200).json({
    pendingReq: friendsNames,
  });
});

/////////// GET ARRIVED FRIEND REQUEST //////////////
const getArrivedFriendRequests = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id });

  const friends = await Friend.find({ friend: user._id, accepted: false })
    .populate("user")
    .populate("friend");

  // if (friends.length == 0)
  //   return next(
  //     new AppError("You don't have any Arrived Friend Requests", 404)
  //   );

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

/////////// REJECT FRIEND REQUEST //////////////
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

/////////// CANCEL FRIEND REQUEST //////////////
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

/////////// REMOVE FRIEND //////////////
const removeFriend = asyncHandler(async (req, res, next) => {
  const { uniqueCode } = req.body;

  const friend = await User.findOne({ uniqueCode });
  if (!friend) return next(new AppError("Friend does not exist", 400));

  const requestExists = await Friend.findOne({
    user: req.user.id,
    friend: friend._id,
    accepted: true,
  });

  if (!requestExists) return next(new AppError("Friend does not exists", 400));

  const requestExists2 = await Friend.findOne({
    user: friend._id,
    friend: req.user.id,
    accepted: true,
  });

  await Friend.findByIdAndDelete({ _id: requestExists._id });
  await Friend.findByIdAndDelete({ _id: requestExists2._id });
  await Dm.deleteOne({
    user: req.user.id,
    friend: friend._id,
  });
  const done = await Dm.deleteOne({
    user: friend._id,
    friend: req.user.id,
  });

  if (!done)
    return next(new AppError("Something went wrong with friend model", 500));

  return res.status(200).json({
    msg: "Friend was Removed Successfully",
  });
});

/////////// READ ARRIVED FRIEND REQUEST //////////////
const readArrivedFriendRequst = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id });

  await Friend.findByIdAndUpdate(
    {
      friend: user._id,
      accepted: false,
    },
    {
      read: true,
    }
  );

  return res.status(200).json({
    msg: "friend request readed",
  });
});

module.exports = {
  registerUser,
  loginUser,
  updateUser,
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
  removeFriend,
  readArrivedFriendRequst,
};
