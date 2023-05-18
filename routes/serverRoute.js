const express = require("express");
const serverController = require("../controllers/serverController");
const validateToken = require("../middlewares/validateToken");
const router = express.Router();

router.post("/createServer", validateToken, serverController.createServer);
router.patch("/updateServer/:id", validateToken, serverController.updateServer);
router.delete(
  "/deleteServer/:id",
  validateToken,
  serverController.deleteServer
);
router.get("/getServer/:id?", validateToken, serverController.getServer);
// router.post("/forgotPassword", serverController.forgotPassword);
// router.patch("/resetPassword/:token", serverController.resetPassword);

module.exports = router;
