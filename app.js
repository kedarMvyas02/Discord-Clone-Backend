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
      "https://discord-clone-frontend-teal.vercel.app",
      "https://discord-clone-kedarmvyas02.vercel.app",
      "https://discord-clone-hf2915jx9-kedarmvyas02.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);
app.options("*", cors());

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
//   res.setHeader("Access-Control-Allow-Origin", "http://localhost:3001");
//   res.setHeader(
//     "Access-Control-Allow-Origin",
//     "https://discord-clone-kedarmvyas02.vercel.app/"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Origin",
//     "https://discord-clone-hf2915jx9-kedarmvyas02.vercel.app/"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Origin",
//     "https://discord-clone-frontend-teal.vercel.app"
//   );
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.setHeader("Access-Control-Allow-Credentials", true);
//   next();
// });

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
