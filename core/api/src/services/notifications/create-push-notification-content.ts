import { getI18nInstance } from "@/config"

import { getCurrencyMajorExponent, MajorExponent } from "@/domain/fiat"
import { WalletCurrency } from "@/domain/shared"
import { getLanguageOrDefault } from "@/domain/locale"

const i18n = getI18nInstance()

const customToLocaleString = (
  number: number,
  locale: Intl.LocalesArgument,
  options: Intl.NumberFormatOptions,
) => {
  const isWholeNumber = number % 1 === 0
  if (isWholeNumber) {
    options.maximumFractionDigits = 0
  } else {
    options.minimumFractionDigits = options.maximumFractionDigits
  }
  return number.toLocaleString(locale, options)
}

export const createPushNotificationContent = <T extends DisplayCurrency>({
  type,
  amount,
  displayAmount,
  userLanguage,
}: {
  type: NotificationType | "balance"
  amount: Amount<WalletCurrency>
  displayAmount?: DisplayAmount<T>
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
  const baseCurrencyAmount = customToLocaleString(Number(displayedBaseAmount), locale, {
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

  if (displayAmount && displayAmount.currency !== baseCurrency) {
    const exponent = getCurrencyMajorExponent(displayAmount.currency)
    const displayCurrencyAmount = customToLocaleString(
      Number(displayAmount.displayInMajor),
      locale,
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: exponent,
        currency: displayAmount.currency,
        style: "currency",
        currencyDisplay: "narrowSymbol",
      },
    )
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
