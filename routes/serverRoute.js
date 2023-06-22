const express = require("express");
const serverController = require("../controllers/serverController");
const textChannelController = require("../controllers/textChannelController");
const voiceChannelController = require("../controllers/voiceChannelController");
const validateToken = require("../middlewares/validateToken");
const uploadPhoto = require("../middlewares/uploadPhoto");
const dmController = require("../controllers/DmController");
const OneToOneChatController = require("../controllers/OneToOneChatController");
const GroupMessageController = require("../controllers/groupMessageController");
const searchFunctionalities = require("../controllers/searchFunctionalities");
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
router.get("/allMembers/:id?", validateToken, serverController.getMembers);
router.get(
  "/getPublicServers",
  validateToken,
  serverController.getPublicServers
);

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
router.post(
  "/deleteMessage/:id?",
  validateToken,
  GroupMessageController.deleteMessage
);
router.post(
  "/pinMessage/:id?",
  validateToken,
  GroupMessageController.pinMessage
);
router.get(
  "/getPinnedMessages/:id?",
  validateToken,
  GroupMessageController.getPinnedMessages
);
router.post(
  "/deletePinnedMessage/:id?",
  validateToken,
  GroupMessageController.deletePinnedMessage
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
router.post(
  "/deleteDmMessage/:id?",
  validateToken,
  OneToOneChatController.deleteMessage
);
router.post(
  "/pinDmMessage/:id?",
  validateToken,
  OneToOneChatController.pinMessage
);
router.get(
  "/getDmPinnedMessages/:id?",
  validateToken,
  OneToOneChatController.getPinnedMessages
);
router.post(
  "/deleteDmPinnedMessage/:id?",
  validateToken,
  OneToOneChatController.deletePinnedMessage
);

//////////////////////////////////////////////////////// DM ROUTES /////////////////////////////////////////////////////////////////////////

router.get("/messageFinder/:messages", searchFunctionalities.messagesFinder);
router.get("/searchServers", searchFunctionalities.searchServers);

module.exports = router;
