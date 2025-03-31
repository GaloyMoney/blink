import { Request, Response } from "express"

import { env } from "@/config/env"
import { Authentication } from "@/app"
import { mapError } from "@/graphql/error-map"

export const requestTelegramPassportNonce = async (req: Request, res: Response) => {
  const ip = req.originalIp
  const phone = req.body.phone

  if (!env.TELEGRAM_PASSPORT_PRIVATE_KEY) {
    return res
      .status(400)
      .send({ error: "Telegram passport authentication is not enabled" })
  }

  if (!phone) {
    return res.status(400).send({ error: "missing inputs" })
  }

  const nonce = await Authentication.requestTelegramPassportNonce({
    phone,
    ip,
  })
  if (nonce instanceof Error) {
    return res.status(400).send({ error: mapError(nonce).message })
  }

  return res.json({ nonce })
}
