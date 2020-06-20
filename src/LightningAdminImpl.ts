import { book } from "medici";
import { LightningMixin } from "./Lightning";
import { LightningUserWallet } from "./LightningUserWallet";
import { getAuth } from "./utils";
import { AdminWallet } from "./wallet";
const lnService = require('ln-service')
const mongoose = require("mongoose");
const BitcoindClient = require('bitcoin-core')

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
    
    for (const account of accounts) {
      const { balance } = await MainBook.balance({
        account: "Assets",
        currency: this.currency
      })
      console.log(account + ": " + balance)
    }

    const assets = (await MainBook.balance({
      account: "Assets",
      currency: this.currency
    })).balance

    const liabilities = (await MainBook.balance({
      account: "Liabilities",
      currency: this.currency
    })).balance

    const lightning = (await MainBook.balance({
      account: "Assets:Reserve:Lightning",
      currency: this.currency
    })).balance

    return {assets, liabilities, lightning}
  }

  async balanceSheetIsBalanced() {
    const {assets, liabilities, lightning} = await this.getBalanceSheet()
    const lndBalance = await this.totalLndBalance()

    const assetsEqualLiabilities = assets === - liabilities
    const lndBalanceSheetAreSynced = lightning === lndBalance

    console.log({assets, liabilities, lightning, lndBalance})
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

    await lnService.addPeer({ lnd, public_key: other_public_key, socket: other_socket })

    const {transaction_id, transaction_vout} = await lnService.openChannel({ lnd, local_tokens,
      partner_public_key: other_public_key, partner_socket: other_socket
    })

    const connection_obj = { 
      // FIXME
      network: 'regtest', username: 'rpcuser', password: 'rpcpass',
      host: process.env.BITCOINDADDR, port: process.env.BITCOINDPORT
    } 

    console.log({transaction_id})

    const bitcoindClient = new BitcoindClient(connection_obj)

    const {once} = require('events');
    const sub = lnService.subscribeToChannels({lnd});
    const [openedChannel] = await once(sub, 'channel_opened');

    console.log({openedChannel})

    // const info = await bitcoindClient.getInfo()
    // const tx = await bitcoindClient.getTransactionByHash(transaction_id, { extension: 'json', summary: false })
    // console.log({info})
  }
}
