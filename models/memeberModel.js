const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Server",
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

memberSchema.virtual("servers", {
  ref: "Server",
  localField: "server",
  foreignField: "_id",
}); // bad choice TODO

const Member = new mongoose.model("Member", memberSchema);
module.exports = Member;
