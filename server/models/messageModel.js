const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add the server it belongs to"],
    },
    content: {
      type: String,
      required: [true, "Please add the Channel name"],
    },
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Server",
      //   required: [true, "Please add the server it belongs to"],
    },
    channels: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Channel",
      //   unique: [true, "This channel name already exists"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = new mongoose.model("Message", messageSchema);
