import assert from 'assert';
import moment from "moment";
import { CSVAccountExport } from "./csvAccountExport";
import { Balances } from "./interface";
import { customerPath } from "./ledger/ledger";
import { MainBook } from "./mongodb";
import { sendNotification } from "./notifications/notification";
import { User } from "./schema";
import { ITransaction } from "./types";
import { caseInsensitiveRegex, LoggedError, inputXOR } from "./utils";

export abstract class UserWallet {

  static lastPrice: number

  // FIXME typing : https://thecodebarbarian.com/working-with-mongoose-in-typescript.html
  user: typeof User // mongoose object
  readonly logger: any

  constructor({ user, logger }) {
    this.user = user
    this.logger = logger
  }

  // async refreshUser() {
  //   this.user = await User.findOne({ _id: this.user._id })
  // }

  // TODO: upgrade price automatically with a timer
  static setCurrentPrice(price) {
    UserWallet.lastPrice = price
  }

  static async usernameExists({ username }): Promise<boolean> {
    return !!(await User.findByUsername({ username }))
  }

  // this needs to be here to be able to call / chain updatePending()
  // otherwise super.updatePending() would result in an error
  // there may be better way to architecture this?
  async updatePending(lock) { return }

  async getBalances(lock?): Promise<Balances> {
    await this.updatePending(lock)

    // TODO: add effective ratio
    const balances = {
      "BTC": 0,
      "USD": 0,
      total_in_BTC: NaN,
      total_in_USD: NaN,
    }

    // TODO: make this code parrallel instead of serial
    for(const { id } of this.user.currencies) {
      const { balance } = await MainBook.balance({
        account: this.user.accountPath,
        currency: id,
      })

      // the dealer is the only one that is allowed to be short USD
      if(this.user.role === "dealer" && id === "USD") {
        assert(balance <= 0)
      } else {
        assert(balance >= 0)
      }

      balances[id] = balance
    }

    const priceMap = [
      {
        id: "BTC",
        BTC: 1,
        USD: 1 / UserWallet.lastPrice, // TODO: check this should not be price
      },
      {
        id: "USD",
        BTC: UserWallet.lastPrice,
        USD: 1
      }
    ]

    // this array is used to know the total in USD and BTC
    // the effective ratio may not be equal to the user ratio 
    // as a result of price fluctuation
    let total = priceMap.map(({ id, BTC, USD }) => ({
      id,
      value: BTC * balances["BTC"] + USD * balances["USD"]
    }))

    balances.total_in_BTC = total.filter(item => item.id === "BTC")[0].value
    balances.total_in_USD = total.filter(item => item.id === "USD")[0].value

    return balances
  }

  async getRawTransactions() {
    const { results } = await MainBook.ledger({
      // TODO: manage currencies

      account: this.user.accountPath,
      // start_date: startDate,
      // end_date: endDate
    })

    return results
  }

  async getTransactions(): Promise<Array<ITransaction>> {
    const rawTransactions = await this.getRawTransactions()

    const results_processed = rawTransactions.map(item => {
      const amount = item.credit - item.debit
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
    await csv.addAccount({ account: customerPath(this.user.id) })
    return csv.getBase64()
  }

  async setLevel({ level }) {
    this.user.level = level
    await this.user.save()
  }

  async setUsername({ username }): Promise<boolean | Error> {

    const result = await User.findOneAndUpdate({ _id: this.user.id, username: null }, { username })

    if(!result) {
      const error = `Username is already set`
      this.logger.error({ result }, error)
      throw new LoggedError(error)
    }

    return true
  }

  async setLanguage({ language }): Promise<boolean | Error> {

    const result = await User.findOneAndUpdate({ _id: this.user.id, }, { language })

    if(!result) {
      const error = `issue setting language preferences`
      this.logger.error({ result }, error)
      throw new LoggedError(error)
    }

    return true
  }

  static getCurrencyEquivalent({ sats, fee, usd }: { sats: number, fee?: number, usd?: number }) {
    return {
      fee,
      feeUsd: fee ? UserWallet.satsToUsd(fee) : undefined,
      sats,
      usd: usd ?? UserWallet.satsToUsd(sats)
    }
  }

  static satsToUsd = sats => {
    const usdValue = UserWallet.lastPrice * sats
    return usdValue
  }

  sendBalance = async (): Promise<void> => {
    const { BTC: balanceSats } = await this.getBalances()

    // Add commas to balancesats
    const balanceSatsPrettified = balanceSats.toLocaleString("en")
    // Round balanceusd to 2 decimal places and add commas
    const balanceUsd = UserWallet.satsToUsd(balanceSats).toLocaleString("en", { maximumFractionDigits: 2 })

    this.logger.info({ balanceSatsPrettified, balanceUsd, user: this.user }, `sending balance notification to user`)
    await sendNotification({ user: this.user, title: `Your balance is \$${balanceUsd} (${balanceSatsPrettified} sats)`, logger: this.logger })
  }

  static async getUserDetails({ phone, username }): Promise<typeof User> {
    inputXOR({ phone }, { username })

    let user;

    if(phone) {
      user = await User.findOne(
        { phone },
        { phone: 1, level: 1, created_at: 1, username: 1, title: 1, coordinate: 1 }
      );
    } else if(this.usernameExists({ username })) {
      user = await User.findOne(
        { username: caseInsensitiveRegex(username) },
        { phone: 1, level: 1, created_at: 1, username: 1, title: 1, coordinate: 1, status: 1 }
      );
    }

    if(!user) {
      throw new LoggedError("User not found");
    }

    return user;
  }

  static async addToMap({ username, latitude, longitude, title, }): Promise<boolean> {
    if(!latitude || !longitude || !title) {
      throw new LoggedError(`missing input for ${username}: ${latitude}, ${longitude}, ${title}`);
    }

    const user = await User.findByUsername({ username });

    if(!user) {
      throw new LoggedError(`The user ${username} does not exist`);
    }

    user.coordinate = {
      latitude,
      longitude
    };

    user.title = title
    return !!(await user.save());
  }

  static async setAccountStatus({ username, phone, status }): Promise<boolean> {
    let user

    if(phone) {
      user = User.findOne({ phone })
    } else if(this.usernameExists({ username })) {
      user = await User.findOne({ username: caseInsensitiveRegex(username) });
    }

    if(!user) {
      throw new LoggedError("User not found");
    }

    user.status = status
    return !!await user.save()
  }

}
