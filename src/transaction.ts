import { find } from "lodash"
import { brokerLndPath, customerPath, lndAccountingPath } from "./ledger"
import { MainBook } from "./mongodb"
import { UserWallet } from "./wallet"


export const receiptLnd = async ({description, payee, metadata, sats}) => { // payee: User
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


export const payLnd = async ({description, sats, metadata, payer}) => {
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

export const rebalance = async ({description, metadata, wallet, newTarget = undefined}) => {
  const brokerPath = await brokerLndPath()
  
  const balances = await wallet.getBalances()

  const expectedBtc = wallet.user.pctBtc * balances.total_in_BTC
  const expectedUsd = wallet.user.pctUsd * balances.total_in_USD

  const diffBtcNeeded = expectedBtc - balances.BTC 
  const diffUsdNeeded = expectedUsd - balances.USD

  const entry = MainBook.entry(description)

  // buy btc
  if (diffBtcNeeded > 0) {    
    entry
      .debit(wallet.accountPath, diffBtcNeeded, { ...metadata, currency: "BTC" })
      .credit(brokerPath, diffBtcNeeded, { ...metadata, currency: "BTC" })

      .credit(wallet.accountPath, diffUsdNeeded, { ...metadata, currency: "USD"})
      .debit(brokerPath, diffUsdNeeded, { ...metadata, currency: "USD" })
  // sell btc
  } else if (diffBtcNeeded < 0) {
    entry
      .credit(wallet.accountPath, diffBtcNeeded, { ...metadata, currency: "BTC" })
      .debit(brokerPath, diffBtcNeeded, { ...metadata, currency: "BTC" })

      .debit(wallet.accountPath, diffUsdNeeded, { ...metadata, currency: "USD"})
      .credit(brokerPath, diffUsdNeeded, { ...metadata, currency: "USD" })
  } else {
    // no-op
    return null
  }

  await entry.commit()
  return null
}