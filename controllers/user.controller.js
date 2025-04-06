const User = require("../models/user.model");

exports.getTotalUsers = async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ totalUsers: count });
  } catch (error) {
    console.error("Error fetching user count:", error);
    res.status(500).json({ message: "Server error" });
  }
};
