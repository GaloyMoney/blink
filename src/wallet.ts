import moment from "moment";
import { customerPath } from "./ledger";
import { MainBook, User } from "./mongodb";
import { ITransaction } from "./types";
import { LoggedError } from "./utils";

const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

export abstract class UserWallet {

  static lastPrice: number
  user: any // mongoose object
  readonly logger: any

  constructor({ user, logger }) {
    this.user = user
    this.logger = logger
  }

  // async refreshUser() {
  //   this.user = await User.findOne({ _id: this.uid })
  // }

  // TODO: upgrade price automatically with a timer
  static setCurrentPrice(price) {
    UserWallet.lastPrice = price
  }

  abstract get accountPath(): string

  get accountPathMedici(): Array<string> {
    return this.accountPath.split(":")
  }

  get uid(): string {
    return this.user._id
  }

  // this needs to be here to be able to call / chain updatePending()
  // otherwise super.updatePending() would result in an error
  // there may be better way to architecture this?
  async updatePending() { return }

  async getBalances() {
    await this.updatePending()

    const balances = {
      "BTC": 0,
      "USD": 0
    }

    // TODO: make this code parrallel instead of serial
    for (const { id } of this.user.currencies) {
      const { balance } = await MainBook.balance({
        account: this.accountPath,
        currency: id,
      })

      // FIXME: is it the right place to have the - sign?
      assert(balance <= 0)
      balances[id] = - balance
    }

    // console.log({balances})

    const priceMap = [
      {
        id: "BTC",
        BTC: 1,
        USD: 1/UserWallet.lastPrice, // TODO: check this should not be price
      },
      {
        id: "USD",
        BTC: UserWallet.lastPrice,
        USD: 1
      }
    ]

    // TODO: check forEach return
    // TODO: add pct
    let total = priceMap.map(({id, BTC, USD}) => ({
      id,
      value: BTC * balances["BTC"] + USD * balances["USD"]
    }))

    balances["total_in_BTC"] = total.filter(item => item.id === "BTC")[0].value
    balances["total_in_USD"] = total.filter(item => item.id === "USD")[0].value

    return balances
  }

  async getRawTransactions() {
    const { results } = await MainBook.ledger({
      // TODO: manage currencies

      // currency: this.currency,
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
    return !!(await User.findByUsername({ username}))
  }

  async setUsername({ username }): Promise<boolean | Error> {

    const result = await User.findOneAndUpdate({ _id: this.uid, username: null }, { username })

    if (!result) {
      const error = `Username is already set`
      this.logger.error({result}, error)
      throw new LoggedError(error)
    }

    return true
  }

  async setLanguage({ language }): Promise<boolean | Error> {

    const result = await User.findOneAndUpdate({ _id: this.uid, }, { language })

    if (!result) {
      const error = `issue setting language preferences`
      this.logger.error({result}, error)
      throw new LoggedError(error)
    }

    return true
  }

  static getCurrencyEquivalent({ sats, fee, usd }: { sats: number, fee?: number, usd?: number }) {
    return {
      fee, 
      feeUsd: fee ? UserWallet.satsToUsd(fee): undefined,
      sats,
      usd: usd ?? UserWallet.satsToUsd(sats)
    }
  }
  
  static satsToUsd = sats => {
    const usdValue = UserWallet.lastPrice * sats
    return usdValue
  }
}
