import { createMainBook } from "./db"

export class Wallet {
  protected readonly uid: string
  protected _mainBook
  protected _currency

  get currency() { return this._currency }

  constructor({uid}) {
    this.uid = uid
  }

  get customerPath(): string {
    return `Liabilities:Customer:${this.uid}`
  }

  async getBalance() {

    const MainBook = await this.getMainBook()

    const { balance } = await MainBook.balance({
        account: this.customerPath,
        currency: this.currency
    })

    return balance
}

  async getMainBook () {
    if (this._mainBook) {
        return this._mainBook
    }

    this._mainBook = await createMainBook()
    return this._mainBook
  }
}