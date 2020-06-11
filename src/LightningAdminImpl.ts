import { book } from "medici"
import { LightningUserWallet } from "./LightningUserWallet"
import { AdminWallet } from "./wallet"
import { getAuth } from "./utils";
import { LightningMixin } from "./Lightning";
const lnService = require('ln-service')
const mongoose = require("mongoose");


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

  async breakdownBalance() {
    const companyBalance = await this.getBalance()

    const MainBook =  new book("MainBook")

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

  async getInfo() {
    return await lnService.getWalletInfo({ lnd: this.lnd });
  }
}
