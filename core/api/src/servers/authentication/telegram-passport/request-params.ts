import { Request, Response } from "express"

import { getPublicKey, getBotIdFromToken } from "./utils"

import { env } from "@/config/env"
import { isTelegramPassportEnabled } from "@/config"

import { Authentication } from "@/app"
import { mapError } from "@/graphql/error-map"

let publicKey = ""
let botId = ""
if (isTelegramPassportEnabled()) {
  publicKey = getPublicKey(Buffer.from(env.TELEGRAM_PASSPORT_PRIVATE_KEY || "", "base64"))
  botId = getBotIdFromToken(
    Buffer.from(env.TELEGRAM_BOT_API_TOKEN || "", "base64").toString("utf8"),
  )
}

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
    bot_id: botId,
    scope: {
      data: ["phone_number"],
      v: 1,
    },
    public_key: publicKey,
    nonce,
  })
}
