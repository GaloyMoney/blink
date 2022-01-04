import express from "express"

const formatError = new Error("Format is Authorization: Basic <base64(key:secret)>")

export default async function (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
) {
  const authorization = req.headers["authorization"]
  if (!authorization) return next()

  const parts = authorization.split(" ")
  if (parts.length !== 2) return next()

  const scheme = parts[0]
  if (!/Basic/i.test(scheme)) return next()

  const credentials = Buffer.from(parts[1], "base64").toString().split(":")
  if (credentials.length !== 2) return next(formatError)

  const [apiKey, apiSecret] = credentials
  if (!apiKey || !apiSecret) return next(formatError)

  req["apiKey"] = apiKey
  req["apiSecret"] = apiSecret
  next()
}
