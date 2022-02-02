import * as Wallets from "@app/wallets"
import { getGaloyInstanceName } from "@config"
import { LedgerService } from "@services/ledger"
import { User } from "@services/mongoose/schema"
import { generateSecret, verifyToken } from "node-2fa"

import { CsvWalletsExport } from "../services/ledger/csv-wallet-export"

import { DbError, TwoFAError } from "./error"
import { Balances } from "./interface"

export class UserWallet {
  static lastPrice: number

  // FIXME typing : https://thecodebarbarian.com/working-with-mongoose-in-typescript.html
  user: UserRecord // mongoose object
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
    // was the await omit on purpose?
    await Wallets.updatePendingInvoicesByWalletId({
      walletId: this.user.defaultWalletId as WalletId,
      lock,
      logger: this.logger,
    })
    const result = await Wallets.updatePendingPaymentsByWalletId({
      walletId: this.user.defaultWalletId as WalletId,
      lock,
      logger: this.logger,
    })
    if (result instanceof Error) throw result

    // TODO: add effective ratio
    const balances = {
      BTC: 0,
      USD: 0,
      total_in_BTC: NaN,
      total_in_USD: NaN,
    }

    const balance = await LedgerService().getWalletBalance(this.user.defaultWalletId)
    if (balance instanceof Error) throw balance
    balances["BTC"] = balance

    // This code to be deleted after v1 deletion. keeping it as reference for now

    // // the dealer is the only one that is allowed to be short USD
    // if (this.user.role === "dealer" && id === "USD") {
    //   assert(balance <= 0)
    // } else {
    //   assert(balance >= 0)
    // }
    // }

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
    const csv = new CsvWalletsExport()
    await csv.addWallet(this.user.defaultWalletId)
    return csv.getBase64()
  }

  // TODO(remove) deprecated
  async setUsername({ username }): Promise<{ username: string | undefined; id: string }> {
    try {
      const result = await User.findOneAndUpdate(
        { _id: this.user._id, username: { $in: [null, ""] } },
        { username },
      )

      if (!result) {
        throw new DbError(`Username is already set`, {
          forwardToClient: true,
          logger: this.logger,
          level: "warn",
        })
      }
      return { username, id: String(this.user._id) }
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
      feeUsd: fee ? UserWallet.satsToCents(fee) : undefined,
      sats,
      usd: usd ?? UserWallet.satsToCents(sats),
    }
  }

  static satsToCents = (sats) => {
    const usdValue = UserWallet.lastPrice * sats
    return usdValue
  }

  // deprecated
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
}
