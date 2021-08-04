import assert from "assert"
import moment from "moment"

import { User } from "@services/mongoose/schema"
import { ledger } from "@services/mongodb"

import { DbError } from "./error"
import { Balances } from "./interface"
import { CSVAccountExport } from "./csv-account-export"
import { sendNotification } from "./notifications/notification"
import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"

export abstract class UserWallet {
  static lastPrice: number

  // FIXME typing : https://thecodebarbarian.com/working-with-mongoose-in-typescript.html
  user: typeof User // mongoose object
  readonly logger: Logger

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

  // this needs to be here to be able to call / chain updatePending()
  // otherwise super.updatePending() would result in an error
  // there may be better way to architecture this?

  // we need to ignore typescript warning because even is lock is not used
  // an input needs to be set because updatePending is being overrided
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updatePending(lock) {
    return await Promise.resolve()
  }

  async getBalances(lock?): Promise<Balances> {
    await this.updatePending(lock)

    // TODO: add effective ratio
    const balances = {
      BTC: 0,
      USD: 0,
      total_in_BTC: NaN,
      total_in_USD: NaN,
    }

    // TODO: run this code in parrallel
    for (const { id } of this.user.currencies) {
      const balance = await ledger.getAccountBalance(this.user.accountPath, {
        currency: id,
      })

      // the dealer is the only one that is allowed to be short USD
      if (this.user.role === "dealer" && id === "USD") {
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
        USD: 1,
      },
    ]

    // this array is used to know the total in USD and BTC
    // the effective ratio may not be equal to the user ratio
    // as a result of price fluctuation
    const total = priceMap.map(({ id, BTC, USD }) => ({
      id,
      value: BTC * balances["BTC"] + USD * balances["USD"],
    }))

    balances.total_in_BTC = total.filter((item) => item.id === "BTC")[0].value
    balances.total_in_USD = total.filter((item) => item.id === "USD")[0].value

    return balances
  }

  async getRawTransactions() {
    const { results } = await ledger.getAccountTransactions(this.user.accountPath)
    return results
  }

  async getTransactions(): Promise<Array<ITransaction>> {
    const rawTransactions = await this.getRawTransactions()

    return rawTransactions.map((item) => {
      const amount = item.credit - item.debit
      const isCredit = amount > 0
      const isValidCreditMemo = isCredit && amount >= MEMO_SHARING_SATS_THRESHOLD
      const isDebit = !isCredit

      const memoUsername = item.username
        ? isCredit
          ? `from ${item.username}`
          : `to ${item.username}`
        : null

      const memoSpamFilter = (memoString) =>
        memoString ? (isDebit || isValidCreditMemo ? memoString : null) : null
      const memoPayer = memoSpamFilter(item.memoPayer)
      const memo = memoSpamFilter(item.memo)

      return {
        created_at: moment(item.timestamp).unix(),
        amount,
        sat: item.sat,
        usd: item.usd,
        description: memoPayer || memo || memoUsername || item.type, // TODO remove `|| item.type` once users have upgraded
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
  }

  async getStringCsv() {
    const csv = new CSVAccountExport()
    await csv.addAccount({ account: this.user.accountPath })
    return csv.getBase64()
  }

  // deprecated
  async setUsername({ username }): Promise<boolean | Error> {
    const result = await User.findOneAndUpdate(
      { _id: this.user.id, username: null },
      { username },
    )

    if (!result) {
      const error = `Username is already set`
      throw new DbError(error, {
        forwardToClient: true,
        logger: this.logger,
        level: "warn",
      })
    }

    return true
  }

  // deprecated
  async setLanguage({ language }): Promise<boolean> {
    const result = await User.findOneAndUpdate({ _id: this.user.id }, { language })

    if (!result) {
      const error = `issue setting language preferences`
      throw new DbError(error, {
        forwardToClient: false,
        logger: this.logger,
        level: "warn",
        result,
      })
    }

    return true
  }

  async updateUsername({
    username,
  }): Promise<{ username: string | undefined; id: string }> {
    try {
      const result = await User.findOneAndUpdate(
        { _id: this.user.id, username: null },
        { username },
      )
      if (!result) {
        throw new DbError(`Username is already set`, {
          forwardToClient: true,
          logger: this.logger,
          level: "warn",
        })
      }
      return { username, id: this.user.id }
    } catch (err) {
      this.logger.error({ err })
      throw new DbError("error updating username", {
        forwardToClient: false,
        logger: this.logger,
        level: "error",
        err,
      })
    }
  }

  async updateLanguage({
    language,
  }): Promise<{ language: string | undefined; id: string }> {
    try {
      await User.findOneAndUpdate({ _id: this.user.id }, { language })
      return { language, id: this.user.id }
    } catch (err) {
      this.logger.error({ err }, "error updating language")
      return { language: undefined, id: this.user.id }
    }
  }

  static getCurrencyEquivalent({
    sats,
    fee,
    usd,
  }: {
    sats: number
    fee?: number
    usd?: number
  }) {
    return {
      fee,
      feeUsd: fee ? UserWallet.satsToUsd(fee) : undefined,
      sats,
      usd: usd ?? UserWallet.satsToUsd(sats),
    }
  }

  static satsToUsd = (sats) => {
    const usdValue = UserWallet.lastPrice * sats
    return usdValue
  }

  sendBalance = async (): Promise<void> => {
    const { BTC: balanceSats } = await this.getBalances()

    // Add commas to balancesats
    const balanceSatsPrettified = balanceSats.toLocaleString("en")
    // Round balanceusd to 2 decimal places and add commas
    const balanceUsd = UserWallet.satsToUsd(balanceSats).toLocaleString("en", {
      maximumFractionDigits: 2,
    })

    this.logger.info(
      { balanceSatsPrettified, balanceUsd, user: this.user },
      `sending balance notification to user`,
    )
    await sendNotification({
      user: this.user,
      title: `Your balance is $${balanceUsd} (${balanceSatsPrettified} sats)`,
      logger: this.logger,
    })
  }
}
