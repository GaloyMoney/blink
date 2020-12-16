import { filter, sumBy } from "lodash";
import { accountingExpenses, escrowAccountingPath, lightningAccountingPath, openChannelFees } from "./ledger";
import { InvoiceUser, MainBook, Transaction, User } from "./mongodb";
import { baseLogger, getAuth } from "./utils";
import { getBrokerWallet, getFunderWallet, WalletFactory } from "./walletFactory";
const lnService = require('ln-service')

const logger = baseLogger.child({module: "admin"})


export class AdminWallet {
  readonly lnd = lnService.authenticatedLndGrpc(getAuth()).lnd

  async updateUsersPendingPayment() {
    let userWallet

    for await (const user of User.find({})) {
      logger.trace("updating user %o", user._id)

      // A better approach would be to just loop over pending: true invoice/payment
      userWallet = await WalletFactory({user, uid: user._id, currency: user.currency, logger})
      await userWallet.updatePending()
    }
  }

  async payCashBack() {
    const lightningFundingWallet = await getFunderWallet({ logger })  

    const invoices = await InvoiceUser.find({ cashback: true })
    for (const invoice of invoices) {
      await lightningFundingWallet.pay({invoice, isReward: true})
    }
  }

  async getBooks() {
    const accounts = await MainBook.listAccounts()

    // used for debugging
    const books = {}
    for (const account of accounts) {
      for (const currency of ["USD", "BTC"]) {
        const { balance } = await MainBook.balance({
          account,
          currency,
        })
        if (!!balance) {
          books[`${currency}:${account}`] = balance
        }
      }
    }

    logger.debug(books, "status of our bookeeping")
    return books
  }

  async getBalanceSheet() {    
    const { balance: assets } = await MainBook.balance({accounts: "Assets", currency: "BTC"}) 
    const { balance: liabilities } = await MainBook.balance({accounts: "Liabilities", currency: "BTC"}) 
    const { balance: lightning } = await MainBook.balance({accounts: lightningAccountingPath, currency: "BTC"}) 
    const { balance: expenses } = await MainBook.balance({accounts: accountingExpenses, currency: "BTC"}) 

    return {assets, liabilities, lightning, expenses }
  }

  async balanceSheetIsBalanced() {
    const {assets, liabilities, lightning, expenses } = await this.getBalanceSheet()
    const { total: lnd } = await this.lndBalances() // doesnt include ercrow amount

    const brokerWallet = await getBrokerWallet({ logger })
    const { sats: ftx } = await brokerWallet.getExchangeBalance()

    const assetsLiabilitiesDifference = assets + (liabilities + expenses)
    const bookingVersusRealWorldAssets = (lnd + ftx) - lightning
    if(!!bookingVersusRealWorldAssets) {
      logger.debug({lnd, lightning, bookingVersusRealWorldAssets, assets, liabilities, expenses}, `not balanced`)
    }

    return { assetsLiabilitiesDifference, bookingVersusRealWorldAssets }
  }

  async lndBalances () {
    const { chain_balance } = await lnService.getChainBalance({lnd: this.lnd})
    const { channel_balance, pending_balance: opening_channel_balance } = await lnService.getChannelBalance({lnd: this.lnd})

    //FIXME: This can cause incorrect balance to be reported in case an unconfirmed txn is later cancelled/double spent
    // bitcoind seems to have a way to report this correctly. does lnd have?
    const { pending_chain_balance } = await lnService.getPendingChainBalance({lnd: this.lnd})

    const { channels: closedChannels } = await lnService.getClosedChannels({lnd: this.lnd})

    // FIXME: calculation seem wrong (seeing the grafana graph, need to double check)
    logger.debug({closedChannels}, "lnService.getClosedChannels")
    const closing_channel_balance = sumBy(closedChannels, channel => sumBy(
      (channel as any).close_payments, payment => (payment as any).is_pending ? (payment as any).tokens : 0 )
    )
    
    const total = chain_balance + channel_balance + pending_chain_balance + opening_channel_balance + closing_channel_balance
    return { total, onChain: chain_balance + pending_chain_balance, offChain: channel_balance, opening_channel_balance, closing_channel_balance } 
  }

  getInfo = async () => lnService.getWalletInfo({ lnd: this.lnd });

  async updateEscrows() {
    const type = "escrow"

    const metadata = { type, currency: "BTC" }

    const { channels } = await lnService.getChannels({lnd: this.lnd})
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
}
