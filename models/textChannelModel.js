const mongoose = require("mongoose");

const textChannelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      lowercase: true,
      required: [true, "Please add the Channel name"],
    },
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Server",
      required: [true, "Please add the server it belongs to"],
    },
  },
  {
    timestamps: true,
  }
);

const TextChannel = new mongoose.model("TextChannel", textChannelSchema);
module.exports = TextChannel;
