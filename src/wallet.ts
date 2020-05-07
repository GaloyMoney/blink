import { createMainBook } from "./db"

const customerPath = (uid) => `Liabilities:Customer:${uid}`

export class Wallet {
  protected _currency

  get accountPath(): string {
    throw new Error("AbstractMethod not implemented");
  }

  get currency() { return this._currency }

  async getBalance() {

    const MainBook = await createMainBook()

    const { balance } = await MainBook.balance({
        account: this.accountPath,
        currency: this.currency
    })

    return - balance
  }

}

export class UserWallet extends Wallet {
  protected readonly uid: string

  constructor({uid}) {
    super()
    this.uid = uid
  }

  get accountPath(): string {
    return customerPath(this.uid)
  }

  get accountPathMedici(): Array<string> {
    return this.accountPath.split(":")
  }

}

export class AdminWallet extends Wallet {

  async addFunds({amount, uid, memo, type}: {amount: number, uid: string, memo?: string, type?: string}) {
    if (amount < 0) {
        throw Error(`amount has to be positive, is: ${amount}`)
    }

    const MainBook = await createMainBook()

    await MainBook.entry(memo ?? 'Add funds')
    .credit('Assets:Reserve', amount, {currency: this.currency, type})
    .debit(customerPath(uid), amount, {currency: this.currency, type})
    .commit()
}

  async widthdrawFunds({amount, uid, memo, type}) {
    if (amount < 0) {
        throw Error(`amount has to be positive, is: ${amount}`)
    }

    const MainBook = await createMainBook()

    return MainBook.entry(memo ?? 'Withdraw funds')
    .debit('Assets:Reserve', amount, {currency: this.currency, type})
    .credit(customerPath(uid), amount, {currency: this.currency, type})
    .commit()
  }
}
