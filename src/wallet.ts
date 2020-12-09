import moment from "moment";
import { customerPath } from "./ledger";
import { MainBook, User } from "./mongodb";
import { ITransaction } from "./types";
import { LoggedError, sleep } from "./utils"

const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

export const regExUsername = ({username}) => new RegExp(`^${username}$`, 'i')

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
            `from ${item.username}`:
            `to ${item.username}`:
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
    }})

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
        { id: 'username', title: 'username' },
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
    return await User.exists({ username: regExUsername({username}) })
  }

  async setUsername({ username }): Promise<boolean | Error> {

    const result = await User.findOneAndUpdate({ _id: this.uid, username: null }, { username })

    if (!result) {
      const error = `Username is already set`
      this.logger.error({result}, error)
      throw new LoggedError(error)
    }

    return !!result
  }

  async setLanguage({ language }): Promise<boolean | Error> {

    const result = await User.findOneAndUpdate({ _id: this.uid, }, { language })

    if (!result) {
      const error = `issue setting language preferences`
      this.logger.error({result}, error)
      throw new LoggedError(error)
    }

    return !!result
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
}
