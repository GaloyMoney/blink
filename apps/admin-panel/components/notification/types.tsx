export const NotificationAction = {
  OpenDeepLink: "OpenDeepLink",
  OpenExternalUrl: "OpenExternalUrl",
} as const

export type NotificationAction =
  (typeof NotificationAction)[keyof typeof NotificationAction]
