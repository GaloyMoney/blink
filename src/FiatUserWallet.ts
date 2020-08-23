import { MainBook } from "./mongodb"
import { UserWallet } from "./wallet"


export class FiatUserWallet extends UserWallet {
  protected _currency = "USD"

  constructor({uid}) {
    super({uid})
  }

  async getTransactions() {
    // TODO paging
      const {results} = await MainBook.ledger({
          account: this.accountPath,
          currency: this._currency,
      })

      return results.map((value) => ({
        amount: value.debit === 0 ? - value.credit : value.debit, // FIXME
        memo: value.memo,
        datetime: value.datetime,
        currency: value.currency,
    }))
  }

  async getInfo() {
    return {status: "ok"}
  }
}
