const express = require("express");
const serverController = require("../controllers/serverController");
const textChannelController = require("../controllers/textChannelController");
const voiceChannelController = require("../controllers/voiceChannelController");
const validateToken = require("../middlewares/validateToken");
const uploadPhoto = require("../middlewares/uploadPhoto");
const messageController = require("../controllers/messageController");
const router = express.Router();

//////////////////////////////////////////////////////// SERVER ROUTES ///////////////////////////////////////////////////////////////////////////////

router.post(
  "/createServer",
  validateToken,
  uploadPhoto,
  serverController.createServer
);
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

router.post("/:id/join/:userId", validateToken, serverController.joinServer);
router.post("/:id/leave/:userId", validateToken, serverController.leaveServer);

router.get("/joinedServers", validateToken, serverController.getJoinedServers);

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
router.post(
  "/createVoiceChannel/:id?",
  validateToken,
  voiceChannelController.createVoiceChannel
);
router.delete(
  "/deleteTextChannel/:id?",
  validateToken,
  voiceChannelController.deleteVoiceChannel
);
router.get(
  "/getTextChannel/:id?",
  validateToken,
  voiceChannelController.getVoiceChannel
);
//////////////////////////////////////////////////////// SEND MESSAGE ROUTES /////////////////////////////////////////////////////////////////////////

router.post("/sendMessage/:id?", validateToken, messageController.sendMessage);
router.get("/getMessages/:id?", validateToken, messageController.getMessages);

module.exports = router;
