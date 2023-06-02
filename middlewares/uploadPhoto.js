const multer = require("multer");
const AppError = require("../ErrorHandlers/AppError");
const path = require("path");

const directory = path.join(__dirname, "..", "uploads");

const uploadPhoto = (req, res, next) => {
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, directory);
    },
    filename: (req, file, cb) => {
      const ext = file.mimetype.split("/")[1];
      cb(null, `servers-${req.body.name}-${Date.now()}.${ext}`);
    },
  });

  const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new AppError("Not an image! Please upload only image", 400), false);
    }
  };

  const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
  }).fields([
    { name: "name", maxCount: 10 },
    { name: "avatar", maxCount: 10 },
  ]);

  /*
  .single("avatar");
  */

  upload(req, res, (err) => {
    if (err) {
      return next(new AppError(err));
    }
    next();
  });
};

module.exports = uploadPhoto;
