import moment from "moment"
import { MainBook, User } from "./mongodb"
import { ILightningTransaction } from "./types"

export const customerPath = (uid) => { 
  return `Liabilities:Customer:${uid}`
}

export class UserWallet {

  readonly uid: string
  readonly currency: string

  constructor({uid, currency}) {
    this.uid = uid
    this.currency = currency
  }

  get accountPath(): string {
    return customerPath(this.uid)
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

  async getRawTransactions() {
    const { results } = await MainBook.ledger({
      currency: this.currency,
      account: this.accountPath,
      // start_date: startDate,
      // end_date: endDate
    })

    return results
  }

  async getTransactions(): Promise<Array<ILightningTransaction>> {
    const rawTransactions = await this.getRawTransactions()

    const results_processed = rawTransactions.map(item => ({
      created_at: moment(item.timestamp).unix(),
      amount: item.debit - item.credit,
      sat: item.sat,
      usd: item.usd,
      description: item.memoPayer || item.memo || item.type, // TODO remove `|| item.type` once users have upgraded
      type: item.type,
      hash: item.hash,
      fee: item.fee,
      feeUsd: item.feeUsd,
      // destination: TODO
      pending: item.pending,
      id: item._id,
      currency: item.currency
    }))

    return results_processed
  }

  async setLevel({ level }) {
    // FIXME this should be in User and not tight to Lightning // use Mixins instead
    return await User.findOneAndUpdate({ _id: this.uid }, { level }, { new: true, upsert: true })
  }
}