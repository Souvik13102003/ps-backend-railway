const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      console.log("🔐 Incoming Token:", token);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Decoded:", decoded);

      req.user = await User.findById(decoded.id).select("-password");
      return next();
    }

    return res.status(401).json({ message: "Not authorized, no token" });
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = { protect };
