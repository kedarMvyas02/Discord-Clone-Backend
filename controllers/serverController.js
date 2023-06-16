const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const Server = require("../models/serverModel");
const { default: mongoose } = require("mongoose");
const Member = require("../models/memeberModel");
const TextChannel = require("../models/textChannelModel");
const VoiceChannel = require("../models/voiceChannelModel");
const cloudinary = require("cloudinary").v2;
const axios = require("axios");
require("dotenv").config();

////////////////////////////////////////////////////// CREATE SERVER ////////////////////////////////////////////////////////////////////////////////
const createServer = asyncHandler(async (req, res, next) => {
  // Cloudinary configuration
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
  });
  const { name, avatar } = req.body;
  if (!name) return next(new AppError("please write name of the server", 400));
  if (!avatar) return next(new AppError("please add an image", 400));

  const serverExists = await Server.find({ name, owner: req.user.id });
  if (serverExists.length > 0)
    return next(new AppError("Server Already Exists"), 405);

  // const uploadResult = await cloudinary.uploader.upload(imagePath[0].path);
  // const avatarUrl = uploadResult.secure_url;

  const newServer = await Server.create({
    name,
    owner: req.user.id,
    avatar,
  });

  await Member.create({
    server: newServer._id,
    user: req.user.id,
  });

  await TextChannel.create({
    name: "general",
    server: newServer._id,
  });

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

  const createdRoom = response.data;
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

  await VoiceChannel.create({
    name: "general",
    server: newServer._id,
    roomCode,
  });

  res.status(201).json({
    msg: "server created successfully",
    server: newServer,
  });
});

////////////////////////////////////////////////////// UPDATE SERVER ////////////////////////////////////////////////////////////////////////////////

const updateServer = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const { name, avatar } = req.body;

  if (!id) return next(new AppError("ID is not present in the parameter", 400));
  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("ID is invalid", 400));

  const currServer = await Server.findById(id);
  if (!currServer) return next(new AppError("Server not found", 404));

  if (currServer.owner.toString() !== req.user.id) {
    return next(
      new AppError("You are not authorized to update this server", 401)
    );
  }

  const updated = await Server.findOneAndUpdate(
    { _id: id },
    { name, avatar },
    { new: true }
  );

  if (!updated) return next(new AppError("Server didn't updated", 500));

  return res.status(200).json({
    message: "Server Updated Successfully",
    _id: updated._id,
    name: updated.name,
  });
});

////////////////////////////////////////////////////// DELETE SERVER ////////////////////////////////////////////////////////////////////////////////

const deleteServer = asyncHandler(async (req, res, next) => {
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

////////////////////////////////////////////////////// GET SERVER ////////////////////////////////////////////////////////////////////////////////

const getServer = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  // let currServer;

  if (!id) return next(new AppError("No id in params", 400));

  const currServer = await Server.findById(id)
    .populate({
      path: "textChannels",
      select: "name _id -server",
    })
    .populate({
      path: "voiceChannels",
      select: "name _id roomCode -server",
    })
    .lean();

  if (!currServer) return next(new AppError("Server not found", 404));

  return res.status(200).json({
    message: "Server found successfully",
    server: currServer,
  });
  // } else {
  //   currServer = await Server.find()
  //     .populate({
  //       path: "textChannels",
  //       select: "name -_id -server",
  //     })
  //     .populate({
  //       path: "voiceChannels",
  //       select: "name -_id -server",
  //     })
  //     .lean();
  //   if (!currServer) return next(new AppError("No Server found", 404));

  //   const allServers = currServer.map((server) => {
  //     const {
  //       createdAt,
  //       updatedAt,
  //       __v,
  //       textChannels,
  //       voiceChannels,
  //       ...rest
  //     } = server;
  //     return {
  //       ...rest,
  //       textChannels: textChannels.map(({ name }) => name),
  //       voiceChannels: voiceChannels.map(({ name }) => name),
  //     };
  //   });

  //   return res.status(200).json({
  //     message: "Server found successfully",
  //     server: allServers,
  //   });
  // }
});

////////////////////////////////////////////////////// GET SERVER DYNAMICALLY ////////////////////////////////////////////////////////////////////////////////

const getJoinedServers = asyncHandler(async (req, res, next) => {
  const joinedServers = await Member.find({ user: req.user.id })
    .populate({
      path: "servers",
      select: "name _id avatar",
    })
    .lean();
  if (joinedServers.length == 0)
    return next(new AppError("You haven't joined any servers yet", 404));

  const allServers = joinedServers.map((server) => {
    const { createdAt, updatedAt, __v, servers, _id, ...rest } = server;
    return {
      _id: servers.map(({ _id }) => _id)[0],
      // name: servers.map(({ name }) => name)[0],
      // avatar: servers.map(({ avatar }) => avatar)[0],
    };
  });

  const temp = allServers.map((server) => server._id);

  const kedar = await Server.find({ _id: { $in: temp } })
    .populate("textChannels")
    .populate("voiceChannels")
    .exec();

  const responseWithChannels = {
    allServers: kedar.map((server) => ({
      _id: server._id,
      name: server.name,
      avatar: server.avatar,
      textChannels: server.textChannels,
      voiceChannels: server.voiceChannels,
    })),
  };

  return res.status(200).json({
    responseWithChannels,
  });
});

const joinServer = asyncHandler(async (req, res, next) => {
  const serverId = req.params.id;
  const user = req.user.id;
  const servers = await Server.findById(serverId);
  if (!servers) return next(new AppError("server not found", 404));

  const joinedServers = await Member.findOne({
    user: req.user.id,
    server: serverId,
  });
  if (joinedServers)
    return next(new AppError("You have already joined this server", 400));

  const joined = await Member.create({
    server: serverId,
    user,
  });

  if (!joined)
    return next(
      new AppError(
        "Something went wrong and you were not joined in this server"
      )
    );

  return res.status(200).json({
    msg: "You have successfully joined the server",
  });
});

const leaveServer = asyncHandler(async (req, res, next) => {
  const serverId = req.params.id;
  const user = req.user.id;
  const servers = await Server.findById(serverId);
  if (!servers) return next(new AppError("server not found", 404));

  const joinedServers = await Member.findOne({
    user: req.user.id,
    server: serverId,
  });
  if (!joinedServers)
    return next(new AppError("You haven't joined this server yet", 403));

  const left = await Member.deleteOne({
    server: serverId,
    user,
  });

  if (!left)
    return next(
      new AppError("Something went wrong and you have not left this server")
    );

  return res.status(200).json({
    msg: "You have successfully left the server",
  });
});

module.exports = {
  createServer,
  updateServer,
  deleteServer,
  getServer,
  getJoinedServers,
  joinServer,
  leaveServer,
};
