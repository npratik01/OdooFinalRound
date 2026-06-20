const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const {
  loginValidation,
  registerValidation,
} = require("../validators/auth.validator");
const { validate } = require("../middleware/validate.middleware");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/login", loginValidation, validate, authController.login);
router.post("/register", registerValidation, validate, authController.register);
router.get("/me", authenticate, authController.me);
router.post("/logout", authenticate, authController.logout);
router.post("/refresh", authController.refresh);

module.exports = router;
