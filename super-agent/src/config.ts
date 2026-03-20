export const config = {
  port: parseInt(process.env.PORT || "3002", 10),
  serverUrl: process.env.SERVER_URL || "http://localhost:3002",
  ordSourceUrl: process.env.ORD_SOURCE_URL || "http://localhost:3001",
};
