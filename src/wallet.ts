import { MainBook } from "./mongodb"

export class UserWallet {

  // FIXME should not be here
  customerPath(uid) { 
    return `Liabilities:Customer:${uid}`
  }

  readonly uid: string
  readonly currency: string

  constructor({uid, currency = "BTC"}) {
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
}