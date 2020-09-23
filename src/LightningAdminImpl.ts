import { filter, find } from "lodash";
import { WalletFactory } from "./walletFactory";
import { MainBook, Transaction, User } from "./mongodb";
import { getAuth, logger } from "./utils";
const lnService = require('ln-service')


export class AdminWallet {
  readonly currency = "BTC" // add USD as well
  readonly lnd = lnService.authenticatedLndGrpc(getAuth()).lnd

  async updateUsersPendingPayment() {
    let userWallet

    for await (const user of User.find({}, { _id: 1})) {
      logger.debug("updating user %o", user._id)

      // A better approach would be to just loop over pending: true invoice/payment
      userWallet = WalletFactory({uid: user._id, currency: user.currency})
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
    const getBalanceOf = async (account) => {
      const { balance } = await MainBook.balance({
        account,
        currency: this.currency
      })

      return balance
    }

    const assets = await getBalanceOf("Assets") 
    const liabilities = await getBalanceOf("Liabilities") 
    const lightning = await getBalanceOf("Assets:Reserve:Lightning") 
    const expenses = await getBalanceOf("Expenses") 

    // FIXME: have a way to generate a PNL
    const equity = - expenses

    return {assets, liabilities, lightning, expenses, equity}
  }

  async balanceSheetIsBalanced() {
    await this.updateUsersPendingPayment()
    const {assets, liabilities, lightning, expenses} = await this.getBalanceSheet()
    const { total } = await this.lndBalances()

    const assetsLiabilitiesDifference = assets + liabilities + expenses
    const lndBalanceSheetDifference = total - lightning
    if(!!lndBalanceSheetDifference) {
      logger.debug({total, lightning, lndBalanceSheetDifference, assets, liabilities, expenses}, `not balanced`)
    }

    return { assetsLiabilitiesDifference, lndBalanceSheetDifference }
  }

  async lndBalances () {
    const { chain_balance } = await lnService.getChainBalance({lnd: this.lnd})
    const { channel_balance } = await lnService.getChannelBalance({lnd: this.lnd})

    //FIXME: This can cause incorrect balance to be reported in case an unconfirmed txn is later cancelled/double spent
    const { pending_chain_balance } = await lnService.getPendingChainBalance({lnd: this.lnd})

    const total = chain_balance + channel_balance + pending_chain_balance

    return { total, onChain: chain_balance , offChain: channel_balance } 
  }

  async getInfo() {
    return await lnService.getWalletInfo({ lnd: this.lnd });
  }

  async openChannel({local_tokens, public_key, socket}): Promise<string> {
    const {transaction_id} = await lnService.openChannel({ lnd: this.lnd, local_tokens,
      partner_public_key: public_key, partner_socket: socket
    })

    // FIXME: O(n), not great
    const { transactions } = await lnService.getChainTransactions({lnd: this.lnd})

    const { fee } = find(transactions, {id: transaction_id})

    const metadata = { currency: this.currency, txid: transaction_id, type: "fee" }

    await MainBook.entry("on chain fee")
      .debit('Assets:Reserve:Lightning', fee, {...metadata,})
      .credit('Expenses:Bitcoin:Fees', fee, {...metadata})
      .commit()

    return transaction_id
  }

  async updateEscrows() {
    const type = "escrow"

    const metadata = { type, currency: this.currency }

    const { channels } = await lnService.getChannels({lnd: this.lnd})
    const selfInitated = filter(channels, {is_partner_initiated: false, is_active: true})

    const mongotxs = await Transaction.aggregate([
      { $match: { type: "escrow", accounts: "Assets:Reserve:Lightning" }}, 
      { $group: {_id: "$txid", total: { "$sum": "$debit" } }},
    ])

    // TODO remove the inactive channel from escrow (??)

    for (const channel of selfInitated) {

      const txid = `${channel.transaction_id}:${channel.transaction_vout}`
      
      const mongotx = filter(mongotxs, {_id: txid})[0] ?? { total: 0 }

      if (mongotx?.total === channel.commit_transaction_fee) {
        continue
      }

      //log can be located by searching for 'update escrow' in gke logs
      //FIXME: Remove once escrow bug is fixed
      const diff = channel.commit_transaction_fee - (mongotx?.total)
      logger.debug({channel, diff}, `in update escrow, mongotx ${mongotx}`)

      await MainBook.entry("escrow")
        .debit('Assets:Reserve:Lightning', diff, {...metadata, txid})
        .credit('Assets:Reserve:Escrow', diff, {...metadata, txid})
        .commit()
    }

  }
}
