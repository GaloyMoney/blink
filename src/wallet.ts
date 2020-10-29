import moment from "moment";
import { customerPath } from "./ledger";
import { MainBook, User } from "./mongodb";
import { ILightningTransaction } from "./types";
import { LoggedError } from "./utils"

const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

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

  async getStringCsv() {
    const { results: transactions } = await MainBook.ledger({
      account: customerPath(this.uid),
    })

    const csvWriter = createCsvStringifier({
      header: [
        { id: 'voided', title: 'voided' },
        { id: 'approved', title: 'approved' },
        { id: '_id', title: '_id' },
        { id: 'accounts', title: 'accounts' },
        { id: 'credit', title: 'credit' },
        { id: 'debit', title: 'debit' },
        { id: '_journal', title: '_journal' },
        { id: 'book', title: 'book' },
        { id: 'datetime', title: 'datetime' },
        { id: 'currency', title: 'currency' },
        { id: 'type', title: 'type' },
        { id: 'hash', title: 'hash' },
        { id: 'txid', title: 'txid' },
        { id: 'fee', title: 'fee' },
        { id: 'feeUsd', title: 'feeUsd' },
        { id: 'sats', title: 'sats' },
        { id: 'usd', title: 'usd' },
        { id: 'memo', title: 'memo' },
        { id: 'memoPayer', title: 'memoPayer' },
        { id: 'meta', title: 'meta' },
      ]
    })

    transactions.forEach(tx => tx.meta = JSON.stringify(tx.meta))

    const header = csvWriter.getHeaderString();
    const records = csvWriter.stringifyRecords(transactions)

    const str = header + records

    // create buffer from string
    const binaryData = Buffer.from(str, "utf8");

    // decode buffer as base64
    const base64Data = binaryData.toString("base64");

    return base64Data
  }

  async setLevel({ level }) {
    return await User.findOneAndUpdate({ _id: this.uid }, { level }, { new: true, upsert: true })
  }

  static async usernameExists({ username }): Promise<boolean> {
    return await User.exists({ username })
  }

  async setUsername({ username }): Promise<boolean | Error> {

    //FIXME: Should checkIfUsernameExists be called here? Or called directy by RN before calling setUsername?

    if (username.length < 3) {
      const error = `Username should be at least 3 characters long`
      this.logger.error(error)
      throw new LoggedError(error)
    }

    const result = await User.findOneAndUpdate({ _id: this.uid, username: null }, { username })

    if (!result) {
      const error = `Username is already set`
      this.logger.error(error)
      throw new LoggedError(error)
    }

    return !!result
  }
}
