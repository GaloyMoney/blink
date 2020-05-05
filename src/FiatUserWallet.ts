import { IFiatWallet } from "./interface"
import { UserWallet } from "./wallet"
import { createMainBook } from "./db"

export class FiatUserWallet extends UserWallet implements IFiatWallet {
  protected _currency = "USD"

  constructor({uid}) {
    super({uid})
  }

  async getTransactions() {
    const MainBook = await createMainBook()

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
