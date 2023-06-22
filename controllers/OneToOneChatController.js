const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const OneToOneMessage = require("../models/OneToOneMessageModel");

const getDmMessages = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const messages = await OneToOneMessage.find({
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

  console.log(messages);

  if (!messages) {
    return next(new AppError("There are no messages", 500));
  }

  return res.status(200).json({
    messages,
  });
});

const pinMessage = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  console.log("i am here");

  const messages = await OneToOneMessage.findByIdAndUpdate(id, {
    pinned: true,
  }).sort({ createdAt: 1 });
  console.log(messages);

  if (messages.length < 1) {
    return next(new AppError("There are no messages", 500));
  }
  console.log("i am here");

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

module.exports = {
  getDmMessages,
  getPinnedMessages,
  deleteMessage,
  pinMessage,
};
