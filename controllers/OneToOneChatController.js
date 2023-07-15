const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const OneToOneMessage = require("../models/OneToOneMessageModel");
const { default: mongoose } = require("mongoose");

const getDmMessages = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const content = req.query.content;
  const regex = new RegExp(content, "i");

  const messages = await OneToOneMessage.find({
    content: { $regex: regex },
    $or: [
      { sender: req.user.id, reciever: id },
      { sender: id, reciever: req.user.id },
    ],
  })
    .populate({
      path: "sender",
      select: "name _id uniqueCode email userImage status createdAt",
    })
    .populate({
      path: "reciever",
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

const getPinnedMessages = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const messages = await OneToOneMessage.find({
    $or: [
      { sender: req.user.id, reciever: id },
      { sender: id, reciever: req.user.id },
    ],
    pinned: true,
  })
    .populate({
      path: "sender",
      select: "name _id uniqueCode email userImage status createdAt",
    })
    .populate({
      path: "reciever",
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

const pinMessage = asyncHandler(async (req, res, next) => {
  const id = new mongoose.Types.ObjectId(req.params.id);

  const messages = await OneToOneMessage.findByIdAndUpdate(id, {
    pinned: true,
  }).populate("sender");

  return res.status(200).json({
    messages,
  });
});

const deletePinnedMessage = asyncHandler(async (req, res, next) => {
  const id = new mongoose.Types.ObjectId(req.params.id);

  const messages = await OneToOneMessage.findByIdAndUpdate(id, {
    pinned: false,
  }).populate("sender");

  return res.status(200).json({
    messages,
  });
});

const deleteMessage = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const message = await OneToOneMessage.find({ _id: id });
  if (!message) return next(new AppError("Message does not exists", 404));

  const deleted = await OneToOneMessage.deleteOne({ _id: id });
  if (!deleted)
    return next(
      new AppError("Something went wrong while deleting group message", 500)
    );

  return res.status(200).json({
    msg: "Message deleted Successfully",
  });
});

const readMessages = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  await OneToOneMessage.updateMany({
    $or: [
      { sender: req.user.id, reciever: id },
      { sender: id, reciever: req.user.id },
    ],
    $set: { read: [] },
  });

  return res.status(200).json({
    msg: "Message read Successfully",
  });
});

const getUnreadMessages = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const unreadMessages = await OneToOneMessage.find({
    sender: id,
    reciever: req.user.id,
    read: { $in: [req.user.id] },
  }).lean();

  return res.status(200).json({
    unreadMessages,
  });
});

module.exports = {
  getDmMessages,
  getPinnedMessages,
  deleteMessage,
  pinMessage,
  deletePinnedMessage,
  readMessages,
  getUnreadMessages,
};
