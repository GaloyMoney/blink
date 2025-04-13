import { createHash } from "crypto"

import axios from "axios"
import { Request, Response } from "express"
import { TelegramPassport } from "@merqva/telegram-passport"

import {
  isTelegramPassportEnabled,
  TELEGRAM_BOT_API_TOKEN,
  TELEGRAM_PASSPORT_PRIVATE_KEY,
} from "@/config"

import { Authentication } from "@/app"
import { mapError } from "@/graphql/error-map"

import { baseLogger } from "@/services/logger"

const logger = baseLogger.child({ module: "trigger" })

const setupHash = isTelegramPassportEnabled()
  ? createHash("sha256").update(TELEGRAM_BOT_API_TOKEN).digest("hex")
  : undefined

export const handleTelegramPassportWebhook = async (req: Request, res: Response) => {
  if (!isTelegramPassportEnabled()) {
    return res
      .status(400)
      .send({ error: "Telegram passport authentication is not enabled" })
  }

  if (req.query.hash !== setupHash) {
    return res.status(403).send("Unauthorized")
  }

  if (!req.body || !req.body.message || !req.body.message.passport_data) {
    return res.status(400).send({ error: "Missing passport_data in request" })
  }

  try {
    const telegramPassport = new TelegramPassport(TELEGRAM_PASSPORT_PRIVATE_KEY)
    const decryptedData = telegramPassport.decryptPassportData(
      req.body.message.passport_data,
    )

    const authorizeNonce = await Authentication.authorizeTelegramPassportNonce({
      phone: decryptedData.phone_number || "",
      nonce: decryptedData.nonce || "",
    })
    if (authorizeNonce instanceof Error) {
      logger.error(
        { data: req.body, decryptedData },
        "Error processing Telegram Passport data",
      )
      // this is an internal error so we must return 200 to avoid retries from sender
      return res.status(200).send({ error: mapError(authorizeNonce).message })
    }

    return res.status(200).send({ success: true })
  } catch (error) {
    logger.error({ data: req.body }, "Error processing Telegram Passport data")
    return res.status(500).send({
      error: "Failed to process Telegram Passport data",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export const handleTelegramPassportWebhookSetup = async (req: Request, res: Response) => {
  if (!req.query.setWebhook) {
    return res.json({ success: false })
  }

  const protocol = req.headers["x-forwarded-proto"] || req.protocol
  const host = req.headers["x-forwarded-host"] || req.headers.host
  const baseUrl = `${protocol}://${host}`
  try {
    const token = Buffer.from(env.TELEGRAM_BOT_API_TOKEN || "", "base64").toString()
    const webhookUrl = `${baseUrl}/auth/telegram-passport/webhook?hash=${setupHash}`

    const response = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
      url: webhookUrl,
    })

    return res.json({ success: response.status === 200 })
  } catch (error) {
    logger.error({ baseUrl, error }, "Error setting webhook")
  }
  return res.json({ success: false })
}
