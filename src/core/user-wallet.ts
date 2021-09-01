import assert from "assert"

import { User } from "@services/mongoose/schema"
import { ledger } from "@services/mongodb"

import { DbError, TwoFAError } from "./error"
import { Balances } from "./interface"
import { CSVAccountExport } from "./csv-account-export"
import { getGaloyInstanceName } from "@config/app"
import { generateSecret, verifyToken } from "node-2fa"
import { sendNotification } from "@services/notifications/notification"
import * as Wallets from "@app/wallets"

export abstract class UserWallet {
  static lastPrice: number

  // FIXME typing : https://thecodebarbarian.com/working-with-mongoose-in-typescript.html
  user: UserType // mongoose object
  readonly logger: Logger
  readonly config: UserWalletConfig

  constructor({ user, logger, config }: UserWalletConstructorArgs) {
    this.user = user
    this.logger = logger
    this.config = config
  }

  // async refreshUser() {
  //   this.user = await User.findOne({ _id: this.user._id })
  // }

  // TODO: upgrade price automatically with a timer
  static setCurrentPrice(price) {
    UserWallet.lastPrice = price
  }

  async getBalances(lock?): Promise<Balances> {
    Wallets.updatePendingInvoices({
      walletId: this.user.id as WalletId,
      lock,
      logger: this.logger,
    })
    this.updatePendingPayments(lock)

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

  generate2fa = () => {
    const { secret, uri } = generateSecret({
      name: getGaloyInstanceName(),
      account: this.user.phone,
    })
    /*
    { secret: 'XDQXYCP5AC6FA32FQXDGJSPBIDYNKK5W',
      uri: 'otpauth://totp/My%20Awesome%20App:johndoe?secret=XDQXYCP5AC6FA32FQXDGJSPBIDYNKK5W&issuer=My%20Awesome%20App',
      qr: 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=otpauth://totp/My%20Awesome%20App:johndoe%3Fsecret=XDQXYCP5AC6FA32FQXDGJSPBIDYNKK5W%26issuer=My%20Awesome%20App'
    }
    */
    return { secret, uri }
  }

  save2fa = async ({ secret, token }): Promise<boolean> => {
    if (this.user.twoFA.secret) {
      throw new TwoFAError("2FA is already set", { logger: this.logger })
    }

    const tokenIsValid = verifyToken(secret, token)

    if (!tokenIsValid) {
      throw new TwoFAError(undefined, { logger: this.logger })
    }

    this.user.twoFA.secret = secret

    try {
      await this.user.save()
      return true
    } catch (err) {
      throw new DbError("Unable to save 2fa secret", {
        forwardToClient: true,
        logger: this.logger,
        level: "error",
        err,
      })
    }
  }

  delete2fa = async ({ token }): Promise<boolean> => {
    if (!this.user.twoFA.secret || !verifyToken(this.user.twoFA.secret, token)) {
      throw new TwoFAError(undefined, { logger: this.logger })
    }

    try {
      this.user.twoFA.secret = undefined
      await this.user.save()
      return true
    } catch (err) {
      throw new DbError("Unable to delete 2fa secret", {
        forwardToClient: true,
        logger: this.logger,
        level: "error",
        err,
      })
    }
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

  getUserLimits = async () => {
    const remainingLimits = await Promise.all([
      this.user.remainingTwoFALimit(),
      this.user.remainingOnUsLimit(),
      this.user.remainingWithdrawalLimit(),
    ])

    return {
      remainingTwoFALimit: remainingLimits[0],
      remainingOnUsLimit: remainingLimits[1],
      remainingWithdrawalLimit: remainingLimits[2],
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updatePendingPayments(lock) {
    return Promise.resolve()
  }
}
