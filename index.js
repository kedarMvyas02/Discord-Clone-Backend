const app = require("./app");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const User = require("./models/userModel");
const OneToOneMessage = require("./models/OneToOneMessageModel");
//////////////////////////////////////////////////////////////////////////////////

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// io.on("connection", async (socket) => {
//   const user_id = socket.handshake.query.user_id;
//   const dmId = socket.handshake.query.dmId;
//   console.log("user_id", user_id);
//   console.log("dmId", dmId);

//   // console.log(`User connected ${socket.id}`);

//   if (user_id != null && Boolean(user_id)) {
//     try {
//       const user = await User.findByIdAndUpdate(user_id, {
//         socket_id: socket.id,
//         status: "Online",
//       });
//       // console.log(user);
//     } catch (e) {
//       // console.log("error che", e);
//     }
//   }

//   // Handle incoming text/link messages
//   socket.on("text_message", async (data) => {
//     console.log("Received message:", data);

//     // data: {to, from, text}

//     const { from, to, message } = data;

//     const to_user = await User.findById(to);
//     const from_user = await User.findById(from);

//     // message => {to, from, type, created_at, text, file}

//     const new_message = {
//       to: to,
//       from: from,
//       // created_at: Date.now(),
//       text: message,
//     };

//     const chat = await OneToOneMessage.create({
//       reciever: to_user._id,
//       sender: from_user._id,
//       text: message,
//     });

//     console.log("TO socket id", to_user?.socket_id);
//     io.to(to_user?.socket_id).emit("new_message", {
//       chat,
//       message: new_message,
//     });

//     // emit outgoing_message -> from user
//     console.log("FROM socket id", from_user?.socket_id);
//     console.log("MARI ID", socket.id);
//     io.to(from_user?.socket_id).emit("new_message", {
//       chat,
//       message: new_message,
//     });
//   });

//   socket.on("end", async (data) => {
//     // Find user by ID and set status as offline
//     if (data.user_id) {
//       await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
//     }

//     // broadcast to all conversation rooms of this user that this user is offline (disconnected)

//     console.log("closing connection");
//     socket.disconnect(0);
//   });
// });
//////////////////////////////////////////////////////////////////////////////////

server.listen(process.env.PORT, () => {
  console.log(`Listening on port: ${process.env.PORT}`);
});
