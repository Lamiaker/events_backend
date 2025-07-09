const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");

router.post("/", categoryController.createCategory);
router.get("/", categoryController.getAllCategories);
router.post("/:id/fields", categoryController.addFieldToCategory);
router.get("/:id/fields", categoryController.getFieldsByCategory);

module.exports = router;
