exports.createCategory = async (req, res) => {
  const { name, description, imageUrl } = req.body;
  try {
    const category = await prisma.category.create({
      data: { name, description, imageUrl },
    });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addFieldToCategory = async (req, res) => {
  const { id } = req.params;
  const { label, type, options, isRequired } = req.body;
  try {
    const field = await prisma.categoryField.create({
      data: {
        categoryId: id,
        label,
        type,
        options,
        isRequired,
      },
    });
    res.json(field);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFieldsByCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const fields = await prisma.categoryField.findMany({
      where: { categoryId: id },
    });
    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
