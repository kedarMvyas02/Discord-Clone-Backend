const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const Server = require("../models/serverModel");
const { default: mongoose } = require("mongoose");
const TextChannel = require("../models/textChannelModel");

////////////////////////////////////////////////////// CREATE TEXT CHANNEL ////////////////////////////////////////////////////////////////////////////////

const createTextChannel = asyncHandler(async (req, res, next) => {
  const name = req.body.name;
  const id = req.params.id;

  if (!name) return next(new AppError("Name is compulsory", 400));
  if (!id) return next(new AppError("ID is not present in the parameter", 400));
  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("ID is invalid", 400));

  const serverExists = await Server.findById(id);
  if (!serverExists) return next(new AppError("Server not found", 404));

  if (serverExists.owner.toString() !== req.user.id)
    return next(
      new AppError(
        "You are not Admin of this server, so can't create channel in this server",
        401
      )
    );

  const channelExists = await TextChannel.find({ name });
  if (channelExists.length > 0)
    return next(new AppError("Channel Name is taken", 400));

  const created = await TextChannel.create({
    name,
    server: id,
  });

  if (!created) return next(new AppError("Text channel didn't created", 500));

  return res.status(201).json({
    message: "Channel Created Successfully",
    created,
  });
});

////////////////////////////////////////////////////// DELETE TEXT CHANNEL ////////////////////////////////////////////////////////////////////////////////

const deleteTextChannel = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new AppError("ID is not present in the parameter"));

  const currServer = await Server.findById(id);
  if (!currServer) return next(new AppError("Server not found", 404));

  if (currServer.owner.toString() !== req.user.id) {
    return next(
      new AppError("You are not authorized to delete this server", 401)
    );
  }

  const deleted = await currServer.deleteOne({ id });

  if (deleted) {
    // TODO delete channels, messages, members...

    return res.status(200).json({
      message: "Server has been deleted successfully",
    });
  } else {
    return next(new AppError("Server has not been deleted", 500));
  }
});

////////////////////////////////////////////////////// GET TEXT CHANNEL ////////////////////////////////////////////////////////////////////////////////

const getTextChannel = asyncHandler(async (req, res, next) => {});

module.exports = {
  createTextChannel,
  deleteTextChannel,
  getTextChannel,
};
