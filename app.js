require("dotenv").config();
const cors = require("cors");
const express = require("express");
const userRoute = require("./routes/userRoute");
const dbConnect = require("./config/dbConnect");
const serverRoute = require("./routes/serverRoute");
const AppError = require("./ErrorHandlers/AppError");
const mongoSanitize = require("express-mongo-sanitize");
const globalErrorHandler = require("./ErrorHandlers/globalErrorHandler");

const app = express();

app.use(express.json());
app.use(mongoSanitize());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://discord-clone-frontend-teal.vercel.app/",
    ],
    credentials: true,
  })
);

dbConnect();

app.use("/users", userRoute);
app.use("/server", serverRoute);

app.all("*", (req, res, next) => {
  return next(
    new AppError("This route is not yet defined in this application", 400)
  );
});
app.use(globalErrorHandler);

module.exports = app;
