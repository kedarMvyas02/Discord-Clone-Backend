const OneToOneMessage = require("../models/OneToOneMessageModel");
const Server = require("../models/serverModel");
const AppError = require("../ErrorHandlers/AppError");
const asyncHandler = require("express-async-handler");

const messagesFinder = asyncHandler(async (req, res, next) => {
  const { sender, reciever } = req.body;
  const keyword = req.params.messages
    ? {
        $or: [
          { name: { $regex: req.params.trainer, $options: "i" } },
          { email: { $regex: req.params.trainer, $options: "i" } },
        ],
      }
    : {};

  const foundMessages = await OneToOneMessage.find({
    sender,
    reciever,
    content: keyword,
  });

  console.log(foundMessages);
});

const searchServers = asyncHandler(async (req, res, next) => {
  const name = req.query.name;
  const regex = new RegExp(name, "i");

  const servers = await Server.find({
    name: { $regex: regex },
    privacy: "public",
  }).populate("members");

  return res.status(200).json({
    servers,
  });
});

module.exports = { messagesFinder, searchServers };
