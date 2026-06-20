const { verify } = require("../utils/jwt");
const User = require("../models/user.model");
const { formatErrorResponse } = require("../utils/responseHelper");

async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer "))
      return formatErrorResponse(res, 401, "Unauthorized", []);
    const token = auth.split(" ")[1];
    const decoded = verify(token);
    // token payload: { userId, email, role }
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId).select("-password");
    if (!user || !user.isActive)
      return formatErrorResponse(res, 401, "Unauthorized", []);
    req.user = user;
    next();
  } catch (err) {
    return formatErrorResponse(res, 401, "Invalid or expired token", []);
  }
}

module.exports = { authenticate };
