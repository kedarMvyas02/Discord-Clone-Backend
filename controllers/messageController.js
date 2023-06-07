const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const { default: mongoose } = require("mongoose");
const Member = require("../models/memeberModel");
const TextChannel = require("../models/textChannelModel");
const VoiceChannel = require("../models/voiceChannelModel");
const Message = require("../models/messageModel");
require("dotenv").config();

const sendMessage = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const content = req.body.content;

  const created = await Message.create({
    user: req.user.id,
    channel: id,
    content,
  });

  if (!created)
    return next(
      new AppError("Something went wrong with message creation", 500)
    );
  return res.status(200).json({
    msg: "Message created successfully",
    content,
  });
});

const getMessages = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const gotMessages = await Message.find({ channel: id });
  if (!gotMessages) return next(new AppError("No messages found", 404));

  return res.status(200).json({
    msg: "Messages found successfully",
    messages: gotMessages,
  });
});

module.exports = {
  sendMessage,
  getMessages,
};
