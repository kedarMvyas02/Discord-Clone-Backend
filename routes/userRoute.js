// this is routes for all the user's related requests

const express = require("express");
const userDetailValidation = require("../middlewares/userDetailValidation");
const userController = require("../controllers/userController");
const validateToken = require("../middlewares/validateToken");
const router = express.Router();

router.post("/registerUser", userDetailValidation, userController.registerUser);
router.post("/loginUser", userController.loginUser);
router.get("/getUser/:id?", validateToken, userController.getUser);
router.delete("/deleteUser", validateToken, userController.deleteUser);
router.post("/forgotPassword", userController.forgotPassword);
router.patch("/resetPassword/:token", userController.resetPassword);
router.post(
  "/sendFriendRequest",
  validateToken,
  userController.sendFriendRequest
);
router.post(
  "/acceptFriendRequest",
  validateToken,
  userController.acceptFriendRequest
);
router.get("/getFriends", validateToken, userController.getFriends);
router.get(
  "/getPendingRequests",
  validateToken,
  userController.getPendingRequests
);
router.get(
  "/getArrivedFriendRequests",
  validateToken,
  userController.getArrivedFriendRequests
);
router.post("/cancelFriendReq", validateToken, userController.cancelFriendReq);
router.post("/rejectFriendReq", validateToken, userController.rejectFriendReq);

module.exports = router;
