const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add the Server name"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add the Owner name"],
    },
    avatar: {
      type: String,
      required: [true, "Please add an Image"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

serverSchema.virtual("members", {
  ref: "Member",
  localField: "_id",
  foreignField: "server",
});

serverSchema.virtual("textChannels", {
  ref: "TextChannel",
  localField: "_id",
  foreignField: "server",
});

serverSchema.virtual("voiceChannels", {
  ref: "VoiceChannel",
  localField: "_id",
  foreignField: "server",
});

module.exports = new mongoose.model("Server", serverSchema);
