const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const OneToOneMessage = require("../models/OneToOneMessageModel");

const getDmMessages = asyncHandler(async (req, res, next) => {
  try {
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
  } catch (error) {
    console.log(error); // Log the error message for debugging purposes
    return next(new AppError("An error occurred while fetching messages", 500));
  }
});

// // not proper, made for fun
// const createMessage = asyncHandler(async (req, res, next) => {
//   const id = req.params.id;
//   const content = req.body.content;

//   const messages = await OneToOneMessage.create({
//     sender: id,
//     reciever: req.user.id,
//     content,
//   });

//   if (!messages)
//     return next(new AppError("Smthng went wrong with creating msg", 500));

//   return res.status(200).json({
//     messages,
//   });
// });

module.exports = {
  getDmMessages,
  // createMessage,
};
