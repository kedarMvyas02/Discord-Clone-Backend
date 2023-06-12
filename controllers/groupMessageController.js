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

module.exports = {
  getChannelMessages,
};
