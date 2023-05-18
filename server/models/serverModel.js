const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add the Server name"],
    },
    channels: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Channel",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add the Owner name"],
    },
    avatar: {
      type: String,
      required: [true, "Please add an Image"],
    },
    users: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = new mongoose.model("Server", serverSchema);
