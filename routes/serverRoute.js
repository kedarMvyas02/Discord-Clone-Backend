const express = require("express");
const serverController = require("../controllers/serverController");
const textChannelController = require("../controllers/textChannelController");
const voiceChannelController = require("../controllers/voiceChannelController");
const validateToken = require("../middlewares/validateToken");
const uploadPhoto = require("../middlewares/uploadPhoto");
const dmController = require("../controllers/DmController");
const OneToOneChatController = require("../controllers/OneToOneChatController");
const GroupMessageController = require("../controllers/groupMessageController");
const messagesFinder = require("../controllers/searchFunctionalities");
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

router.post("/join/:id", validateToken, serverController.joinServer);
router.post("/leave/:id", validateToken, serverController.leaveServer);

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
  "/deleteVoiceChannel/:id?",
  validateToken,
  voiceChannelController.deleteVoiceChannel
);
router.get(
  "/getVoiceChannel/:id?",
  validateToken,
  voiceChannelController.getVoiceChannel
);
router.post(
  "/joinVoiceChannel/:id?",
  validateToken,
  voiceChannelController.joinVoiceChannel
);
router.post(
  "/leaveVoiceChannel/:id?",
  validateToken,
  voiceChannelController.leaveVoiceChannel
);
router.get(
  "/getJoinedInVoiceChannel/:id?",
  validateToken,
  voiceChannelController.getJoinedInVoiceChannel
);
//////////////////////////////////////////////////////// CHANNEL MESSAGE ROUTES /////////////////////////////////////////////////////////////////////////

router.get(
  "/getChannelMessages/:id?",
  validateToken,
  GroupMessageController.getChannelMessages
);

//////////////////////////////////////////////////////// DM ROUTES /////////////////////////////////////////////////////////////////////////

router.post("/addToDm/:id?", validateToken, dmController.addToDmHandler);
router.post(
  "/removeFromDm/:id?",
  validateToken,
  dmController.removeFromDmHandler
);
router.get("/getDmFriends", validateToken, dmController.getDmFriends);
router.get(
  "/getDmMessages/:id?",
  validateToken,
  OneToOneChatController.getDmMessages
);

//////////////////////////////////////////////////////// DM ROUTES /////////////////////////////////////////////////////////////////////////

router.get("/messageFinder/:messages", messagesFinder);

module.exports = router;
