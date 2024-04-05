import {
  ConcurrentModificationNotificationsServiceError,
  NotificationsServiceUnreachableServerError,
  UnknownNotificationsServiceError,
} from "@/domain/notifications"
import { parseErrorMessageFromUnknown } from "@/domain/shared"

export const handleCommonNotificationErrors = (err: Error | string | unknown) => {
  const errMsg = parseErrorMessageFromUnknown(err)

  const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errMsg)

  switch (true) {
    case match(KnownNotificationErrorMessages.ConcurrentModificationError):
      return new ConcurrentModificationNotificationsServiceError(errMsg)

    case match(KnownNotificationErrorMessages.GoogleBadGatewayError):
    case match(KnownNotificationErrorMessages.GoogleInternalServerError):
    case match(KnownNotificationErrorMessages.NoConnectionError):
      return new NotificationsServiceUnreachableServerError(errMsg)

    default:
      return new UnknownNotificationsServiceError(errMsg)
  }
}

export const KnownNotificationErrorMessages = {
  ConcurrentModificationError: /ConcurrentModification/,
  GoogleBadGatewayError: /Raw server response .* Error 502/,
  GoogleInternalServerError: /Raw server response .* Error 500/,
  NoConnectionError: /UNAVAILABLE: No connection established/,
} as const
