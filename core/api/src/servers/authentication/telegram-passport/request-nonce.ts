import { Request, Response } from "express"

import { isTelegramPassportEnabled } from "@/config"

import { Authentication } from "@/app"
import { mapError } from "@/graphql/error-map"

export const requestTelegramPassportNonce = async (req: Request, res: Response) => {
  const ip = req.originalIp
  const phone = req.body.phone

  if (!isTelegramPassportEnabled()) {
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
