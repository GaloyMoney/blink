import { find } from "lodash"
import { brokerLndPath, lndAccountingPath } from "./ledger"
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

const onUsPayment = () => {
  // const needConversion = isEqual(lndWallet, payee)

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