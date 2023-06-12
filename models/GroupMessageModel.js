const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TextChannel",
    },
    content: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const GroupMessage = new mongoose.model("GroupMessage", groupMessageSchema);
module.exports = GroupMessage;
