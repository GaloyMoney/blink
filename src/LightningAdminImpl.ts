import { book } from "medici";
import { LightningMixin } from "./Lightning";
import { LightningUserWallet } from "./LightningUserWallet";
import { getAuth } from "./utils";
import { AdminWallet } from "./wallet";
import { find, filter } from "lodash";
const lnService = require('ln-service')
const mongoose = require("mongoose");
const BitcoindClient = require('bitcoin-core')
const util = require('util')

export class LightningAdminWallet extends LightningMixin(AdminWallet) {
  constructor({uid}: {uid: string}) {
    super({uid})
  }

  async updateUsersPendingPayment() {
    const User = mongoose.model("User")
    let userWallet

    for await (const user of User.find({}, { _id: 1})) {
      console.log(user)
      // TODO there is no reason to fetch the Auth wallet here.
      // Admin should have it's own auth that it's passing to LightningUserWallet

      // A better approach would be to just loop over pending: true invoice/payment
      userWallet = new LightningUserWallet({uid: user._id})
      await userWallet.updatePending()
    }
  }

  async getBalanceSheet() {
    const MainBook =  new book("MainBook")
    const accounts = await MainBook.listAccounts()
    
    // used for debugging
    for (const account of accounts) {
      const { balance } = await MainBook.balance({
        account: account,
        currency: this.currency
      })
      console.log(account + ": " + balance)
    }

    const getBalanceOf = async (account) => {
      return (await MainBook.balance({
        account,
        currency: this.currency
      })).balance
    }

    const assets = await getBalanceOf("Assets") 
    const liabilities = await getBalanceOf("Liabilities") 
    const lightning = await getBalanceOf("Assets:Reserve:Lightning") 
    const expenses = await getBalanceOf("Expenses") 
    const customers = await getBalanceOf("Liabilities:Customer") 

    // FIXME: have a way to generate a PNL
    const equity = await getBalanceOf("Liabilities:ShareholderValue") - expenses

    return {assets, liabilities, lightning, expenses, customers, equity}
  }

  async balanceSheetIsBalanced() {
    const {assets, liabilities, lightning, expenses} = await this.getBalanceSheet()
    const lndBalance = await this.totalLndBalance()

    const assetsEqualLiabilities = assets === - liabilities - expenses
    const lndBalanceSheetAreSynced = lightning === lndBalance

    console.log({assets, liabilities, lightning, lndBalance, expenses})
    return { assetsEqualLiabilities, lndBalanceSheetAreSynced }
  }

  async totalLndBalance () {
    const auth = getAuth() // FIXME
    const lnd = lnService.authenticatedLndGrpc(auth).lnd // FIXME

    const chainBalance = (await lnService.getChainBalance({lnd})).chain_balance
    const balanceInChannels = (await lnService.getChannelBalance({lnd})).channel_balance;

    return chainBalance + balanceInChannels
  }

  async getInfo() {
    return await lnService.getWalletInfo({ lnd: this.lnd });
  }

  async openChannel({local_tokens, other_public_key, other_socket}) {
    const auth = getAuth() // FIXME
    const lnd = lnService.authenticatedLndGrpc(auth).lnd // FIXME

    const {transaction_id} = await lnService.openChannel({ lnd, local_tokens,
      partner_public_key: other_public_key, partner_socket: other_socket
    })

    // FIXME: O(n), not great
    const { transactions } = await lnService.getChainTransactions({lnd})

    const fee = find(transactions, {id: transaction_id}).fee

    const MainBook = new book("MainBook")

    const metadata = { currency: this.currency, txid: transaction_id }

    await MainBook.entry("on chain fees")
    .debit('Assets:Reserve:Lightning', fee, {...metadata, type: "fee"})
    .credit('Expenses:Bitcoin:Fees', fee, {...metadata, type: "fee"})
    .commit()
  }

  async updateEscrows() {
    const auth = getAuth() // FIXME
    const lnd = lnService.authenticatedLndGrpc(auth).lnd // FIXME

    const Transaction = await mongoose.model("Medici_Transaction")
    const MainBook = new book("MainBook")

    const metadata = { currency: this.currency, type: "escrow" }

    const { channels } = await lnService.getChannels({lnd})
    const selfInitated = filter(channels, {is_partner_initiated: true, is_active: true})
    // TODO remove the inactive channel from escrow

    for (const channel of selfInitated) {

      const txid = `${channel.transaction_id}:${channel.transaction_vout}`
      
      // TODO
      // const mongotx = Transaction.findOne({ type: "escrow", txid })
      // if mongotx.debit === channel.commit_transaction_fee,
      // continue
      // else
      // void
      // + 
      await MainBook.entry("escrow")
      .debit('Assets:Reserve:Lightning', channel.commit_transaction_fee, {...metadata, txid})
      .credit('Assets:Reserve:Escrow', channel.commit_transaction_fee, {...metadata, txid})
      .commit()

    }

  }
}
