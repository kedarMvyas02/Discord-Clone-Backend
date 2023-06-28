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
    pinned: {
      type: Boolean,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

const GroupMessage = new mongoose.model("GroupMessage", groupMessageSchema);
module.exports = GroupMessage;
