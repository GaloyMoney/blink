import { createMainBook, createUser } from "./db"
import { LightningWalletAuthed, getAuth } from "./LightningUserWallet"
import { AdminWallet } from "./wallet"
const lnService = require('ln-service')
const util = require('util')


export class LightningAdminWallet extends AdminWallet {
  // protected readonly lnd: object;
  protected _currency = "BTC"

  get accountPath(): string {
    return `Assets:Capital`
  }

  async updateUsersPendingPayment() {
    const User = await createUser()
    let userWallet

    for await (const user of User.find({}, { _id: 1})) {
      console.log(user)
      // TODO there is no reason to fetch the Auth wallet here.
      // Admin should have it's own auth that it's passing to LightningUserWallet

      // A better approach would be to just loop over pending: true invoice/payment
      userWallet = new LightningWalletAuthed({uid: user._id})
      await userWallet.updatePending()
    }
  }

  async breakdownBalance() {
    const companyBalance = await this.getBalance()

    const MainBook = await createMainBook()

    const { balance } = await MainBook.balance({
      account: "Liabilities:Customer",
      currency: this.currency
    })

    const userBalance = balance

    const auth = getAuth() // FIXME
    const lnd = lnService.authenticatedLndGrpc(auth).lnd // FIXME

    const chainBalance = (await lnService.getChainBalance({lnd})).chain_balance
    const balanceInChannels = (await lnService.getChannelBalance({lnd})).channel_balance;

    console.log({companyBalance, userBalance, chainBalance, balanceInChannels})
  }
}
