const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getToken = (request) => {
  const url = new URL(request.url, "http://localhost");
  const queryToken = url.searchParams.get("token");
  if (queryToken) return queryToken;

  const authorization = request.headers.authorization || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : authorization;
};

const authenticateWebSocket = async (request) => {
  const token = getToken(request);
  if (!token || !process.env.JWT_SECRET) throw new Error("Missing authentication token");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("_id role");
  if (!user) throw new Error("User account no longer exists");

  return { id: user._id.toString(), role: user.role };
};

module.exports = { authenticateWebSocket };
