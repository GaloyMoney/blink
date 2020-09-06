import { MainBook, User } from "./mongodb"

export class UserWallet {

  // FIXME should not be here
  customerPath(uid) { 
    return `Liabilities:Customer:${uid}`
  }

  readonly uid: string
  readonly currency: string

  constructor({uid, currency}) {
    this.uid = uid
    this.currency = currency
  }

  get accountPath(): string {
    return this.customerPath(this.uid)
  }

  get accountPathMedici(): Array<string> {
    return this.accountPath.split(":")
  }

  async getBalance() {

    const { balance } = await MainBook.balance({
      account: this.accountPath,
      currency: this.currency, 
    })

    return - balance
  }

  async setLevel({ level }) {
    // FIXME this should be in User and not tight to Lightning // use Mixins instead
    return await User.findOneAndUpdate({ _id: this.uid }, { level }, { new: true, upsert: true })
  }
}