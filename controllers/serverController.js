const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const Server = require("../models/serverModel");
const { default: mongoose } = require("mongoose");
const Member = require("../models/memeberModel");
const TextChannel = require("../models/textChannelModel");
const VoiceChannel = require("../models/voiceChannelModel");
const cloudinary = require("cloudinary").v2;
const axios = require("axios");
const User = require("../models/userModel");
const GroupMessage = require("../models/GroupMessageModel");
require("dotenv").config();

/////////// CREATE SERVER //////////////
const createServer = asyncHandler(async (req, res, next) => {
  // Cloudinary configuration
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
  });
  const { name, avatar, description, privacy, serverType } = req.body;
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
    description,
    privacy,
    serverType,
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

/////////// UPDATESERVER //////////////
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

/////////// DELETE SERVER //////////////
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
  const allTextChannels = await TextChannel.find({ server: id });

  if (deleted) {
    await TextChannel.deleteMany({ server: id });
    await VoiceChannel.deleteMany({ server: id });
    await Member.deleteMany({ server: id });
    allTextChannels.forEach(async (id) => {
      await GroupMessage.deleteMany({ channel: id._id });
    });

    return res.status(200).json({
      message: "Server has been deleted successfully",
    });
  } else {
    return next(new AppError("Server has not been deleted", 500));
  }
});

/////////// GET SERVER BY ID //////////////
const getServer = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  // let currServer;

  if (!id) return next(new AppError("No id in params", 400));

  const currServer = await Server.findById(id)
    .populate({
      path: "textChannels",
      select: "name _id grpMessages -server",
      populate: {
        path: "grpMessages",
        // select: "sender channel content unread",
      },
    })
    .populate({
      path: "voiceChannels",
      select: "name _id roomCode -server",
    })
    .populate({
      path: "members",
      select: "user _id server",
      populate: {
        path: "user",
        select:
          "name uniqueCode _id userImage email createdAt phoneNumber status",
      },
    })
    .lean();

  const memberExist = currServer?.members?.filter((item) => {
    return item?.user?._id.toString() === req.user.id;
  });
  if (memberExist.length === 0)
    return next(new AppError("You haven't joined this server!", 400));

  const updatedTextChannels = currServer?.textChannels?.map((item) => {
    const { grpMessages, ...rest } = item;
    let counter = 0;
    grpMessages?.map((val) => {
      const kedar = val.unread.filter((id) => id == req.user.id);
      if (kedar?.length > 0) {
        counter++;
      }
    });

    return { unreadMessages: counter, ...rest };
  });

  if (!currServer) return next(new AppError("Server not found", 404));

  return res.status(200).json({
    message: "Server found successfully",
    server: { ...currServer, textChannels: updatedTextChannels },
  });

  // return res.status(200).json({
  //   message: "Server found successfully",
  //   server: currServer,
  // });
});

/////////// GET JOINED SERVERS //////////////
const getJoinedServers = asyncHandler(async (req, res, next) => {
  const joinedServers = await Member.find({ user: req.user.id })
    .populate({
      path: "servers",
      select: "name _id avatar",
    })
    .lean();

  // if (joinedServers.length == 0)
  //   return next(new AppError("You haven't joined any servers yet", 404));

  const allServers = joinedServers?.map((server) => {
    const { createdAt, updatedAt, __v, servers, _id, ...rest } = server;
    return {
      _id: servers?.map(({ _id }) => _id)[0],
      // name: servers.map(({ name }) => name)[0],
      // avatar: servers.map(({ avatar }) => avatar)[0],
    };
  });

  const temp = allServers?.map((server) => server?._id);

  const kedar = await Server.find({ _id: { $in: temp } })
    .populate("textChannels")
    .populate("voiceChannels")
    .populate("members")
    .exec();

  const responseWithChannels = {
    allServers: kedar?.map((server) => ({
      _id: server._id,
      name: server.name,
      avatar: server.avatar,
      textChannels: server.textChannels,
      voiceChannels: server.voiceChannels,
      members: server.members,
    })),
  };

  return res.status(200).json({
    responseWithChannels,
  });
});

/////////// JOIN A SERVER //////////////
const joinServer = asyncHandler(async (req, res, next) => {
  const serverId = req.params.id;
  const code = req.body.uniqueCode;

  const user = await User.findOne({ uniqueCode: code });
  if (!user)
    return next(
      new AppError(
        "User does not exists, please check the unique code and try again",
        404
      )
    );

  const servers = await Server.findById(serverId);
  if (!servers) return next(new AppError("server not found", 404));

  const joinedServers = await Member.findOne({
    user: user._id,
    server: serverId,
  });

  if (joinedServers)
    return next(new AppError("User has already joined this server", 400));

  const joined = await Member.create({
    server: serverId,
    user: user._id,
  });

  if (!joined)
    return next(
      new AppError(
        "Something went wrong and User was not able to join in this server"
      )
    );

  return res.status(200).json({
    msg: "User have successfully joined the server",
  });
});

/////////// LEAVE A SERVER //////////////
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
    return next(new AppError("You haven't joined this server yet", 400));

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

/////////// GET MEMBERS OF SERVER //////////////
const getMembers = asyncHandler(async (req, res, next) => {
  const serverId = req.params.id;

  const servers = await Server.findById(serverId);
  if (!servers) return next(new AppError("server not found", 404));

  const allMembers = await Member.find({
    server: serverId,
  });

  if (!allMembers) return next(new AppError("There are no members yet!", 404));

  return res.status(200).json({
    allMembers,
  });
});

/////////// GET ALL PUBLIC SERVERS //////////////
const getPublicServers = asyncHandler(async (req, res, next) => {
  const publicServers = await Server.find({ privacy: "public" }).populate(
    "members"
  );
  if (!publicServers) return next(new AppError("No public Servers", 404));

  res.status(200).json({
    publicServers,
  });
});

module.exports = {
  createServer,
  updateServer,
  deleteServer,
  joinServer,
  leaveServer,
  getServer,
  getMembers,
  getJoinedServers,
  getPublicServers,
};
