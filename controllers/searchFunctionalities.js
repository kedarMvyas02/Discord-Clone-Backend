const OneToOneMessage = require("../models/OneToOneMessageModel");
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

module.exports = messagesFinder;
