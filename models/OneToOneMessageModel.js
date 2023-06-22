const mongoose = require("mongoose");

const oneToOneMessage = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

const OneToOneMessage = new mongoose.model("OneToOneMessage", oneToOneMessage);
module.exports = OneToOneMessage;
