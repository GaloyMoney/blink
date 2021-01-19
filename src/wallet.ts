import moment from "moment";
import { CSVAccountExport } from "./csvAccountExport";
import { customerPath } from "./ledger";
import { MainBook, User, Transaction } from "./mongodb";
import { ITransaction } from "./types";
import { LoggedError } from "./utils";
import { sendNotification } from "./notification";

export abstract class UserWallet {

  readonly lastPrice: number
  readonly user: any // mongoose object
  readonly uid: string
  readonly currency: string
  readonly logger: any

  constructor({ lastPrice, user, uid, currency, logger }) {
    this.lastPrice = lastPrice
    this.user = user
    this.uid = uid
    this.currency = currency
    this.logger = logger
  }

  abstract get accountPath(): string

  get accountPathMedici(): Array<string> {
    return this.accountPath.split(":")
  }

  static async usernameExists({ username }): Promise<boolean> {
    return !!(await User.findByUsername({ username }))
  }

  // this needs to be here to be able to call / chain updatePending()
  // otherwise super.updatePending() would result in an error
  // there may be better way to architecture this?
  async updatePending() { return }

  async getBalance() {
    await this.updatePending()

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

  async getTransactions(): Promise<Array<ITransaction>> {
    const rawTransactions = await this.getRawTransactions()

    const results_processed = rawTransactions.map(item => {
      const amount = item.debit - item.credit
      const memoUsername =
        item.username ?
          amount > 0 ?
            `from ${item.username}` :
            `to ${item.username}` :
          null

      return {
        created_at: moment(item.timestamp).unix(),
        amount,
        sat: item.sat,
        usd: item.usd,
        description: item.memoPayer || item.memo || memoUsername || item.type, // TODO remove `|| item.type` once users have upgraded
        type: item.type,
        hash: item.hash,
        fee: item.fee,
        feeUsd: item.feeUsd,
        username: item.username,
        // destination: TODO
        pending: item.pending,
        id: item._id,
        currency: item.currency,
        addresses: item.payee_addresses,
      }
    })

    return results_processed
  }

  async getStringCsv() {
    const csv = new CSVAccountExport()
    await csv.addAccount({ account: customerPath(this.uid) })
    return csv.getBase64()
  }

  async setLevel({ level }) {
    return await User.findOneAndUpdate({ _id: this.uid }, { level }, { new: true, upsert: true })
  }

  async setUsername({ username }): Promise<boolean | Error> {

    const result = await User.findOneAndUpdate({ _id: this.uid, username: null }, { username })

    if (!result) {
      const error = `Username is already set`
      this.logger.error({ result }, error)
      throw new LoggedError(error)
    }

    return true
  }

  async setLanguage({ language }): Promise<boolean | Error> {

    const result = await User.findOneAndUpdate({ _id: this.uid, }, { language })

    if (!result) {
      const error = `issue setting language preferences`
      this.logger.error({ result }, error)
      throw new LoggedError(error)
    }

    return true
  }

  getCurrencyEquivalent({ sats, fee, usd }: { sats: number, fee: number, usd?: number }) {
    let _usd = usd
    let feeUsd

    if (!usd) {
      _usd = this.satsToUsd(sats)
    }

    // TODO: check if fee is always given in sats
    feeUsd = this.satsToUsd(fee)

    return { fee, feeUsd, sats, usd: _usd }
  }

  satsToUsd = sats => {
    const usdValue = this.lastPrice * sats
    return usdValue
  }

  isUserActive = async (): Promise<boolean> => {
    const timestamp30DaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))
    const [result] = await Transaction.aggregate([
      { $match: { "accounts": this.accountPath, "timestamp": { $gte: timestamp30DaysAgo } } },
      {
        $group: {
          _id: null, outgoingSats: { $sum: "$credit" }, incomingSats: { $sum: "$debit" }
        }
      }
    ])
    const { incomingSats, outgoingSats } = result || {}

    return (outgoingSats > 1000 || incomingSats > 1000)
  }

  sendBalance = async () => {
    const balanceSats = (await this.getBalance()).toLocaleString("en")
    const balanceUsd = this.satsToUsd(balanceSats).toLocaleString("en", { maximumFractionDigits: 2 })
    this.logger.info({ balanceSats, balanceUsd, uid: this.user._id }, `sending balance notification to user`)
    await sendNotification({ uid: this.user._id, title: `Your balance today is \$${balanceUsd} (${balanceSats} sats)`, logger: this.logger })
  }
}
