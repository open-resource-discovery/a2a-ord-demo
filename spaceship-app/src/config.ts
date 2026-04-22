export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  serverUrl: process.env.SERVER_URL || "http://localhost:3001",
  internalBaseUrl: process.env.INTERNAL_BASE_URL ?? null,
};
