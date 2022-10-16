import * as admin from "firebase-admin"

import {
  InvalidDeviceNotificationsServiceError,
  UnknownNotificationsServiceError,
} from "@domain/notifications"
import { baseLogger } from "@services/logger"
import { googleApplicationCredentialsIsSet } from "@config"

const logger = baseLogger.child({ module: "notifications" })

type MessagingPayload = admin.messaging.MessagingPayload
type NotificationMessagePayload = admin.messaging.NotificationMessagePayload

if (googleApplicationCredentialsIsSet()) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  })
}

export const PushNotificationsService = (): IPushNotificationsService => {
  const sendNotification = async ({
    deviceTokens,
    title,
    body,
    data,
  }: SendPushNotificationArgs): Promise<true | NotificationsServiceError> => {
    const message: MessagingPayload & { notification: NotificationMessagePayload } = {
      // if we set notification, it will appears on both background and quit stage for iOS.
      // if we don't set notification, this will appear for background but not quit stage
      // we may be able to use data only, but this should be implemented first:
      // https://rnfirebase.io/messaging/usage#background-application-state
      notification: { title },
      data: data || {},
    }

    if (body) {
      message.notification.body = body
    }

    const tokens = deviceTokens.filter((token) => token.length === 163)
    if (tokens.length <= 0) {
      logger.info({ message, tokens }, "invalid tokens. skipping notification")
      return new InvalidDeviceNotificationsServiceError()
    }

    try {
      const response = await admin.messaging().sendToDevice(tokens, message)
      logger.info({ response, tokens, message }, "notification was sent successfully")
      return true
    } catch (err) {
      logger.error({ err, tokens, message }, "impossible to send notification")
      return new UnknownNotificationsServiceError(err?.message)
    }
  }

  return { sendNotification }
}
