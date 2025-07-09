const express = require("express");
const {
  register,
  login,
  logout,
  getProfile,
} = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");
const { validateRegisterInput } = require("../middlewares/validate.middleware");

const router = express.Router();

router.post("/register", validateRegisterInput, register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", protect, getProfile);

module.exports = router;
