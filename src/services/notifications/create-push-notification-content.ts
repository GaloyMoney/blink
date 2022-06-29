import { getI18nInstance, getLocale } from "@config"
import { WalletCurrency } from "@domain/shared"

const i18n = getI18nInstance()
const defaultLocale = getLocale()

export const createPushNotificationContent = ({
  type,
  amount,
  displayAmount,
  userLanguage,
}: {
  type: NotificationType | "balance"
  amount: Amount<WalletCurrency>
  displayAmount?: DisplayAmount<DisplayCurrency>
  userLanguage?: UserLanguage
}): {
  title: string
  body: string
} => {
  const locale = userLanguage || defaultLocale
  const baseCurrency = amount.currency
  const notificationType = type === "balance" ? type : `transaction.${type}`
  const title = i18n.__(
    { phrase: `notification.${notificationType}.title`, locale },
    { walletCurrency: baseCurrency },
  )
  const baseCurrencyName = baseCurrency === WalletCurrency.Btc ? "sats" : ""
  const baseCurrencySymbol = baseCurrency === WalletCurrency.Usd ? "$" : ""
  const displayedBaseAmount =
    baseCurrency === WalletCurrency.Usd ? Number(amount.amount) / 100 : amount.amount
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
    displayAmount &&
    displayAmount.amount > 0 &&
    displayAmount.currency !== baseCurrency
  ) {
    const displayCurrencyName = i18n.__({
      phrase: `currency.${displayAmount.currency}.name`,
      locale,
    })
    const displayCurrencySymbol = i18n.__({
      phrase: `currency.${displayAmount.currency}.symbol`,
      locale,
    })
    const displayCurrencyAmount = displayAmount.amount.toLocaleString(locale, {
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
