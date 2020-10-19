import moment from "moment"
import { MainBook, User } from "./mongodb"
import { ILightningTransaction } from "./types"

export abstract class UserWallet {

  readonly uid: string
  readonly currency: string
  readonly logger: any

  constructor({ uid, currency, logger }) {
    this.uid = uid
    this.currency = currency
    this.logger = logger
  }

  abstract get accountPath(): string

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
    return await User.findOneAndUpdate({ _id: this.uid }, { level }, { new: true, upsert: true })
  }

  async setUsername({ username }) {
    return await User.findOneAndUpdate({ _id: this.uid }, { username }, { new: true })
  }
}
