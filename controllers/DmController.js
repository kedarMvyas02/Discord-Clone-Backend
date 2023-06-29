const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const User = require("../models/userModel");
const Friend = require("../models/friendsModel");
const { default: mongoose } = require("mongoose");
const Dm = require("../models/DmModel");
const OneToOneMessage = require("../models/OneToOneMessageModel");

const addToDmHandler = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new AppError("ID not present in Parameter", 404));

  const user = await User.findOne({ _id: id });
  if (!user) return next(new AppError("User not found", 404));

  const friendExists = await Friend.findOne({
    user: req.user.id,
    friend: user._id,
    accepted: true,
  });
  if (!friendExists)
    return next(new AppError(`You are not friend with ${user.name}`));

  const alreadyExists = await Dm.findOne({
    user: req.user.id,
    friend: user._id,
  });
  if (alreadyExists)
    return next(new AppError(`${user.name} already exist in your dm`));

  const done = await Dm.create({
    user: req.user.id,
    friend: user._id,
  });

  if (!done) return next(new AppError("Smthng went wrong with Dm Model", 500));

  return res.status(200).json({
    msg: `${user.name} has successfully added to your dm`,
  });
});

const removeFromDmHandler = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new AppError("ID not present in Parameter", 404));

  const user = await User.findOne({ _id: id });
  if (!user) return next(new AppError("User not found", 404));

  const alreadyExists = await Dm.findOne({
    user: req.user.id,
    friend: user._id,
  });
  if (!alreadyExists)
    return next(new AppError(`${user.name} does not exist in your dm`));

  const done = await Dm.findByIdAndDelete(alreadyExists._id);
  if (!done) return next(new AppError("Smthng went wrong with Dm Model", 500));

  return res.status(200).json({
    msg: `${user.name} have been successfully removed from your dm`,
  });
});

const getDmFriends = asyncHandler(async (req, res, next) => {
  const dmFriends = await Dm.find({ user: req.user.id })
    .populate("friend")
    .lean();
  if (!dmFriends) return next(new AppError(`No user exist in your dm`));

  const data = dmFriends.map((item) => {
    const { name, uniqueCode, email, userImage, _id, status } = item.friend;
    return { _id, name, uniqueCode, email, userImage, status };
  });

  const promises = data?.map(async (val) => {
    const unreadMessages = await OneToOneMessage.find({
      sender: val._id,
      reciever: req.user.id,
      read: { $in: [req.user.id] },
    }).lean();

    return { ...val, unreadMessages: unreadMessages?.length };
  });

  Promise.all(promises).then((updatedData) => {
    return res.status(200).json({
      dmFriends: updatedData,
    });
  });
});

module.exports = {
  addToDmHandler,
  removeFromDmHandler,
  getDmFriends,
};
