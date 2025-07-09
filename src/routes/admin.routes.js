const express = require("express");
const {
  registerAdmin,
  loginAdmin,
} = require("../controllers/adminAuth.controller");
const authenticateAdmin = require("../middlewares/adminAuth.middleware");

const router = express.Router();

// Public
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// Protégé
router.get("/profile", authenticateAdmin, (req, res) => {
  res.json(req.admin);
});

module.exports = router;
