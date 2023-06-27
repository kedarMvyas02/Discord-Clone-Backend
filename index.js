const app = require("./app");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const User = require("./models/userModel");
const OneToOneMessage = require("./models/OneToOneMessageModel");
const Dm = require("./models/DmModel");
const GroupMessage = require("./models/GroupMessageModel");
const Member = require("./models/memeberModel");
//////////////////////////////////////////////////////////////////////////////////

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const allUsers = new Map();

io.on("connection", async (socket) => {
  // const user_id = socket.handshake.query.user_id;
  // const dmId = socket.handshake.query.dmId;

  //============= LOGGING-IN USER ==============
  socket.on("add-user", ({ user_id }) => {
    allUsers.set(user_id, { socketId: socket.id, status: "online" });
    allUsers.forEach((value, key) => {
      if (key === undefined) {
        allUsers.delete(key);
      }
    });
    console.log(allUsers);
  });

  //============= PRIVATE CHATTING ==============
  socket.on("text_message", async (data) => {
    const { from, to, message } = data;

    const from_user = await User.findById(from);
    const to_user = await User.findById(to);

    const dmExist = await Dm.findOne({
      user: to_user,
      friend: from_user,
    });
    if (!dmExist) {
      await Dm.create({
        user: to_user,
        friend: from_user,
      });
    }

    let populatedChat;
    try {
      const chat = await OneToOneMessage.create({
        reciever: to_user._id,
        sender: from_user._id,
        content: message,
      });

      populatedChat = await OneToOneMessage.populate(chat, [
        {
          path: "sender",
          select: "name _id uniqueCode email userImage status createdAt",
        },
        {
          path: "reciever",
          select: "name _id uniqueCode email userImage status createdAt",
        },
      ]);
    } catch (error) {
      console.log(error);
    }

    const toSocketId = allUsers.get(to);
    console.log(toSocketId.socketId);

    if (toSocketId.socketId) {
      io.to(toSocketId.socketId).emit("navoMessage", {
        populatedChat,
      });
    }
  });

  //============= SERVER CHATTING ==============
  socket.on("channel-message", async (data) => {
    const { from, to, server, message } = data;
    const from_user = await User.findById(from);

    let populatedChat;
    try {
      const chat = await GroupMessage.create({
        sender: from_user._id,
        channel: to,
        content: message,
      });
      populatedChat = await GroupMessage.populate(chat, [
        {
          path: "sender",
          select: "name _id uniqueCode email userImage status createdAt",
        },
        {
          path: "channel",
          select: "_id name",
        },
      ]);
    } catch (error) {
      console.log(error);
    }

    const serverMembers = await Member.find({ server });

    let temp = [];
    serverMembers.map((item) => {
      const userId = item.user.toString();
      const userToken = allUsers.get(userId);
      temp.push(userToken.socketId);
    });

    if (temp) {
      temp.forEach((item) => {
        io.to(item).emit("message", {
          populatedChat,
        });
      });
    }
  });

  //============= ONE TO ONE CALL ==============
  socket.on("private-call", async (data) => {
    const { from, to } = data;

    const from_user = await User.findById(from);

    const toSocketId = allUsers.get(to);
    console.log(toSocketId.socketId);

    if (toSocketId.socketId) {
      io.to(toSocketId.socketId).emit("incoming-call", {
        from_user,
      });
    }
  });

  //============= USER JOINED VC ==============
  socket.on("user-joined-vc", async (data) => {
    const { user, server, channel } = data;

    const serverMembers = await Member.find({ server });

    let temp = [];
    serverMembers.map((item) => {
      const userId = item.user.toString();
      const userToken = allUsers.get(userId);
      temp.push(userToken.socketId);
    });

    if (temp) {
      temp?.forEach((item) => {
        io.to(item).emit("joining-vc-update", {
          user,
          server,
          channel,
        });
      });
    }
  });

  //============= USER LEAVING VC ==============
  socket.on("leaving-vc", async (data) => {
    io.emit("leaving-vc-update", data);
  });

  //============= FRIEND REQ ==============
  socket.on("friendReqArrived", async (data) => {
    const from_user = await User.findOne({ _id: data?.from });
    const to_user = await User.findOne({ uniqueCode: data?.to });

    const stringId = to_user._id.toString();
    const toSocketId = allUsers.get(stringId);
    console.log(toSocketId.socketId);

    if (toSocketId.socketId) {
      io.to(toSocketId.socketId).emit("friendReqCame", {
        from_user,
      });
    }
  });

  //============= REJECTED REQ ==============
  socket.on("rejected-call", async (data) => {
    const { from, to } = data;

    const from_user = await User.findById(from);

    const toSocketId = allUsers.get(to);
    console.log(toSocketId.socketId);

    if (toSocketId.socketId) {
      io.to(toSocketId.socketId).emit("call-rejected", {
        from_user,
      });
    }
  });

  socket.on("disconnect", () => {
    allUsers.forEach((value, key) => {
      if (value.socketId === socket.id) {
        value.status = "offline";
        // allUsers.delete(key);
        console.log(allUsers);
      }
    });
  });
});
//////////////////////////////////////////////////////////////////////////////////

server.listen(process.env.PORT, () => {
  console.log(`Listening on port: ${process.env.PORT}`);
});
