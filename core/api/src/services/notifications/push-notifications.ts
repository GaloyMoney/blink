import * as admin from "firebase-admin"

import { Messaging } from "firebase-admin/lib/messaging/messaging"

import {
  ShouldSendNotificationRequest,
  NotificationChannel as GrpcNotificationChannel,
} from "./proto/notifications_pb"

import {
  shouldSendNotification as grpcShouldSendNotification,
  notificationsMetadata,
} from "./grpc-client"

import { notificationCategoryToGrpcNotificationCategory } from "./convert"

import {
  DeviceTokensNotRegisteredNotificationsServiceError,
  InvalidDeviceNotificationsServiceError,
  NotificationsServiceError,
  NotificationsServiceUnreachableServerError,
  UnknownNotificationsServiceError,
} from "@/domain/notifications"
import { ErrorLevel, parseErrorMessageFromUnknown } from "@/domain/shared"
import { baseLogger } from "@/services/logger"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
  wrapAsyncFunctionsToRunInSpan,
  wrapAsyncToRunInSpan,
} from "@/services/tracing"

import { GOOGLE_APPLICATION_CREDENTIALS } from "@/config"

const logger = baseLogger.child({ module: "notifications" })

type MessagingPayload = admin.messaging.MessagingPayload
type NotificationMessagePayload = admin.messaging.NotificationMessagePayload

let messaging: Messaging

if (GOOGLE_APPLICATION_CREDENTIALS) {
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
    if (!messaging) {
      baseLogger.info("messaging module not loaded")
      // FIXME: should return an error?
      return true
    }

    const response = await messaging.sendToDevice(tokens, message)
    logger.info({ response, tokens, message }, "notification was sent successfully")

    const invalidTokens: DeviceToken[] = []
    response.results.forEach((item, index: number) => {
      if (
        response.results.length === tokens.length &&
        item?.error?.code === "messaging/registration-token-not-registered"
      ) {
        invalidTokens.push(tokens[index])
      }
      if (item?.error?.message) {
        recordExceptionInCurrentSpan({
          error: new InvalidDeviceNotificationsServiceError(item.error.message),
          level: ErrorLevel.Info,
        })
      }
    })

    addAttributesToCurrentSpan({
      failureCount: response.failureCount,
      successCount: response.successCount,
      canonicalRegistrationTokenCount: response.canonicalRegistrationTokenCount,
    })

    if (invalidTokens.length > 0) {
      return new DeviceTokensNotRegisteredNotificationsServiceError(invalidTokens)
    }

    return true
  } catch (err) {
    logger.error({ err, tokens, message }, "impossible to send notification")
    const error = handleCommonNotificationErrors(err)
    recordExceptionInCurrentSpan({ error, level: ErrorLevel.Warn })
    return error
  }
}

export const PushNotificationsService = (): IPushNotificationSenderService => {
  const sendNotification = async ({
    deviceTokens,
    title,
    body,
    data,
  }: PushNotificationArgs): Promise<true | NotificationsServiceError> => {
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

  const checkShouldSendNotification = async ({
    userId,
    notificationCategory,
  }: {
    userId: UserId
    notificationCategory: NotificationCategory
  }): Promise<boolean | UnknownNotificationsServiceError> => {
    try {
      const request = new ShouldSendNotificationRequest()
      request.setUserId(userId)
      request.setChannel(GrpcNotificationChannel.PUSH)
      request.setCategory(
        notificationCategoryToGrpcNotificationCategory(notificationCategory),
      )

      const response = await grpcShouldSendNotification(request, notificationsMetadata)

      return response.getShouldSend()
    } catch (err) {
      return new UnknownNotificationsServiceError(err)
    }
  }

  const sendFilteredNotification = async (args: FilteredPushNotificationArgs) => {
    const { notificationCategory, data, ...sendNotificationArgs } = args

    const shouldSendNotification = await checkShouldSendNotification({
      userId: args.userId,
      notificationCategory,
    })

    if (shouldSendNotification instanceof UnknownNotificationsServiceError) {
      return shouldSendNotification
    }

    if (!shouldSendNotification) {
      return {
        status: SendFilteredPushNotificationStatus.Filtered,
      }
    }

    const result = await sendNotification({
      ...sendNotificationArgs,
      data: {
        ...data,
        NotificationCategory: notificationCategory,
      },
    })

    if (result instanceof NotificationsServiceError) {
      return result
    }

    return {
      status: SendFilteredPushNotificationStatus.Sent,
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.push-notifications",
    fns: {
      sendNotification,
      sendFilteredNotification,
    },
  })
}

export const handleCommonNotificationErrors = (err: Error | string | unknown) => {
  const errMsg = parseErrorMessageFromUnknown(err)

  const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errMsg)

  switch (true) {
    case match(KnownNotificationErrorMessages.GoogleBadGatewayError):
    case match(KnownNotificationErrorMessages.GoogleInternalServerError):
      return new NotificationsServiceUnreachableServerError(errMsg)

    default:
      return new UnknownNotificationsServiceError(errMsg)
  }
}

export const KnownNotificationErrorMessages = {
  GoogleBadGatewayError: /Raw server response .* Error 502/,
  GoogleInternalServerError: /Raw server response .* Error 500/,
} as const

export const SendFilteredPushNotificationStatus = {
  Sent: "Sent",
  Filtered: "Filtered",
} as const
