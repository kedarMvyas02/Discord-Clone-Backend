const app = require("./app");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const User = require("./models/userModel");
const OneToOneMessage = require("./models/OneToOneMessageModel");
const AppError = require("./ErrorHandlers/AppError");
const Dm = require("./models/DmModel");
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

  socket.on("add-user", (user_id) => {
    allUsers.set(user_id.user_id, socket.id);
    console.log(allUsers);
  });

  // Handle incoming text messages
  socket.on("text_message", async (data) => {
    const { from, to, message } = data;

    const from_user = await User.findById(from); // req.user
    const to_user = await User.findById(to); // friend

    // const dmExist = Dm.findOne({
    //   user: to_user, // friend
    //   friend: from_user, // req.user
    // });

    // if (!dmExist) {
    //   await Dm.create({
    //     user: to_user, // friend
    //     friend: from_user, // req.user
    //   });

    //   const dmFriends = await Dm.find({ to_user }).populate("user").lean();
    //   if (!dmFriends) return next(new AppError(`No user exist in your dm`));

    //   const data = dmFriends.map((item) => {
    //     const { name, uniqueCode, email, userImage, _id } = item.friend;
    //     return { _id, name, uniqueCode, email, userImage };
    //   });

    //   io.emit("got_dm_friends", data);
    // }
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
  socket.on("join-room", (roomName) => {
    socket.join(roomName);
    socket.on("channel-message");
    socket.emit("message", message);
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
