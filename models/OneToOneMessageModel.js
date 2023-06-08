const mongoose = require("mongoose");

const oneToOneMessage = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
    },
    reciever: {
      type: mongoose.Schema.Types.ObjectId,
    },
    text: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = new mongoose.model("OneToOneMessage", oneToOneMessage);
