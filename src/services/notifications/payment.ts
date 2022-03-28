import { sendNotification } from "./notification"

export const getTitleBitcoin = {
  "paid-invoice": ({ displayCurrency, sats }: getTitleBitcoinArgs) =>
    `+$${displayCurrency.toFixed(2)} | ${sats} sats`,
  "onchain_receipt": ({ displayCurrency, sats }: getTitleBitcoinArgs) =>
    `+$${displayCurrency.toFixed(2)} | ${sats} sats`,
  "onchain_receipt_pending": ({ displayCurrency, sats }: getTitleBitcoinArgs) =>
    `pending +$${displayCurrency.toFixed(2)} | ${sats} sats`,
  "onchain_payment": ({ sats }: { sats: Satoshis }) =>
    `Sent onchain payment of ${sats} sats confirmed`,
  "intra_ledger_receipt": ({ displayCurrency, sats }: getTitleBitcoinArgs) =>
    `+$${displayCurrency.toFixed(2)} | ${sats} sats`,
  "intra_ledger_payment": ({ displayCurrency, sats }: getTitleBitcoinArgs) =>
    `Sent payment of $${displayCurrency.toFixed(2)} | ${sats} sats`,
}

export const getTitleBitcoinNoDisplayCurrency = {
  "paid-invoice": (sats: Satoshis) => `+${sats} sats`,
  "onchain_receipt": (sats: Satoshis) => `+${sats} sats`,
  "onchain_receipt_pending": (sats: Satoshis) => `pending +${sats} sats`,
  "onchain_payment": (sats: Satoshis) => `Sent onchain payment of ${sats} sats confirmed`,
  "intra_ledger_receipt": (sats: Satoshis) => `+${sats} sats`,
  "intra_ledger_payment": (sats: Satoshis) => `Sent payment of ${sats} sats`,
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
  let title = getTitleBitcoinNoDisplayCurrency[type](sats)

  if (displayCurrencyPerSat) {
    const displayCurrency = sats * displayCurrencyPerSat
    title = getTitleBitcoin[type]({ displayCurrency, sats })
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
