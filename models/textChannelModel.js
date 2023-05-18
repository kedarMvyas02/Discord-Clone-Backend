const mongoose = require("mongoose");

const textChannelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
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

module.exports = new mongoose.model("TextChannel", textChannelSchema);
