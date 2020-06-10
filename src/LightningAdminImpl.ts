import { AdminWallet } from "./wallet"
const lnService = require('ln-service')
const util = require('util')
import { createUser } from "./db"
import { LightningWalletAuthed } from "./LightningUserWallet"


export class LightningAdminWallet extends AdminWallet {
  // protected readonly lnd: object;
  protected _currency = "BTC"

  get accountPath(): string {
    return `Assets:Reserve`
  }

  async updateUsersPendingPayment() {
    const User = await createUser()
    let userWallet

    for await (const user of User.find()) {
      // TODO there is no reason to fetch the Auth wallet here.
      // Admin should have it's own auth that it's passing to LightningUserWallet
      userWallet = new LightningWalletAuthed({uid: user._id})
      await userWallet.updatePending()
    }
  }
}
