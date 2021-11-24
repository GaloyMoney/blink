import twilio from "twilio"

import { baseLogger } from "@services/logger"
import { getTwilioConfig } from "@config/app"
import { TwilioError } from "@domain/errors"

export class TwilioClient {
  readonly client

  constructor() {
    this.client = twilio(getTwilioConfig().apiKey, getTwilioConfig().apiSecret, {
      accountSid: getTwilioConfig().accountSid,
    })
  }

  async sendText({ body, to, logger }) {
    const twilioPhoneNumber = getTwilioConfig().twilioPhoneNumber
    try {
      await this.client.messages.create({
        from: twilioPhoneNumber,
        to,
        body,
      })
    } catch (err) {
      logger.error({ err }, "impossible to send text")
      return false
    }

    logger.info({ to }, "sent text successfully")
    return true
  }

  async getCarrier(phone: string) {
    try {
      const result = await this.client.lookups
        .phoneNumbers(phone)
        .fetch({ type: ["carrier"] })
      baseLogger.info({ result }, "result carrier info")
      return result
    } catch (err) {
      return new TwilioError(err)
    }
  }
}
