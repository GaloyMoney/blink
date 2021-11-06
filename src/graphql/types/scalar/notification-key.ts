import { GT } from "@graphql/index"

export const NOTIFICATION_KEYS = {
  ALL_NOTIFICATIONS: "ALL_NOTIFICATIONS",
  // TODO: Support more fine-grained notifications (DAILY_BALANCE, BALANCE_CHANGE, INVOICE_PAID, PRICE_VOLATILITY)
} as const

const NotificationKey = new GT.Enum({
  name: "NotificationKey",
  values: {
    ALL_NOTIFICATIONS: { value: NOTIFICATION_KEYS.ALL_NOTIFICATIONS },
  },
})

export default NotificationKey
