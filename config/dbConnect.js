const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

const dbConnect = asyncHandler(async (req, res, next) => {
  const connect = await mongoose.connect(process.env.CONNECTION_STRING);
  console.log(
    "Database Connected: ",
    connect.connection.host,
    connect.connection.name
  );
});

module.exports = dbConnect;
