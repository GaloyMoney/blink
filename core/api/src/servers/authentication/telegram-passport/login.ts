import { Request, Response } from "express"

import { isTelegramPassportEnabled } from "@/config"

import { Authentication } from "@/app"
import { mapError } from "@/graphql/error-map"

import { checkedToPhoneNumber } from "@/domain/users"
import { checkedToTelegramPassportNonce } from "@/domain/authentication"

import { recordExceptionInCurrentSpan } from "@/services/tracing"

export const loginWithTelegramPassportNonce = async (req: Request, res: Response) => {
  const ip = req.originalIp
  const nonceRaw = req.body.nonce
  const phoneRaw = req.body.phone

  if (!isTelegramPassportEnabled()) {
    return res
      .status(400)
      .send({ error: "Telegram passport authentication is not enabled" })
  }

  if (!nonceRaw || !phoneRaw) {
    const error = "missing inputs"
    recordExceptionInCurrentSpan({ error })
    return res.status(400).send({ error })
  }
  const nonce = checkedToTelegramPassportNonce(nonceRaw)
  if (nonce instanceof Error) return res.status(400).json({ error: "invalid nonce" })
  const phone = checkedToPhoneNumber(phoneRaw)
  if (phone instanceof Error) return res.status(400).json({ error: "invalid phone" })

  const loginResp = await Authentication.loginTelegramPassportNonceWithPhone({
    phone,
    nonce,
    ip,
  })
  if (loginResp instanceof Error) {
    return res.status(401).send({ error: mapError(loginResp).message })
  }

  const { authToken, totpRequired, id } = loginResp

  return res.send({
    authToken,
    totpRequired,
    id,
  })
}
