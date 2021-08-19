export class NotificationsError extends Error {
  name = this.constructor.name
}

export class NotificationsServiceError extends NotificationsError {}
