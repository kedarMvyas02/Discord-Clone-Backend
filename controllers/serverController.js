const asyncHandler = require("express-async-handler");
const AppError = require("../ErrorHandlers/AppError");
const Server = require("../models/serverModel");
const { default: mongoose } = require("mongoose");

////////////////////////////////////////////////////// CREATE SERVER ////////////////////////////////////////////////////////////////////////////////

const createServer = asyncHandler(async (req, res, next) => {
  const { name, avatar } = req.body;

  if (!name) return next(new AppError("Name is compulsory", 400));
  if (!avatar) return next(new AppError("Avatar of server is compulsory", 400));

  const serverExists = await Server.find({ name });
  if (serverExists.length > 0)
    return next(new AppError("This server name is taken already", 400));

  const created = await Server.create({
    name,
    owner: req.user.id,
    avatar,
  });

  if (!created) return next(new AppError("Server didn't created", 500));

  return res.status(201).json({
    message: "Server Created Successfully",
    created,
  });
});

////////////////////////////////////////////////////// UPDATE SERVER ////////////////////////////////////////////////////////////////////////////////

const updateServer = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const { name, avatar } = req.body;

  if (!id) return next(new AppError("ID is not present in the parameter", 400));
  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("ID is invalid", 400));

  const currServer = await Server.findById(id);
  if (!currServer) return next(new AppError("Server not found", 404));

  if (currServer.owner.toString() !== req.user.id) {
    return next(
      new AppError("You are not authorized to update this server", 401)
    );
  }

  const updated = await Server.findOneAndUpdate(
    { _id: id },
    { name, avatar },
    { new: true }
  );

  if (!updated) return next(new AppError("Server didn't updated", 500));

  return res.status(200).json({
    message: "Server Updated Successfully",
    _id: updated._id,
    name: updated.name,
  });
});

////////////////////////////////////////////////////// DELETE SERVER ////////////////////////////////////////////////////////////////////////////////

const deleteServer = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new AppError("ID is not present in the parameter"));

  const currServer = await Server.findById(id);
  if (!currServer) return next(new AppError("Server not found", 404));

  if (currServer.owner.toString() !== req.user.id) {
    return next(
      new AppError("You are not authorized to delete this server", 401)
    );
  }

  const deleted = await currServer.deleteOne({ id });

  if (deleted) {
    // TODO delete channels, messages, members...

    return res.status(200).json({
      message: "Server has been deleted successfully",
    });
  } else {
    return next(new AppError("Server has not been deleted", 500));
  }
});

////////////////////////////////////////////////////// GET SERVER ////////////////////////////////////////////////////////////////////////////////

const getServer = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  let currServer;

  if (id) {
    currServer = await Server.findById(id);
    if (!currServer) return next(new AppError("Server not found", 404));

    return res.status(200).json({
      message: "Server has been deleted successfully",
      server: [currServer],
    });
  } else {
    currServer = await Server.find();
    if (!currServer) return next(new AppError("No Server found", 404));

    return res.status(200).json({
      message: "Server has been deleted successfully",
      server: currServer,
    });
  }
});

module.exports = {
  createServer,
  updateServer,
  deleteServer,
  getServer,
};
