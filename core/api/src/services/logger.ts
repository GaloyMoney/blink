import pino from "pino"
export const baseLogger = pino({
  // FIXME why is .env not working?
  level: process.env.LOGLEVEL ?? "info",
  redact: ["req.headers.authorization", "body.variables.code", "req.body.variables.code"],
})
