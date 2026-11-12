// backend/config/db.js
const mongoose = require("mongoose");
const dns = require("dns");

const configuredDnsServers = (process.env.MONGO_DNS_SERVERS || "")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (configuredDnsServers.length > 0) {
  dns.setServers(configuredDnsServers);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;