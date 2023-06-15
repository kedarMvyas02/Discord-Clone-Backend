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

  socket.on("add-user", ({ user_id }) => {
    allUsers.set(user_id, socket.id);
    console.log(allUsers);
  });

  // Handle incoming text messages
  socket.on("text_message", async (data) => {
    const { from, to, message } = data;

    const from_user = await User.findById(from); // req.user
    const to_user = await User.findById(to); // friend

    const dmExist = await Dm.findOne({
      user: to_user, // friend
      friend: from_user, // req.user
    });
    if (!dmExist) {
      await Dm.create({
        user: to_user, // friend
        friend: from_user, // req.user
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
    console.log(toSocketId);

    if (toSocketId) {
      io.to(toSocketId).emit("navoMessage", {
        populatedChat,
      });
    }
  });

  //============= SERVER CHATTING ==============

  socket.on("channel-message", async (data) => {
    const { from, to, server, message } = data;
    const from_user = await User.findById(from); // req.user

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
      temp.push(userToken);
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

    const toSocketId = allUsers.get(to);
    console.log(toSocketId);

    if (toSocketId) {
      io.to(toSocketId).emit("incoming-call", {
        from,
      });
    }
  });

  socket.on("end", async (data) => {
    // Find user by ID and set status as offline
    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
    }

    // broadcast to all conversation rooms of this user that this user is offline (disconnected)

    console.log("closing connection");
    socket.disconnect(0);
  });
});
//////////////////////////////////////////////////////////////////////////////////

server.listen(process.env.PORT, () => {
  console.log(`Listening on port: ${process.env.PORT}`);
});
