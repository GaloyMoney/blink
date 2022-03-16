import pino from "pino"
export const baseLogger = pino({
  level: process.env.LOGLEVEL || "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "body.variables.code",
    "req.body.variables.code",
  ],
})
