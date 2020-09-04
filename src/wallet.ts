import { book } from "medici"
import { MainBook } from "./mongodb"

export class Wallet {

  // FIXME should not be here
  customerPath(uid) { 
    return `Liabilities:Customer:${uid}`
  }

  protected readonly uid: string

  constructor({uid}) {
    this.uid = uid
  }

  protected _currency

  get accountPath(): string {
    throw new Error("AbstractMethod not implemented");
  }

  get currency() { return this._currency }

  async getBalance() {

    

    const { balance } = await MainBook.balance({
        account: this.accountPath,
        currency: this.currency
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

export class AdminWallet extends Wallet {

  get accountPath(): string {
    return `Liabilities:Shareholder`
  }

  // TODO refactor using pay function
  async addFunds({amount, uid, memo, type}: {amount: number, uid: string, memo?: string, type?: string}) {
    if (amount < 0) {
        throw Error(`amount has to be positive, is: ${amount}`)
    }

    

    await MainBook.entry(memo ?? 'Add funds')
    .credit(this.accountPath, amount, {currency: this.currency, type})
    .debit(this.customerPath(uid), amount, {currency: this.currency, type})
    .commit()
  }

  // TODO refactor using pay function
  async widthdrawFunds({amount, uid, memo, type}) {
    if (amount < 0) {
        throw Error(`amount has to be positive, is: ${amount}`)
    }

    return MainBook.entry(memo ?? 'Withdraw funds')
    .debit(this.accountPath, amount, {currency: this.currency, type})
    .credit(this.customerPath(uid), amount, {currency: this.currency, type})
    .commit()
  }
}
