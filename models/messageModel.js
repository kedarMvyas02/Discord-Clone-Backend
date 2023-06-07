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
    channel: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Channel",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = new mongoose.model("Message", messageSchema);
