import * as admin from "firebase-admin"

import {
  InvalidDeviceNotificationsServiceError,
  UnknownNotificationsServiceError,
} from "@domain/notifications"
import { baseLogger } from "@services/logger"

const logger = baseLogger.child({ module: "notifications" })

type MessagingPayload = admin.messaging.MessagingPayload
type NotificationMessagePayload = admin.messaging.NotificationMessagePayload

// The key GOOGLE_APPLICATION_CREDENTIALS should be set in production
// This key defined the path of the config file that include the key
// more info at https://firebase.google.com/docs/admin/setup
// TODO: mock up the function for devnet
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  })
}

export const PushNotificationsService = (): IPushNotificationsService => {
  const sendNotification = async ({
    deviceToken,
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

    const tokens = Array.isArray(deviceToken) ? deviceToken : [deviceToken]
    const deviceTokens = tokens.filter((token) => token.length === 163)
    if (deviceTokens.length <= 0) {
      logger.info({ message, deviceToken }, "invalid token. skipping notification")
      return new InvalidDeviceNotificationsServiceError()
    }

    try {
      const response = await admin.messaging().sendToDevice(deviceTokens, message)
      logger.info(
        { response, deviceToken, message },
        "notification was sent successfully",
      )
      return true
    } catch (err) {
      logger.error({ err, deviceToken, message }, "impossible to send notification")
      return new UnknownNotificationsServiceError(err?.message)
    }
  }

  return { sendNotification }
}
