import { IFiatWallet } from "./interface"
import { createMainBook } from "./db"

export class FiatWallet implements IFiatWallet {
  protected _mainBook
  protected uid: String

  get customerPath(): string {
      return `Liabilities:Customer:${this.uid}`
  }

  async getMainBook () {
    if (this._mainBook) {
        return this._mainBook
    }

    this._mainBook = await createMainBook()
    return this._mainBook
  }

  constructor(uid) {
      this.uid = uid
  }

  getCurrency() { return "USD" }

  async getBalance() {
      const { balance } = await (await this.getMainBook()).balance({
          account: this.customerPath,
          currency: "USD"
      })

      return - balance // TODO verify the - sign
  }

  async addFunds({amount}) {
      await (await this.getMainBook()).entry('Add funds')
      .credit('Assets:Reserve', amount, {currency: "USD"})
      .debit(this.customerPath, amount, {currency: "USD"})
      .commit()
  }

  async getTransactions() {
      return await (await this.getMainBook()).ledger({
          account: 'Liabilities:Customer:A',
          currency: "USD" // TODO check if currency works here
      })
  }

  async getInfo() {
      return {status: "ok"}
  }
}
