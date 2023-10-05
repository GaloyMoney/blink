import {
  btcTransactions,
  usdTransactions,
  btcTransactionsWithDisplayCurrency,
  usdTransactionsWithDisplayCurrency,
} from "./transactions"

import { getLocale } from "@/config"
import { createPushNotificationContent } from "@/services/notifications/create-push-notification-content"

const userLanguage = getLocale()

describe("Notifications - createPushNotificationContent", () => {
  test.each(btcTransactions)(
    "content is valid for BTC $type transaction",
    ({ type, paymentAmount, body, title }) => {
      const result = createPushNotificationContent({
        type,
        amount: paymentAmount,
        userLanguage,
      })
      expect(result).toEqual(expect.objectContaining({ body, title }))
    },
  )

  test.each(btcTransactionsWithDisplayCurrency)(
    "content is valid for BTC $type transaction with display currency",
    ({ type, paymentAmount, displayPaymentAmount, body, title }) => {
      const result = createPushNotificationContent({
        type,
        amount: paymentAmount,
        displayAmount: displayPaymentAmount,
        userLanguage,
      })
      expect(result).toEqual(expect.objectContaining({ body, title }))
    },
  )

  test.each(usdTransactions)(
    "content is valid for USD $type transaction",
    ({ type, paymentAmount, body, title }) => {
      const result = createPushNotificationContent({
        type,
        amount: paymentAmount,
        userLanguage,
      })
      expect(result).toEqual(expect.objectContaining({ body, title }))
    },
  )

  test.each(usdTransactionsWithDisplayCurrency)(
    "content is valid for USD $type transaction with display currency",
    ({ type, paymentAmount, displayPaymentAmount, body, title }) => {
      const result = createPushNotificationContent({
        type,
        amount: paymentAmount,
        displayAmount: displayPaymentAmount,
        userLanguage,
      })
      expect(result).toEqual(expect.objectContaining({ body, title }))
    },
  )
})
