import { getI18nInstance, getLocale } from "@config"
import { WalletCurrency } from "@domain/shared"

const i18n = getI18nInstance()
const defaultLocale = getLocale()

export const createPushNotificationContent = ({
  type,
  paymentAmount,
  displayPaymentAmount,
  userLanguage,
}: {
  type: NotificationType | "balance"
  paymentAmount: PaymentAmount<WalletCurrency>
  displayPaymentAmount?: DisplayPaymentAmount<DisplayCurrency>
  userLanguage?: UserLanguage
}): {
  title: string
  body: string
} => {
  const locale = userLanguage || defaultLocale
  const baseCurrency = paymentAmount.currency
  const notificationType = type === "balance" ? type : `transaction.${type}`
  const title = i18n.__(
    { phrase: `notification.${notificationType}.title`, locale },
    { walletCurrency: baseCurrency },
  )
  const baseCurrencyName = baseCurrency === WalletCurrency.Btc ? "sats" : ""
  const baseCurrencySymbol = baseCurrency === WalletCurrency.Usd ? "$" : ""
  const displayedBaseAmount =
    baseCurrency === WalletCurrency.Usd
      ? paymentAmount.amount / 100n
      : paymentAmount.amount
  const baseCurrencyAmount = displayedBaseAmount.toLocaleString(locale, {
    maximumFractionDigits: 2,
  })

  let body = i18n.__(
    { phrase: `notification.${notificationType}.body`, locale },
    {
      baseCurrencySymbol,
      baseCurrencyAmount,
      baseCurrencyName: baseCurrencyName ? ` ${baseCurrencyName}` : "",
    },
  )

  if (
    displayPaymentAmount &&
    displayPaymentAmount.amount > 0 &&
    displayPaymentAmount.currency !== baseCurrency
  ) {
    const displayCurrencyName = i18n.__({
      phrase: `currency.${displayPaymentAmount.currency}.name`,
      locale,
    })
    const displayCurrencySymbol = i18n.__({
      phrase: `currency.${displayPaymentAmount.currency}.symbol`,
      locale,
    })
    const displayCurrencyAmount = displayPaymentAmount.amount.toLocaleString(locale, {
      maximumFractionDigits: 2,
    })
    body = i18n.__(
      { phrase: `notification.${notificationType}.bodyDisplayCurrency`, locale },
      {
        displayCurrencySymbol,
        displayCurrencyAmount,
        displayCurrencyName: displayCurrencyName ? ` ${displayCurrencyName}` : "",
        baseCurrencySymbol,
        baseCurrencyAmount,
        baseCurrencyName: baseCurrencyName ? ` ${baseCurrencyName}` : "",
      },
    )
  }

  return { title, body }
}
