import { MainBook, User } from "./mongodb"

export const getBrokerAccountPath = async () => { 
  const uid = await User.findOne({role: "broker"}, {_id: 1})
  return customerPath(uid)
}

export const customerPath = (uid) => { 
  return `Liabilities:Customer:${uid}`
}

export class UserWallet {

  readonly uid: string
  readonly currency: string

  constructor({uid, currency}) {
    this.uid = uid
    this.currency = currency
  }

  get accountPath(): string {
    return customerPath(this.uid)
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