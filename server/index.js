const express = require("express");
const dbConnect = require("./config/dbConnect");
const AppError = require("./ErrorHandlers/AppError");
const mongoSanitize = require("express-mongo-sanitize");
const userRoute = require("./routes/userRoute");
const serverRoute = require("./routes/serverRoute");
const cors = require("cors");
const globalErrorHandler = require("./ErrorHandlers/globalErrorHandler");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(mongoSanitize()); // used for NOSQL query injection attacks
app.use(cors());

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
