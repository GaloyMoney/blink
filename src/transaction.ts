import { find } from "lodash"
import { brokerLndPath, customerPath, lndAccountingPath } from "./ledger"
import { MainBook } from "./mongodb"
import { UserWallet } from "./wallet"


export const accountingLndReceipt = async ({description, payee, metadata, sats}) => { // payee: User
  const brokerPath = await brokerLndPath()
  
  const entry = MainBook.entry(description)

  entry
    .debit(payee.accountPath, sats * payee.user.pctBtc, { ...metadata, currency: "BTC" })
    .debit(brokerPath, sats * payee.user.pctUsd, { ...metadata, currency: "BTC" })
    
    // always 100%
    .credit(lndAccountingPath, sats, { ...metadata, currency: "BTC" })  
  
  if (!!payee.user.pctUsd) {
    const satsToConvert = sats * payee.user.pctUsd
    
    // TODO: add spread
    const usdEquivalent = satsToConvert * UserWallet.lastPrice

    entry
      .debit(payee.accountPath, usdEquivalent, { ...metadata, currency: "USD" })
      .credit(brokerPath, usdEquivalent, { ...metadata, currency: "USD" })
  }

  // TODO: log the exchange rate

  await entry.commit()
}


export const accountingLndPayment = async ({description, sats, metadata, payer}) => {
  const brokerPath = await brokerLndPath()

  const entry = MainBook.entry(description)

  entry 
    // always 100%
    .debit(lndAccountingPath, sats, { ...metadata, currency: "BTC" })

    .credit(payer.accountPath, sats * payer.user.pctBtc, { ...metadata, currency: "BTC" })
    .credit(brokerPath, sats * payer.user.pctUsd, { ...metadata, currency: "BTC" })

  if (!!payer.user.pctUsd) {
    const satsToConvert = sats * payer.user.pctUsd
    const usdEquivalent = satsToConvert * UserWallet.lastPrice

    entry
      .debit(brokerPath, usdEquivalent, { ...metadata, currency: "USD" })
      .credit(payer.accountPath, usdEquivalent, { ...metadata, currency: "USD" })
  }

  await entry.commit()

  return entry
}

export const onUsPayment = async ({description, sats, metadata, payer, payeeUser, memoPayer}) => {
  const brokerPath = await brokerLndPath()

  const entry = MainBook.entry(description)

  entry
    .debit(customerPath(payeeUser._id), sats * payeeUser.pctBtc, { ...metadata, username: payer.user.username, currency: "BTC"})
    .credit(payer.accountPath, sats * payer.user.pctBtc, { ...metadata, memoPayer, username: payeeUser.username, currency: "BTC" })

  if (payeeUser.pctBtc > payer.user.pctBtc) {
    entry.credit(brokerPath, sats * (payeeUser.pctBtc - payer.user.pctBtc), { ...metadata, currency: "BTC" })
  } else if (payeeUser.pctBtc < payer.user.pctBtc) {
    entry.debit(brokerPath, sats * (payer.user.pctBtc - payeeUser.pctBtc), { ...metadata, currency: "BTC" })
  }

  if (!!payer.user.pctUsd || !!payeeUser.pctUsd) {
    const usdEq = sats * UserWallet.lastPrice

    entry
      .debit(customerPath(payeeUser._id), usdEq * payeeUser.pctUsd, { ...metadata, username: payer.user.username, currency: "USD"})
      .credit(payer.accountPath, usdEq * payer.user.pctUsd, { ...metadata, memoPayer, username: payeeUser.username, currency: "USD" })

    if (payeeUser.pctUsd > payer.user.pctUsd) {
      entry.credit(brokerPath, usdEq * (payeeUser.pctUsd - payer.user.pctUsd), { ...metadata, currency: "USD" })
    } else if (payeeUser.pctUsd < payer.user.pctUsd) {
      entry.debit(brokerPath, usdEq * (payer.user.pctUsd - payeeUser.pctUsd), { ...metadata, currency: "USD" })
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
      .debit(wallet.accountPath, btcAmount, { ...metadata, currency: "BTC" })
      .credit(brokerPath, btcAmount, { ...metadata, currency: "BTC" })

      .credit(wallet.accountPath, usdAmount, { ...metadata, currency: "USD"})
      .debit(brokerPath, usdAmount, { ...metadata, currency: "USD" })
  // user sell btc
  } else if (buyOrSell === "sell") {
    entry
      .credit(wallet.accountPath, btcAmount, { ...metadata, currency: "BTC" })
      .debit(brokerPath, btcAmount, { ...metadata, currency: "BTC" })

      .debit(wallet.accountPath, usdAmount, { ...metadata, currency: "USD"})
      .credit(brokerPath, usdAmount, { ...metadata, currency: "USD" })
  } else {
    // no-op
    return null
  }

  await entry.commit()
  return null
}