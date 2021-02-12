import { brokerMediciPath, customerPath, lndAccountingPath } from "./ledger"
import { MainBook } from "./mongodb"
import { UserWallet } from "./wallet"


export const addTransactionLndReceipt = async ({description, payeeUser, metadata, sats}) => {
  const brokerPath = await brokerMediciPath()
  
  const entry = MainBook.entry(description)

  entry
    .debit(payeeUser.accountPath, sats * payeeUser.ratioBtc, { ...metadata, currency: "BTC" })
    .debit(brokerPath, sats * payeeUser.ratioUsd, { ...metadata, currency: "BTC" })
    
    // always 100%
    .credit(lndAccountingPath, sats, { ...metadata, currency: "BTC" })  
  
  if (!!payeeUser.ratioUsd) {
    const satsToConvert = sats * payeeUser.ratioUsd
    
    // TODO: add spread
    const usdEquivalent = satsToConvert * UserWallet.lastPrice

    entry
      .debit(payeeUser.accountPath, usdEquivalent, { ...metadata, currency: "USD" })
      .credit(brokerPath, usdEquivalent, { ...metadata, currency: "USD" })
  }

  // TODO: log the exchange rate

  await entry.commit()
}


export const addTransactionLndPayment = async ({description, sats, metadata, payerUser}) => {
  const brokerPath = await brokerMediciPath()

  const entry = MainBook.entry(description)

  entry 
    // always 100%
    .debit(lndAccountingPath, sats, { ...metadata, currency: "BTC" })

    .credit(payerUser.accountPath, sats * payerUser.ratioBtc, { ...metadata, currency: "BTC" })
    .credit(brokerPath, sats * payerUser.ratioUsd, { ...metadata, currency: "BTC" })

  if (!!payerUser.ratioUsd) {
    const satsToConvert = sats * payerUser.ratioUsd
    const usdEquivalent = satsToConvert * UserWallet.lastPrice

    entry
      .debit(brokerPath, usdEquivalent, { ...metadata, currency: "USD" })
      .credit(payerUser.accountPath, usdEquivalent, { ...metadata, currency: "USD" })
  }

  await entry.commit()

  return entry
}

export const addTransactionOnUsPayment = async ({description, sats, metadata, payerUser, payeeUser, memoPayer}) => {
  const brokerPath = await brokerMediciPath()

  const entry = MainBook.entry(description)

  entry
    .debit(customerPath(payeeUser._id), sats * payeeUser.ratioBtc, { ...metadata, username: payerUser.username, currency: "BTC"})
    .credit(payerUser.accountPath, sats * payerUser.ratioBtc, { ...metadata, memoPayer, username: payeeUser.username, currency: "BTC" })

  if (payeeUser.ratioBtc > payerUser.ratioBtc) {
    entry.credit(brokerPath, sats * (payeeUser.ratioBtc - payerUser.ratioBtc), { ...metadata, currency: "BTC" })
  } else if (payeeUser.ratioBtc < payerUser.ratioBtc) {
    entry.debit(brokerPath, sats * (payerUser.ratioBtc - payeeUser.ratioBtc), { ...metadata, currency: "BTC" })
  }

  if (!!payerUser.ratioUsd || !!payeeUser.ratioUsd) {
    const usdEq = sats * UserWallet.lastPrice

    entry
      .debit(customerPath(payeeUser._id), usdEq * payeeUser.ratioUsd, { ...metadata, username: payerUser.username, currency: "USD"})
      .credit(payerUser.accountPath, usdEq * payerUser.ratioUsd, { ...metadata, memoPayer, username: payeeUser.username, currency: "USD" })

    if (payeeUser.ratioUsd > payerUser.ratioUsd) {
      entry.credit(brokerPath, usdEq * (payeeUser.ratioUsd - payerUser.ratioUsd), { ...metadata, currency: "USD" })
    } else if (payeeUser.ratioUsd < payerUser.ratioUsd) {
      entry.debit(brokerPath, usdEq * (payerUser.ratioUsd - payeeUser.ratioUsd), { ...metadata, currency: "USD" })
    }
  }

  await entry.commit()

  return entry
}

export const rebalancePortfolio = async ({description, metadata, wallet}) => {
  const brokerPath = await brokerMediciPath()
  
  const balances = await wallet.getBalances()

  const expectedBtc = wallet.user.ratioBtc * balances.total_in_BTC
  const expectedUsd = wallet.user.ratioUsd * balances.total_in_USD

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