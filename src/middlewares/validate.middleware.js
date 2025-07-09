const { registerSchema } = require("../schemas/auth.schema");

const validateRegisterInput = (req, res, next) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ errors: error.errors });
  }
};

module.exports = { validateRegisterInput };
