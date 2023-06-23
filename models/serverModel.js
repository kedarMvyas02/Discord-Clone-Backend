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
    description: {
      type: String,
    },
    privacy: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    serverType: {
      type: String,
      enum: [
        "gaming",
        "music",
        "education",
        "scienceAndTech",
        "contentCreator",
        "animeAndManga",
        "moviesAndTv",
        "other",
      ],
      default: "other",
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

const Server = new mongoose.model("Server", serverSchema);
module.exports = Server;
