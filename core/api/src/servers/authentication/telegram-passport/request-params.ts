import { Request, Response } from "express"

import {
  isTelegramPassportEnabled,
  TELEGRAM_BOT_ID,
  TELEGRAM_PASSPORT_PUBLIC_KEY,
} from "@/config"

import { Authentication } from "@/app"
import { mapError } from "@/graphql/error-map"

export const getTelegramPassportRequestParams = async (req: Request, res: Response) => {
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

  return res.json({
    bot_id: TELEGRAM_BOT_ID,
    scope: {
      data: ["phone_number"],
      v: 1,
    },
    public_key: TELEGRAM_PASSPORT_PUBLIC_KEY,
    nonce,
  })
}
