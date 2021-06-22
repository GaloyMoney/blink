import { dealerMediciPath, customerPath, lndAccountingPath } from "./ledger"
import { MainBook } from "../mongodb"
import { UserWallet } from "../userWallet"

export const addTransactionLndReceipt = async ({
  description,
  payeeUser,
  metadata,
  sats,
}) => {
  const dealerPath = await dealerMediciPath()

  const entry = MainBook.entry(description)

  entry
    .credit(payeeUser.accountPath, sats * payeeUser.ratioBtc, {
      ...metadata,
      currency: "BTC",
    })
    .credit(dealerPath, sats * payeeUser.ratioUsd, { ...metadata, currency: "BTC" })

    // always 100%
    .debit(lndAccountingPath, sats, { ...metadata, currency: "BTC" })

  if (payeeUser.ratioUsd) {
    const satsToConvert = sats * payeeUser.ratioUsd

    // TODO: add spread
    const usdEquivalent = satsToConvert * UserWallet.lastPrice

    entry
      .credit(payeeUser.accountPath, usdEquivalent, { ...metadata, currency: "USD" })
      .debit(dealerPath, usdEquivalent, { ...metadata, currency: "USD" })
  }

  // TODO: log the exchange rate

  await entry.commit()
}

export const addTransactionLndPayment = async ({
  description,
  sats,
  metadata,
  payerUser,
}) => {
  const dealerPath = await dealerMediciPath()

  const entry = MainBook.entry(description)

  entry
    // always 100%
    .credit(lndAccountingPath, sats, { ...metadata, currency: "BTC" })

    .debit(payerUser.accountPath, sats * payerUser.ratioBtc, {
      ...metadata,
      currency: "BTC",
    })
    .debit(dealerPath, sats * payerUser.ratioUsd, { ...metadata, currency: "BTC" })

  if (payerUser.ratioUsd) {
    const satsToConvert = sats * payerUser.ratioUsd
    const usdEquivalent = satsToConvert * UserWallet.lastPrice

    entry
      .credit(dealerPath, usdEquivalent, { ...metadata, currency: "USD" })
      .debit(payerUser.accountPath, usdEquivalent, { ...metadata, currency: "USD" })
  }

  await entry.commit()

  return entry
}

export const addTransactionOnUsPayment = async ({
  description,
  sats,
  metadata,
  payerUser,
  payeeUser,
  memoPayer,
}) => {
  const dealerPath = await dealerMediciPath()

  const entry = MainBook.entry(description)

  entry
    .credit(customerPath(payeeUser._id), sats * payeeUser.ratioBtc, {
      ...metadata,
      username: payerUser.username,
      currency: "BTC",
    })
    .debit(payerUser.accountPath, sats * payerUser.ratioBtc, {
      ...metadata,
      memoPayer,
      username: payeeUser.username,
      currency: "BTC",
    })

  if (payeeUser.ratioBtc > payerUser.ratioBtc) {
    entry.debit(dealerPath, sats * (payeeUser.ratioBtc - payerUser.ratioBtc), {
      ...metadata,
      currency: "BTC",
    })
  } else if (payeeUser.ratioBtc < payerUser.ratioBtc) {
    entry.credit(dealerPath, sats * (payerUser.ratioBtc - payeeUser.ratioBtc), {
      ...metadata,
      currency: "BTC",
    })
  }

  if (!!payerUser.ratioUsd || !!payeeUser.ratioUsd) {
    const usdEq = sats * UserWallet.lastPrice

    entry
      .credit(customerPath(payeeUser._id), usdEq * payeeUser.ratioUsd, {
        ...metadata,
        username: payerUser.username,
        currency: "USD",
      })
      .debit(payerUser.accountPath, usdEq * payerUser.ratioUsd, {
        ...metadata,
        memoPayer,
        username: payeeUser.username,
        currency: "USD",
      })

    if (payeeUser.ratioUsd > payerUser.ratioUsd) {
      entry.debit(dealerPath, usdEq * (payeeUser.ratioUsd - payerUser.ratioUsd), {
        ...metadata,
        currency: "USD",
      })
    } else if (payeeUser.ratioUsd < payerUser.ratioUsd) {
      entry.credit(dealerPath, usdEq * (payerUser.ratioUsd - payeeUser.ratioUsd), {
        ...metadata,
        currency: "USD",
      })
    }
  }

  await entry.commit()

  return entry
}

export const rebalancePortfolio = async ({ description, metadata, wallet }) => {
  const dealerPath = await dealerMediciPath()

  const balances = await wallet.getBalances()

  const expectedBtc = wallet.user.ratioBtc * balances.total_in_BTC
  const expectedUsd = wallet.user.ratioUsd * balances.total_in_USD

  const diffBtc = expectedBtc - balances.BTC
  const btcAmount = Math.abs(diffBtc)
  const usdAmount = Math.abs(expectedUsd - balances.USD)

  const buyOrSell = diffBtc ? (diffBtc > 0 ? "buy" : "sell") : null

  const entry = MainBook.entry(description)

  // user buy btc
  if (buyOrSell === "buy") {
    entry
      .credit(wallet.user.accountPath, btcAmount, { ...metadata, currency: "BTC" })
      .debit(dealerPath, btcAmount, { ...metadata, currency: "BTC" })

      .debit(wallet.user.accountPath, usdAmount, { ...metadata, currency: "USD" })
      .credit(dealerPath, usdAmount, { ...metadata, currency: "USD" })
    // user sell btc
  } else if (buyOrSell === "sell") {
    entry
      .debit(wallet.user.accountPath, btcAmount, { ...metadata, currency: "BTC" })
      .credit(dealerPath, btcAmount, { ...metadata, currency: "BTC" })

      .credit(wallet.user.accountPath, usdAmount, { ...metadata, currency: "USD" })
      .debit(dealerPath, usdAmount, { ...metadata, currency: "USD" })
  } else {
    // no-op
    return null
  }

  await entry.commit()
  return null
}
