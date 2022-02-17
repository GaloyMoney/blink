import { DomainError } from "@domain/errors"

export class NotificationsError extends DomainError {}

export class NotificationsServiceError extends NotificationsError {}
