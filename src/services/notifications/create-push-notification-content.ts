import { getI18nInstance } from "@config"

import { MajorExponent } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"
import { getLanguageOrDefault } from "@domain/locale"

const i18n = getI18nInstance()

export const createPushNotificationContent = ({
  type,
  amount,
  displayAmount,
  userLanguage,
}: {
  type: NotificationType | "balance"
  amount: Amount<WalletCurrency>
  displayAmount?: DisplayAmount<DisplayCurrency>
  userLanguage: UserLanguageOrEmpty
}): {
  title: string
  body: string
} => {
  const locale = getLanguageOrDefault(userLanguage)
  const baseCurrency = amount.currency
  const notificationType = type === "balance" ? type : `transaction.${type}`
  const title = i18n.__(
    { phrase: `notification.${notificationType}.title`, locale },
    { walletCurrency: baseCurrency },
  )
  const baseCurrencyName = baseCurrency === WalletCurrency.Btc ? "sats" : ""
  const displayedBaseAmount =
    baseCurrency === WalletCurrency.Usd ? Number(amount.amount) / 100 : amount.amount
  const baseCurrencyAmount = displayedBaseAmount.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: MajorExponent.STANDARD,
    currency: baseCurrency,
    style: baseCurrency === WalletCurrency.Btc ? "decimal" : "currency",
    currencyDisplay: "narrowSymbol",
  })

  let body = i18n.__(
    { phrase: `notification.${notificationType}.body`, locale },
    {
      baseCurrencyAmount,
      baseCurrencyName: baseCurrencyName ? ` ${baseCurrencyName}` : "",
    },
  )

  if (
    displayAmount &&
    displayAmount.amount > 0 &&
    displayAmount.currency !== baseCurrency
  ) {
    const displayCurrencyAmount = displayAmount.amount.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: MajorExponent.STANDARD,
      currency: displayAmount.currency,
      style: "currency",
      currencyDisplay: "narrowSymbol",
    })
    body = i18n.__(
      { phrase: `notification.${notificationType}.bodyDisplayCurrency`, locale },
      {
        displayCurrencyAmount,
        baseCurrencyAmount,
        baseCurrencyName: baseCurrencyName ? ` ${baseCurrencyName}` : "",
      },
    )
  }

  return { title, body }
}
