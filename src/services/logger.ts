import pino from "pino"
export const baseLogger = pino({ level: process.env.LOGLEVEL || "info" })
