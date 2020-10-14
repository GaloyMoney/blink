import { filter, find, sumBy } from "lodash";
import { WalletFactory, getBrokerWallet } from "./walletFactory";
import { MainBook, Transaction, User } from "./mongodb";
import { getAuth, baseLogger } from "./utils";
import { accountingExpenses, escrowAccountingPath, lightningAccountingPath, openChannelFees } from "./ledger";
const lnService = require('ln-service')

const logger = baseLogger.child({module: "admin"})


export class AdminWallet {
  readonly currency = "BTC" // add USD as well
  readonly lnd = lnService.authenticatedLndGrpc(getAuth()).lnd

  async updateUsersPendingPayment() {
    let userWallet

    for await (const user of User.find({}, { _id: 1})) {
      logger.debug("updating user %o", user._id)

      // A better approach would be to just loop over pending: true invoice/payment
      userWallet = WalletFactory({uid: user._id, currency: user.currency, logger})
      await userWallet.updatePending()
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
    const { balance: usd } = await MainBook.balance({accounts: "Liabilities", currency: "USD"}) 

    return {assets, liabilities, lightning, expenses, usd }
  }

  async balanceSheetIsBalanced() {
    const {assets, liabilities, lightning, expenses, usd } = await this.getBalanceSheet()
    const { total: lnd } = await this.lndBalances() // doesnt include ercrow amount
    const ftx = await this.ftxBalance()

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

    const closing_channel_balance = sumBy(closedChannels, channel => sumBy(
      (channel as any).close_payments, payment => (payment as any).is_pending ? (payment as any).tokens : 0 )
    )
    
    const total = chain_balance + channel_balance + pending_chain_balance + opening_channel_balance + closing_channel_balance
    return { total, onChain: chain_balance + pending_chain_balance, offChain: channel_balance, opening_channel_balance, closing_channel_balance } 
  }

  async ftxBalance () {
    const brokerWallet = await getBrokerWallet({ logger })
    const balance = await brokerWallet.getExchangeBalance()
    return balance.BTC
  }

  getInfo = async () => lnService.getWalletInfo({ lnd: this.lnd });

  async openChannel({local_tokens, public_key, socket}): Promise<string> {
    const {transaction_id} = await lnService.openChannel({ lnd: this.lnd, local_tokens,
      partner_public_key: public_key, partner_socket: socket
    })

    // FIXME: O(n), not great
    const { transactions } = await lnService.getChainTransactions({lnd: this.lnd})

    const { fee } = find(transactions, {id: transaction_id})

    const metadata = { currency: this.currency, txid: transaction_id, type: "fee" }

    await MainBook.entry("on chain fee")
      .debit(lightningAccountingPath, fee, {...metadata,})
      .credit(openChannelFees, fee, {...metadata})
      .commit()

    return transaction_id
  }

  async updateEscrows() {
    const type = "escrow"

    const metadata = { type, currency: this.currency }

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
