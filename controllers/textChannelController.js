const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const Server = require("../models/serverModel");
const { default: mongoose } = require("mongoose");
const TextChannel = require("../models/textChannelModel");
const GroupMessage = require("../models/GroupMessageModel");

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

  const channelExists = await TextChannel.find({ name, server: id });
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

/////////// UPDATE TEXT CHANNEL //////////////
const updateTextChannel = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const { name } = req.body;

  if (!id) return next(new AppError("ID is not present in the parameter", 400));
  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("ID is invalid", 400));

  const currTextChannel = await TextChannel.findById(id);
  if (!currTextChannel)
    return next(new AppError("Text Channel not found", 404));

  const updated = await TextChannel.findOneAndUpdate(
    { _id: id },
    { name },
    { new: true }
  );

  if (!updated) return next(new AppError("Text Channel didn't updated", 500));

  return res.status(200).json({
    message: "Text Channel Updated Successfully",
    _id: updated._id,
    name: updated.name,
  });
});

////////////////////////////////////////////////////// DELETE TEXT CHANNEL ////////////////////////////////////////////////////////////////////////////////

const deleteTextChannel = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new AppError("ID is not present in the parameter"));

  const deleted = await TextChannel.findByIdAndDelete(id, { new: true });

  if (deleted) {
    await GroupMessage.deleteMany({ channel: id });

    return res.status(200).json({
      message: "Text Channel has been deleted successfully",
    });
  } else {
    return next(new AppError("Text Channel has not been deleted", 500));
  }
});

////////////////////////////////////////////////////// GET TEXT CHANNEL ////////////////////////////////////////////////////////////////////////////////

const getTextChannel = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const server = await Server.findById(id);
  if (!server) return next(new AppError("Server not found", 404));

  const textChannels = await TextChannel.find({ server: server._id });
  return res.status(200).json({
    textChannels,
  });
});

module.exports = {
  createTextChannel,
  getTextChannel,
  updateTextChannel,
  deleteTextChannel,
};
