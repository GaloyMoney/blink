import { MainBook } from "./mongodb"

export class Wallet {

  // FIXME should not be here
  customerPath(uid) { 
    return `Liabilities:Customer:${uid}`
  }

  readonly uid: string

  constructor({uid}) {
    this.uid = uid
  }

  get accountPath(): string {
    throw new Error("AbstractMethod not implemented");
  }

  async getBalance() {

    const { balance } = await MainBook.balance({
        account: this.accountPath,
    })

    return - balance
  }

}

export class UserWallet extends Wallet {

  get accountPath(): string {
    return this.customerPath(this.uid)
  }

  get accountPathMedici(): Array<string> {
    return this.accountPath.split(":")
  }
}
