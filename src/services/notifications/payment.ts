import { getDisplayCurrency, getI18nInstance, getLocale } from "@config"

import { sendNotification } from "./notification"

const i18n = getI18nInstance()
const defaultLocale = getLocale()
const { symbol: fiatSymbol } = getDisplayCurrency()

export const getTitleBitcoin = ({
  type,
  locale,
  fiatSymbol,
  fiatAmount,
  satsAmount,
}: GetTitleBitcoinArgs): string => {
  return i18n.__(
    { phrase: `notification.btcPayments.${type}.fiat`, locale },
    { fiatSymbol, fiatAmount, satsAmount },
  )
}

export const getTitleBitcoinNoDisplayCurrency = ({
  type,
  locale,
  satsAmount,
}: GetTitleBitcoinNoDisplayCurrencyArgs) => {
  return i18n.__(
    { phrase: `notification.btcPayments.${type}.sats`, locale },
    { satsAmount },
  )
}

export const getTitleUsd = {
  "paid-invoice": ({ displayCurrency, cents }: getTitleUsdArgs) =>
    `+$${displayCurrency.toFixed(2)} | ${cents} cents`,
  "onchain_receipt": ({ displayCurrency, cents }: getTitleUsdArgs) =>
    `+$${displayCurrency.toFixed(2)} | ${cents} cents`,
  "onchain_receipt_pending": ({ displayCurrency, cents }: getTitleUsdArgs) =>
    `pending +$${displayCurrency.toFixed(2)} | ${cents} cents`,
  "onchain_payment": (cents: UsdCents) =>
    `Sent onchain payment of ${cents.toFixed(0)} cents confirmed`,
  "intra_ledger_receipt": ({ displayCurrency, cents }: getTitleUsdArgs) =>
    `+$${displayCurrency.toFixed(2)} | ${cents} cents`,
  "intra_ledger_payment": ({ displayCurrency, cents }: getTitleUsdArgs) =>
    `Sent payment of $${displayCurrency.toFixed(2)} | ${cents} cents`,
}

export const getTitleUsdNoDisplayCurrency = {
  "paid-invoice": (cents: UsdCents) => `+${cents} sats`,
  "onchain_receipt": (cents: UsdCents) => `+${cents} sats`,
  "onchain_receipt_pending": (cents: UsdCents) => `pending +${cents} sats`,
  "onchain_payment": (cents: UsdCents) =>
    `Sent onchain payment of ${cents} sats confirmed`,
  "intra_ledger_receipt": (cents: UsdCents) => `+${cents} sats`,
  "intra_ledger_payment": (cents: UsdCents) => `Sent payment of ${cents} sats`,
}

export const transactionBitcoinNotification = async ({
  sats,
  type,
  user,
  logger,
  paymentHash,
  txHash,
  displayCurrencyPerSat,
}: IPaymentBitcoinNotification) => {
  const locale = user.language || defaultLocale
  const satsAmount = sats + ""
  let title = getTitleBitcoinNoDisplayCurrency({ type, locale, satsAmount })

  if (displayCurrencyPerSat) {
    const fiatAmount = (sats * displayCurrencyPerSat).toLocaleString(locale, {
      maximumFractionDigits: 2,
    })
    title = getTitleBitcoin({
      type,
      locale,
      fiatSymbol,
      fiatAmount,
      satsAmount,
    })
  }

  const data: IDataNotification = {
    type: type as LedgerTransactionType,
    hash: paymentHash, // offchain
    amount: sats,
    txid: txHash, // onchain ... use the same property? txid have an index as well
  }

  await sendNotification({ title, user, logger, data })
}

export const transactionUsdNotification = async ({
  cents,
  type,
  user,
  logger,
  paymentHash,
  txHash,
  displayCurrencyPerSat,
}: IPaymentUsdNotification) => {
  let title = getTitleUsdNoDisplayCurrency[type](cents)

  if (displayCurrencyPerSat) {
    // FIXME: This 'displayCurrency' calc may be wrong
    const displayCurrency = cents * displayCurrencyPerSat
    title = getTitleUsd[type]({ displayCurrency, cents })
  }

  const data: IDataNotification = {
    type: type as LedgerTransactionType,
    hash: paymentHash, // offchain
    cents,
    txid: txHash, // onchain ... use the same property? txid have an index as well
  }

  await sendNotification({ title, user, logger, data })
}
