const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const GroupMessage = require("../models/GroupMessageModel");

const getChannelMessages = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const messages = await GroupMessage.find({ channel: id })
    .populate({
      path: "sender",
      select: "name _id uniqueCode email userImage status createdAt",
    })
    .populate({
      path: "channel",
      select: "name _id uniqueCode email userImage status createdAt",
    })
    .sort({ createdAt: 1 });

  if (!messages) {
    return next(new AppError("There are no messages", 500));
  }

  return res.status(200).json({
    messages,
  });
});

const deleteMessage = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const message = await GroupMessage.find({ _id: id });
  if (!message) return next(new AppError("Message does not exists", 404));

  const deleted = await GroupMessage.deleteOne({ _id: id });
  if (!deleted)
    return next(
      new AppError("Something went wrong while deleting group message", 500)
    );

  return res.status(200).json({
    msg: "Message deleted Successfully",
  });
});

const getPinnedMessages = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const messages = await GroupMessage.find({
    channel: id,
    pinned: true,
  })
    .populate("user")
    .sort({ createdAt: 1 })
    .lean();

  if (messages.length < 1) {
    return next(new AppError("There are no messages", 500));
  }

  return res.status(200).json({
    messages,
  });
});

const pinMessage = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const messages = await GroupMessage.findByIdAndUpdate(id, {
    pinned: true,
  }).sort({ createdAt: 1 });

  if (messages.length < 1) {
    return next(new AppError("There are no messages", 500));
  }

  return res.status(200).json({
    messages,
  });
});

module.exports = {
  getChannelMessages,
  deleteMessage,
  getPinnedMessages,
  pinMessage,
};
