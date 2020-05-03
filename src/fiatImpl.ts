import { IFiatWallet } from "./interface"
import { Wallet } from "./wallet"

export class FiatWallet extends Wallet implements IFiatWallet {
  protected _currency = "USD"

  constructor({uid}) {
    super({uid})
  }

  async addFunds({amount}) {
      if (amount < 0) {
          throw Error(`amount has to be positive, is: ${amount}`)
      }

      const MainBook = await this.getMainBook()

      await MainBook.entry('Add funds')
      .credit('Assets:Reserve', amount, {currency: this.currency})
      .debit(this.customerPath, amount, {currency: this.currency})
      .commit()
  }

  async widthdrawFunds({amount}) {
    if (amount < 0) {
        throw Error(`amount has to be positive, is: ${amount}`)
    }

    const MainBook = await this.getMainBook()

    return MainBook.entry('Withdraw funds')
    .debit('Assets:Reserve', amount, {currency: this.currency})
    .credit(this.customerPath, amount, {currency: this.currency})
    .commit()
  }

  async getTransactions() {
    const MainBook = await this.getMainBook()

      // TODO paging
        const {results} = await MainBook.ledger({
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
