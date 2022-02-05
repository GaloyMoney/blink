import { ApolloError } from "apollo-server-errors"
import { Logger } from "pino"

import { baseLogger } from "@services/logger"

type levelType = "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent"
export class CustomError extends ApolloError {
  log
  forwardToClient

  constructor(
    message: string,
    code: string,
    {
      forwardToClient,
      logger,
      level,
      metadata,
    }: { forwardToClient: boolean; logger: Logger; metadata; level: levelType },
  ) {
    super(message, code, { metadata })
    this.log = logger[level].bind(logger)
    this.forwardToClient = forwardToClient
  }
}

export class UnknownClientError extends CustomError {
  constructor(
    message: string,
    { logger = baseLogger, level = "warn" as const, ...metadata } = {},
  ) {
    super(message, "UNKNOWN_CLIENT_ERROR", {
      forwardToClient: true,
      logger,
      level,
      metadata,
    })
  }
}

export class LndOfflineError extends CustomError {
  constructor(
    message,
    {
      forwardToClient = true,
      logger = baseLogger,
      level = "warn" as const,
      ...metadata
    } = {},
  ) {
    super(message, "LND_OFFLINE", { forwardToClient, logger, level, metadata })
  }
}
