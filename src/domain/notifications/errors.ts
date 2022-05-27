import { DomainError, ErrorLevel } from "@domain/shared"

export class NotificationsError extends DomainError {}

export class NotificationsServiceError extends NotificationsError {}
export class InvalidDeviceNotificationsServiceError extends NotificationsServiceError {}
export class UnknownNotificationsServiceError extends NotificationsError {
  level = ErrorLevel.Critical
}
