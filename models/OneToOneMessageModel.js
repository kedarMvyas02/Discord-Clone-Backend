const mongoose = require("mongoose");

const oneToOneMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reciever: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    read: {
      type: [mongoose.Types.ObjectId],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

const OneToOneMessage = new mongoose.model(
  "OneToOneMessage",
  oneToOneMessageSchema
);
module.exports = OneToOneMessage;
