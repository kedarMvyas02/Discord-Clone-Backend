const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const Server = require("../models/serverModel");
const VoiceChannel = require("../models/voiceChannelModel");
const { default: mongoose } = require("mongoose");

////////////////////////////////////////////////////// CREATE VOICE CHANNEL ////////////////////////////////////////////////////////////////////////////////

const createVoiceChannel = asyncHandler(async (req, res, next) => {
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

  const channelExists = await VoiceChannel.find({ name, server: id });
  if (channelExists.length > 0)
    return next(new AppError("Channel Name is taken", 400));

  const created = await VoiceChannel.create({
    name,
    server: id,
  });

  if (!created) return next(new AppError("Voice channel didn't created", 500));

  return res.status(201).json({
    message: "Channel Created Successfully",
    created,
  });
});

////////////////////////////////////////////////////// UPDATE VOICE CHANNEL ////////////////////////////////////////////////////////////////////////////////

const updateVoiceChannel = asyncHandler(async (req, res, next) => {});

////////////////////////////////////////////////////// DELETE VOICE CHANNEL ////////////////////////////////////////////////////////////////////////////////

const deleteVoiceChannel = asyncHandler(async (req, res, next) => {});

////////////////////////////////////////////////////// GET VOICE CHANNEL ////////////////////////////////////////////////////////////////////////////////

const getVoiceChannel = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const server = await Server.findById(id);
  if (!server) return next(new AppError("Server not found", 404));

  const voiceChannels = await VoiceChannel.find({ server: server._id });
  return res.status(200).json({
    voiceChannels,
  });
});

module.exports = {
  createVoiceChannel,
  updateVoiceChannel,
  deleteVoiceChannel,
  getVoiceChannel,
};
