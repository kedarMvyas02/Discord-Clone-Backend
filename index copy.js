const app = require("./app");

app.listen(process.env.PORT, () => {
  console.log(`Listening on port: ${process.env.PORT}`);
});

// // ORIGINAL WORKING CONDITION
// const socketIdToDmIdMap = new Map();
// io.on("connection", (socket) => {
  // const user_id = socket.handshake.query.user_id;
  // const dmId = socket.handshake.query.dmId;

//   // Store the mapping of dmId to socket ID
//   socketIdToDmIdMap.set(dmId, socket.id);
//   console.log("socketIdToDmIdMap:", socketIdToDmIdMap);

//   socket.on("chat message", (data) => {
//     const { dmId, message } = data;
//     const socketId = socketIdToDmIdMap.get(dmId);
//     console.log("Received message:", message);
//     console.log("Sending to socketId:", socketId);
//     io.to(socketId).emit("kedar", message);
//   });

//   socket.on("disconnect", () => {
//     console.log("A user disconnected");
//   });
// });
