const express = require("express");
const dbConnect = require("./config/dbConnect");
const AppError = require("./ErrorHandlers/AppError");
const mongoSanitize = require("express-mongo-sanitize");
const userRoute = require("./routes/userRoute");
const serverRoute = require("./routes/serverRoute");
const cors = require("cors");
const morgan = require("morgan");
const globalErrorHandler = require("./ErrorHandlers/globalErrorHandler");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(mongoSanitize()); // used for NOSQL query injection attacks
app.use(morgan("dev"));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
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

app.listen(process.env.PORT, () => {
  console.log(`Listening on port: ${process.env.PORT}`);
});
