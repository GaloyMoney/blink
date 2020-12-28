import { find } from "lodash"
import { brokerLndPath, lndAccountingPath } from "./ledger"
import { MainBook } from "./mongodb"
import { UserWallet } from "./wallet"


export const receiptLnd = async ({description, payee, hash, sats}) => { // payee: User
  const brokerPath = await brokerLndPath()

  const metadata = { hash, type: "invoice", ...UserWallet.getCurrencyEquivalent({ sats, fee: 0 }) }
  
  const pctUsd = (find(payee.currencies, {id: "USD"})?.pct ?? 0)
  const pctBtc = 1 - pctUsd

  const entry = MainBook.entry(description)

  entry
    .debit(payee.accountPath, sats * pctBtc, { ...metadata, currency: "BTC" })
    .debit(brokerPath, sats * pctUsd, { ...metadata, currency: "BTC" })
    
    // always 100%
    .credit(lndAccountingPath, sats, { ...metadata, currency: "BTC" })  
  
  if (!!pctUsd) {
    const satsToConvert = sats * pctUsd
    
    // TODO: add spread
    const usdEquivalent = satsToConvert * UserWallet.lastPrice

    entry
      .debit(payee.accountPath, usdEquivalent, { ...metadata, currency: "USD" })
      .credit(brokerPath, usdEquivalent, { ...metadata, currency: "USD" })
  }

  await entry.commit()
}

const onUsPayment = () => {
  // const needConversion = isEqual(lndWallet, payee)

}