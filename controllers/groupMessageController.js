const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const GroupMessage = require("../models/GroupMessageModel");

const getChannelMessages = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const content = req.query.content;
  const regex = new RegExp(content, "i");
  // const regex = new RegExp(`^(?!http).*${content}.*$`, "i");

  const messages = await GroupMessage.find({
    channel: id,
    content: { $regex: regex },
  })
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
    .populate("sender")
    .sort({ createdAt: 1 })
    .lean();

  return res.status(200).json({
    messages,
  });
});

const pinMessage = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const messages = await GroupMessage.findByIdAndUpdate(id, {
    pinned: true,
  });

  if (messages.length < 1) {
    return next(new AppError("There are no messages", 500));
  }

  return res.status(200).json({
    messages,
  });
});

const deletePinnedMessage = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const msgExists = await GroupMessage.findOne({ _id: id });

  const messages = await GroupMessage.findByIdAndUpdate(
    msgExists._id,
    {
      pinned: false,
    },
    { new: true }
  );

  return res.status(200).json({
    messages,
  });
});

const readChannelMessages = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  await GroupMessage.updateMany(
    {
      channel: id,
    },
    {
      $pull: {
        unread: req.user.id,
      },
    }
  );

  return res.status(200).json({
    msg: "Message read Successfully",
  });
});

module.exports = {
  getChannelMessages,
  deleteMessage,
  getPinnedMessages,
  pinMessage,
  deletePinnedMessage,
  readChannelMessages,
};
