const express = require("express");
const serverController = require("../controllers/serverController");
const textChannelController = require("../controllers/textChannelController");
const validateToken = require("../middlewares/validateToken");
const router = express.Router();

//////////////////////////////////////////////////////// SERVER ROUTES ///////////////////////////////////////////////////////////////////////////////

router.post("/createServer", validateToken, serverController.createServer);
router.patch(
  "/updateServer/:id?",
  validateToken,
  serverController.updateServer
);
router.delete(
  "/deleteServer/:id?",
  validateToken,
  serverController.deleteServer
);
router.get("/getServer/:id?", validateToken, serverController.getServer);

//////////////////////////////////////////////////////// TEXT CHANNEL ROUTES /////////////////////////////////////////////////////////////////////////

router.post(
  "/createTextChannel/:id?",
  validateToken,
  textChannelController.createTextChannel
);
router.delete(
  "/deleteTextChannel/:id?",
  validateToken,
  textChannelController.deleteTextChannel
);
router.get(
  "/getTextChannel/:id?",
  validateToken,
  textChannelController.getTextChannel
);

//////////////////////////////////////////////////////// VOICE CHANNEL ROUTES /////////////////////////////////////////////////////////////////////////

module.exports = router;
