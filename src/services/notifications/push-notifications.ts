import * as admin from "firebase-admin"

import {
  InvalidDeviceNotificationsServiceError,
  UnknownNotificationsServiceError,
} from "@domain/notifications"
import { baseLogger } from "@services/logger"
import { googleApplicationCredentialsIsSet } from "@config"
import { Messaging } from "firebase-admin/lib/messaging/messaging"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
  wrapAsyncToRunInSpan,
} from "@services/tracing"
import { ErrorLevel } from "@domain/shared"

const logger = baseLogger.child({ module: "notifications" })

type MessagingPayload = admin.messaging.MessagingPayload
type NotificationMessagePayload = admin.messaging.NotificationMessagePayload

let messaging: Messaging

if (googleApplicationCredentialsIsSet()) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  })

  messaging = admin.messaging()
}

const sendToDevice = async (
  tokens: DeviceToken[],
  message: MessagingPayload & {
    notification: NotificationMessagePayload
  },
) => {
  try {
    const response = await messaging.sendToDevice(tokens, message)
    logger.info({ response, tokens, message }, "notification was sent successfully")

    response.results.forEach((item) => {
      if (item?.error?.message) {
        recordExceptionInCurrentSpan({
          error: item.error.message,
          level: ErrorLevel.Info,
        })
      }
    })

    addAttributesToCurrentSpan({
      failureCount: response.failureCount,
      successCount: response.successCount,
      canonicalRegistrationTokenCount: response.canonicalRegistrationTokenCount,
    })

    // TODO token clean up
    // ie, when the message below is received

    //   "response": {
    //   "results": [
    //     {
    //       "error": {
    //         "code": "messaging/registration-token-not-registered",
    //         "message": "The provided registration token is not registered. A previously valid registration token can be unregistered for a variety of reasons. See the error documentation for more details. Remove this registration token and stop using it to send messages."
    //       }
    //     },
    //     {
    //       "messageId": "0:1671300966132147%7c88793f7c88793f"
    //     }
    //   ],
    //   "canonicalRegistrationTokenCount": 0,
    //   "failureCount": 1,
    //   "successCount": 1,
    //   "multicastId": 2601374049640558600
    // },

    return true
  } catch (err) {
    recordExceptionInCurrentSpan({
      error: err.message,
      level: ErrorLevel.Warn,
    })

    logger.error({ err, tokens, message }, "impossible to send notification")
    return new UnknownNotificationsServiceError(err?.message)
  }
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
      notification: { title, body },
      data: data || {},
    }

    const tokens = deviceTokens.filter((token) => token.length === 163)
    if (tokens.length <= 0) {
      logger.info({ message, tokens }, "no token. skipping notification")
      return new InvalidDeviceNotificationsServiceError()
    }

    return wrapAsyncToRunInSpan({
      namespace: "app.notifications",
      fnName: "sendToDevice",
      fn: () => sendToDevice(tokens, message),
    })()
  }

  return { sendNotification }
}
