const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const Server = require("../models/serverModel");
const VoiceChannel = require("../models/voiceChannelModel");
const { default: mongoose } = require("mongoose");
const axios = require("axios");

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

  const channelExists = await VoiceChannel.find({ name, server: id });
  if (channelExists.length > 0)
    return next(new AppError("Channel Name is taken", 400));

  // generate a room
  const template_id = process.env.TEMPLATE_ID;
  const managementToken = process.env.MANAGEMENT_TOKEN;
  const roomUrl = "https://api.100ms.live/v2/rooms";

  const requestData = {
    name: `${req.user.name}_${Date.now()}`,
    description: "This is a sample description for the room",
    template_id: template_id,
    region: "in",
  };

  const response = await axios.post(roomUrl, requestData, {
    headers: {
      Authorization: `Bearer ${managementToken}`,
      "Content-Type": "application/json",
    },
  });

  const createdRoom = response?.data;
  console.log("Room created id:", createdRoom?.id);

  // create room code

  const roomId = createdRoom?.id;
  const roomCodeUrl = `https://api.100ms.live/v2/room-codes/room/${roomId}`;

  const resp = await axios.post(roomCodeUrl, null, {
    headers: {
      Authorization: `Bearer ${managementToken}`,
      "Content-Type": "application/json",
    },
  });

  const roomCode = resp.data.data[0].code;
  console.log("Room code created:", roomCode);

  const created = await VoiceChannel.create({
    name,
    server: id,
    roomCode,
  });

  if (!created) return next(new AppError("Voice channel didn't created", 500));

  return res.status(201).json({
    message: "Channel Created Successfully",
    created,
  });
});

////////////////////////////////////////////////////// UPDATE VOICE CHANNEL ////////////////////////////////////////////////////////////////////////////////

const updateVoiceChannel = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const { name } = req.body;

  if (!id) return next(new AppError("ID is not present in the parameter", 400));
  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("ID is invalid", 400));

  const currVoiceChannel = await VoiceChannel.findById(id);
  if (!currVoiceChannel)
    return next(new AppError("Voice Channel not found", 404));

  const updated = await VoiceChannel.findOneAndUpdate(
    { _id: id },
    { name },
    { new: true }
  );

  if (!updated) return next(new AppError("Voice Channel didn't updated", 500));

  return res.status(200).json({
    message: "Voice Channel Updated Successfully",
    _id: updated._id,
    name: updated.name,
  });
});

////////////////////////////////////////////////////// DELETE VOICE CHANNEL ////////////////////////////////////////////////////////////////////////////////

const deleteVoiceChannel = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new AppError("ID is not present in the parameter"));

  const deleted = await VoiceChannel.findByIdAndDelete(id, { new: true });

  if (deleted) {
    return res.status(200).json({
      message: "Text Channel has been deleted successfully",
    });
  } else {
    return next(new AppError("Text Channel has not been deleted", 500));
  }
});

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

////////////////////////////////////////////////////// JOIN VOICE CHANNEL ////////////////////////////////////////////////////////////////////////////////

const joinVoiceChannel = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const channelExists = await VoiceChannel.findById(id);
  if (!channelExists) return next(new AppError("Channel does not exists", 404));

  if (channelExists.current.includes(req.user.id))
    return next(new AppError("You have already joined this channel", 400));

  const updated = await VoiceChannel.findByIdAndUpdate(
    id,
    { $push: { current: req.user.id } },
    { new: true }
  ).populate({
    path: "current",
    select: "name _id uniqueCode email userImage status createdAt",
  });

  if (!updated)
    return next(
      new AppError(
        "Something went wrong while adding you inside voice channel",
        500
      )
    );

  return res.status(200).json({
    msg: "You have successfully joined the channel",
    updated,
  });
});

////////////////////////////////////////////////////// LEAVE VOICE CHANNEL ////////////////////////////////////////////////////////////////////////////////

const leaveVoiceChannel = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const channelExists = await VoiceChannel.findById(id);
  if (!channelExists) return next(new AppError("Channel does not exists", 404));

  if (!channelExists.current.includes(req.user.id))
    return next(new AppError("You haven't joined the channel", 400));

  const updated = await VoiceChannel.findByIdAndUpdate(
    id,
    { $pull: { current: req.user.id } },
    { new: true }
  ).populate({
    path: "current",
    select: "name _id uniqueCode email userImage status createdAt",
  });

  if (!updated)
    return next(
      new AppError(
        "Something went wrong while leaving from the voice channel",
        500
      )
    );

  return res.status(200).json({
    msg: "You have successfully left the channel",
    updated,
  });
});

////////////////////////////////////////////////////// LEAVE VOICE CHANNEL ////////////////////////////////////////////////////////////////////////////////

const getJoinedInVoiceChannel = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const channelExists = await VoiceChannel.findById(id).populate({
    path: "current",
    select: "name _id uniqueCode email userImage status createdAt",
  });

  if (!channelExists) return next(new AppError("Channel does not exists", 404));
  if (channelExists.current.length == 0)
    return next(
      new AppError("There are no members joined in the voice channel", 400)
    );

  return res.status(200).json({
    joinedMembers: channelExists.current,
  });
});

module.exports = {
  createVoiceChannel,
  updateVoiceChannel,
  deleteVoiceChannel,
  getVoiceChannel,
  joinVoiceChannel,
  leaveVoiceChannel,
  getJoinedInVoiceChannel,
};
