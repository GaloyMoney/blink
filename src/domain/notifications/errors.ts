import { DomainError } from "@domain/shared"

export class NotificationsError extends DomainError {}

export class NotificationsServiceError extends NotificationsError {}
