import { NextFunction, Request, Response } from "express"
import { LockService } from "@services/lock"
import { InvalidIdempotencyKeyError } from "@domain/errors"
import { ExecutionError } from "redlock"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
} from "@services/tracing"
import { ErrorLevel } from "@domain/shared"

// Create lock service instance
const lockService = LockService()

const UuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const checkedToIdempotencyKey = (input: string) => {
  if (!input.match(UuidRegex)) {
    return new InvalidIdempotencyKeyError(input)
  }
  return input as IdempotencyKey
}

// Idempotency middleware
// currently a naive version that doesn't cache the response
// a better version would cache the response and return it on subsequent requests
// the tricky part is to handle the race condition when the first request is still
// processing and the second request comes in
export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const idempotencyKeyRaw =
    req.headers["x-idempotency-key"] || req.headers["X-Idempotency-Key"]

  if (idempotencyKeyRaw) {
    if (Array.isArray(idempotencyKeyRaw)) {
      return res
        .status(400)
        .json({ error: "X-Idempotency-Key header must be a single string" })
    }

    const idempotencyKey = checkedToIdempotencyKey(idempotencyKeyRaw)
    if (idempotencyKey instanceof InvalidIdempotencyKeyError) {
      return res.status(400).json({ error: "X-Idempotency-Key header must be a UUID-v4" })
    }

    try {
      await lockService.lockIdempotencyKey(idempotencyKey)
      addAttributesToCurrentSpan({ idempotencyKey })

      next()
    } catch (error) {
      recordExceptionInCurrentSpan({
        error,
        fallbackMsg: "Error locking idempotency key",
        level: ErrorLevel.Critical,
      })
      if (error instanceof ExecutionError) {
        return res.status(409).json({ error: error.message })
      }
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Unknown error" })
    }
  } else {
    next()
  }
}
