import { filter } from "lodash";
import { lndFee, escrowAccountingPath, lightningAccountingPath } from "./ledger";
import { lnd } from "./lndConfig";
import { InvoiceUser, MainBook, Transaction, User } from "./mongodb";
import { SpecterWallet } from "./SpecterWallet";
import { baseLogger } from "./utils";
import { getBrokerWallet, getFunderWallet, WalletFactory } from "./walletFactory";
import { lndBalances } from "./utils"
const lnService = require('ln-service')

const logger = baseLogger.child({module: "admin"})

export const updateUsersPendingPayment = async () => {
  let userWallet

  for await (const user of User.find({})) {
    logger.trace("updating user %o", user._id)

    // A better approach would be to just loop over pending: true invoice/payment
    userWallet = await WalletFactory({user, uid: user._id, currency: user.currency, logger})
    await userWallet.updatePending()
  }
}

export const payCashBack = async () => {
  const cashback = process.env.CASHBACK
  logger.info({cashback}, "cashback enabled?")

  if (!cashback) {
    return
  }

  const fundingWallet = await getFunderWallet({ logger })  

  const invoices = await InvoiceUser.find({ cashback: true })
  for (const invoice_db of invoices) {
    const invoice = await lnService.getInvoice({ lnd, id: invoice_db._id })
    const result = await fundingWallet.pay({invoice: invoice.request, isReward: true})
    logger.info({invoice, invoice_db, result}, "cashback succesfully sent")
  }
}


export const getBalanceSheet = async () => {    
  const { balance: assets } = await MainBook.balance({account_path: "Assets", currency: "BTC"}) 
  const { balance: liabilities } = await MainBook.balance({account_path: "Liabilities", currency: "BTC"}) 
  const { balance: lightning } = await MainBook.balance({accounts: lightningAccountingPath, currency: "BTC"}) 
  const { balance: expenses } = await MainBook.balance({accounts: lndFee, currency: "BTC"}) 

  return {assets, liabilities, lightning, expenses }
}

export const balanceSheetIsBalanced = async () => {
  const {assets, liabilities, lightning, expenses } = await getBalanceSheet()
  const { total: lnd } = await lndBalances() // doesnt include ercrow amount

  const brokerWallet = await getBrokerWallet({ logger })
  const { sats: ftx } = await brokerWallet.getExchangeBalance()

  const specterWallet = new SpecterWallet({ logger })
  await specterWallet.setBitcoindClient()
  let specter = await specterWallet.getBitcoindBalance()

  if (isNaN(specter)) {
    specter = 0
  }

  const assetsLiabilitiesDifference = 
    assets /* assets is positive */
    + liabilities /* liabilities is negative */
    + expenses /* expense is negative */
  const bookingVersusRealWorldAssets = (lnd + ftx + specter) - lightning
  if(!!bookingVersusRealWorldAssets) {
    logger.debug({lnd, lightning, bookingVersusRealWorldAssets, assets, liabilities, expenses}, `not balanced`)
  }

  return { assetsLiabilitiesDifference, bookingVersusRealWorldAssets }
}

export const updateEscrows = async () => {
  const type = "escrow"

  const metadata = { type, currency: "BTC", pending: false }

  const { channels } = await lnService.getChannels({lnd})
  const selfInitated = filter(channels, {is_partner_initiated: false})

  const mongotxs = await Transaction.aggregate([
    { $match: { type: "escrow", accounts: lightningAccountingPath }}, 
    { $group: {_id: "$txid", total: { "$sum": "$debit" } }},
  ])

  for (const channel of selfInitated) {

    const txid = `${channel.transaction_id}:${channel.transaction_vout}`
    
    const mongotx = filter(mongotxs, {_id: txid})[0] ?? { total: 0 }

    logger.debug({mongotx, channel}, "need escrow?")

    if (mongotx?.total === channel.commit_transaction_fee) {
      continue
    }

    //log can be located by searching for 'update escrow' in gke logs
    //FIXME: Remove once escrow bug is fixed
    const diff = channel.commit_transaction_fee - (mongotx?.total)
    logger.debug({diff}, `update escrow with diff`)

    await MainBook.entry("escrow")
      .debit(lightningAccountingPath, diff, {...metadata, txid})
      .credit(escrowAccountingPath, diff, {...metadata, txid})
      .commit()
  }

}
