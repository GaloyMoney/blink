import { IFiatWallet, Wallet } from "./interface"
import { createMainBook } from "./db"

export class FiatWallet extends Wallet implements IFiatWallet {
  protected _mainBook

  constructor({uid}) {
    super({uid})
  }

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

  getCurrency() { return "USD" }

  async getBalance() {
      const { balance } = await (await this.getMainBook()).balance({
          account: this.customerPath,
          currency: "USD"
      })

      return - balance // TODO verify the - sign
  }

  async addFunds({amount}) {
      if (amount < 0) {
          throw Error(`amount has to be positive, is: ${amount}`)
      }

      await (await this.getMainBook()).entry('Add funds')
      .credit('Assets:Reserve', amount, {currency: "USD"})
      .debit(this.customerPath, amount, {currency: "USD"})
      .commit()
  }

  async widthdrawFunds({amount}) {
    if (amount < 0) {
        throw Error(`amount has to be positive, is: ${amount}`)
    }

    return (await this.getMainBook()).entry('Withdraw funds')
    .debit('Assets:Reserve', amount, {currency: "USD"})
    .credit(this.customerPath, amount, {currency: "USD"})
    .commit()
  }

  async getTransactions() {
      // TODO paging
        const {results} = await (await this.getMainBook()).ledger({
            account: this.customerPath,
            currency: "USD" // TODO check if currency works here
        })

        return results.map((value) => ({
            amount: value.debit === 0 ? - value.credit : value.debit,
            memo: value.memo,
            datetime: value.datetime,
            currency: value.currency,
    }))
  }

  async getInfo() {
      return {status: "ok"}
  }
}
