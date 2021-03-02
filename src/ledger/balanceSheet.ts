import { filter } from "lodash";
import { bitcoindAccountingPath, escrowAccountingPath, lndAccountingPath, lndFeePath } from "./ledger";
import { lnd } from "../lndConfig";
import { MainBook } from "../mongodb";
import { SpecterWallet } from "../SpecterWallet";
import { baseLogger } from "../utils";
import { getFunderWallet, WalletFactory } from "../walletFactory";
import { lndBalances } from "../lndUtils"
import { InvoiceUser, Transaction, User } from "../schema";
import lnService from 'ln-service'

const logger = baseLogger.child({module: "admin"})

export const updateUsersPendingPayment = async () => {
  let userWallet

  for await (const user of User.find({})) {
    logger.trace("updating user %o", user._id)

    // A better approach would be to just loop over pending: true invoice/payment
    userWallet = await WalletFactory({user, logger})
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
  const { balance: lightning } = await MainBook.balance({accounts: lndAccountingPath, currency: "BTC"}) 
  const { balance: bitcoin } = await MainBook.balance({accounts: bitcoindAccountingPath, currency: "BTC"}) 
  const { balance: expenses } = await MainBook.balance({accounts: lndFeePath, currency: "BTC"}) 

  return {assets, liabilities, lightning, expenses, bitcoin }
}

export const balanceSheetIsBalanced = async () => {
  const {assets, liabilities, lightning, bitcoin, expenses } = await getBalanceSheet()
  const { total: lnd } = await lndBalances() // doesnt include escrow amount

  const specterWallet = new SpecterWallet({ logger })
  let bitcoind = await specterWallet.getBitcoindBalance()

  const assetsLiabilitiesDifference = 
    assets /* assets is ___ */
    + liabilities /* liabilities is ___ */
    + expenses /* expense is positif */

  const bookingVersusRealWorldAssets = 
    (lnd + bitcoind) + // physical assets or value of account at third party
    (lightning + bitcoin) // value in accounting
  
  if(!!bookingVersusRealWorldAssets || !!assetsLiabilitiesDifference) {
    logger.debug({
      assetsLiabilitiesDifference, bookingVersusRealWorldAssets,
      assets, liabilities, expenses,  
      lnd, lightning, 
      bitcoind, bitcoin
    }, `not balanced`)
  }

  return { assetsLiabilitiesDifference, bookingVersusRealWorldAssets }
}

export const updateEscrows = async () => {
  const type = "escrow"

  const metadata = { type, currency: "BTC", pending: false }

  const { channels } = await lnService.getChannels({lnd})
  const selfInitated = filter(channels, {is_partner_initiated: false})

  const mongotxs = await Transaction.aggregate([
    { $match: { type, accounts: lndAccountingPath }}, 
    { $group: {_id: "$txid", total: { "$sum": "$credit" } }},
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
      .credit(lndAccountingPath, diff, {...metadata, txid})
      .debit(escrowAccountingPath, diff, {...metadata, txid})
      .commit()
  }

}
