import { json } from "body-parser"

import { NextFunction, Request, Response } from "express"

import { InvalidIdempotencyKeyError } from "@/domain/errors"
import { ResourceAttemptsTimelockServiceError } from "@/domain/lock"
import { LockService } from "@/services/lock"
import { addAttributesToCurrentSpan } from "@/services/tracing"

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

    // Parse JSON body
    // we only parse if we have a idempotency key
    json()(req, res, async (err) => {
      if (err) {
        next(err)
        return
      }

      // Check if the request is a persisted query that also include the full query
      //
      // because the mobile flow has persisted Query enabled, there is a scenario in which
      // the mobile client sends a hash request without the query,
      // the server would then return an error because the hash is not found
      // the mobile would then retry with both the hash and the full query
      //
      // to properly handle this scenario, we treat those 2 queries as separate by adding a suffix
      // to the idempotency key on redis, such that the second request would not be blocked
      const isPersistedQueryWithExtension =
        req?.body?.extensions?.persistedQuery?.sha256Hash && req?.body?.query

      const idempotencyKeyMaybeSuffix = (idempotencyKey +
        (isPersistedQueryWithExtension ? "-persisted" : "")) as IdempotencyKey

      const result = await lockService.lockIdempotencyKey(idempotencyKeyMaybeSuffix)
      addAttributesToCurrentSpan({ idempotencyKey })

      if (result instanceof ResourceAttemptsTimelockServiceError) {
        return res.status(409).json({ error: "the idempotency key already exist" })
      }
      if (result instanceof Error) {
        return res.status(500).json({ error: result.message })
      }

      next()
    })
  } else {
    next()
  }
}
