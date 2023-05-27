const mongoose = require("mongoose");

const voiceChannelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      lowercase: true,
      required: [true, "Please add the Channel name"],
    },
    server: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please add the server it belongs to"],
    },
    current: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = new mongoose.model("VoiceChannel", voiceChannelSchema);
