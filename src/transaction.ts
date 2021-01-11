import { find } from "lodash"
import { brokerLndPath, customerPath, lndAccountingPath } from "./ledger"
import { MainBook } from "./mongodb"
import { UserWallet } from "./wallet"


export const accountingLndReceipt = async ({description, payeeUser, metadata, sats}) => {
  const brokerPath = await brokerLndPath()
  
  const entry = MainBook.entry(description)

  entry
    .debit(payeeUser.accountPath, sats * payeeUser.pctBtc, { ...metadata, currency: "BTC" })
    .debit(brokerPath, sats * payeeUser.pctUsd, { ...metadata, currency: "BTC" })
    
    // always 100%
    .credit(lndAccountingPath, sats, { ...metadata, currency: "BTC" })  
  
  if (!!payeeUser.pctUsd) {
    const satsToConvert = sats * payeeUser.pctUsd
    
    // TODO: add spread
    const usdEquivalent = satsToConvert * UserWallet.lastPrice

    entry
      .debit(payeeUser.accountPath, usdEquivalent, { ...metadata, currency: "USD" })
      .credit(brokerPath, usdEquivalent, { ...metadata, currency: "USD" })
  }

  // TODO: log the exchange rate

  await entry.commit()
}


export const accountingLndPayment = async ({description, sats, metadata, payerUser}) => {
  const brokerPath = await brokerLndPath()

  const entry = MainBook.entry(description)

  entry 
    // always 100%
    .debit(lndAccountingPath, sats, { ...metadata, currency: "BTC" })

    .credit(payerUser.accountPath, sats * payerUser.pctBtc, { ...metadata, currency: "BTC" })
    .credit(brokerPath, sats * payerUser.pctUsd, { ...metadata, currency: "BTC" })

  if (!!payerUser.pctUsd) {
    const satsToConvert = sats * payerUser.pctUsd
    const usdEquivalent = satsToConvert * UserWallet.lastPrice

    entry
      .debit(brokerPath, usdEquivalent, { ...metadata, currency: "USD" })
      .credit(payerUser.accountPath, usdEquivalent, { ...metadata, currency: "USD" })
  }

  await entry.commit()

  return entry
}

export const onUsPayment = async ({description, sats, metadata, payerUser, payeeUser, memoPayer}) => {
  const brokerPath = await brokerLndPath()

  const entry = MainBook.entry(description)

  entry
    .debit(customerPath(payeeUser._id), sats * payeeUser.pctBtc, { ...metadata, username: payerUser.username, currency: "BTC"})
    .credit(payerUser.accountPath, sats * payerUser.pctBtc, { ...metadata, memoPayer, username: payeeUser.username, currency: "BTC" })

  if (payeeUser.pctBtc > payerUser.pctBtc) {
    entry.credit(brokerPath, sats * (payeeUser.pctBtc - payerUser.pctBtc), { ...metadata, currency: "BTC" })
  } else if (payeeUser.pctBtc < payerUser.pctBtc) {
    entry.debit(brokerPath, sats * (payerUser.pctBtc - payeeUser.pctBtc), { ...metadata, currency: "BTC" })
  }

  if (!!payerUser.pctUsd || !!payeeUser.pctUsd) {
    const usdEq = sats * UserWallet.lastPrice

    entry
      .debit(customerPath(payeeUser._id), usdEq * payeeUser.pctUsd, { ...metadata, username: payerUser.username, currency: "USD"})
      .credit(payerUser.accountPath, usdEq * payerUser.pctUsd, { ...metadata, memoPayer, username: payeeUser.username, currency: "USD" })

    if (payeeUser.pctUsd > payerUser.pctUsd) {
      entry.credit(brokerPath, usdEq * (payeeUser.pctUsd - payerUser.pctUsd), { ...metadata, currency: "USD" })
    } else if (payeeUser.pctUsd < payerUser.pctUsd) {
      entry.debit(brokerPath, usdEq * (payerUser.pctUsd - payeeUser.pctUsd), { ...metadata, currency: "USD" })
    }
  }

  await entry.commit()

  return entry
}

export const rebalance = async ({description, metadata, wallet}) => {
  const brokerPath = await brokerLndPath()
  
  const balances = await wallet.getBalances()

  const expectedBtc = wallet.user.pctBtc * balances.total_in_BTC
  const expectedUsd = wallet.user.pctUsd * balances.total_in_USD

  const diffBtc = expectedBtc - balances.BTC
  const btcAmount = Math.abs(diffBtc)
  const usdAmount = Math.abs(expectedUsd - balances.USD)

  const buyOrSell = !!diffBtc ? diffBtc > 0 ? "buy": "sell": null 

  const entry = MainBook.entry(description)

  // user buy btc
  if (buyOrSell === "buy") {    
    entry
      .debit(wallet.user.accountPath, btcAmount, { ...metadata, currency: "BTC" })
      .credit(brokerPath, btcAmount, { ...metadata, currency: "BTC" })

      .credit(wallet.user.accountPath, usdAmount, { ...metadata, currency: "USD"})
      .debit(brokerPath, usdAmount, { ...metadata, currency: "USD" })
  // user sell btc
  } else if (buyOrSell === "sell") {
    entry
      .credit(wallet.user.accountPath, btcAmount, { ...metadata, currency: "BTC" })
      .debit(brokerPath, btcAmount, { ...metadata, currency: "BTC" })

      .debit(wallet.user.accountPath, usdAmount, { ...metadata, currency: "USD"})
      .credit(brokerPath, usdAmount, { ...metadata, currency: "USD" })
  } else {
    // no-op
    return null
  }

  await entry.commit()
  return null
}