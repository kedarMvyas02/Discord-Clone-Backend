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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

groupMessageSchema.virtual("user", {
  ref: "User",
  localField: "sender",
  foreignField: "_id",
});

const GroupMessage = new mongoose.model("GroupMessage", groupMessageSchema);
module.exports = GroupMessage;
