import mongoose from "mongoose"

import {
  MissingBankOwnerAccountConfigError,
  MissingBtcDealerWalletConfigError,
  MissingDealerAccountConfigError,
  MissingFunderAccountConfigError,
  MissingUsdDealerWalletConfigError,
  UnknownConfigError,
  mongodbCredentials,
} from "@config"
import { WalletCurrency } from "@domain/shared"
import { lazyLoadLedgerAdmin } from "@services/ledger"
import { WalletsRepository } from "@services/mongoose"
import { fromObjectId } from "@services/mongoose/utils"

import { baseLogger } from "../logger"
import { Account } from "../mongoose/schema"

export const ledgerAdmin = lazyLoadLedgerAdmin({
  bankOwnerWalletResolver: async () => {
    const result = await Account.findOne({ role: "bankowner" }, { defaultWalletId: 1 })
    if (!result) throw new MissingBankOwnerAccountConfigError()
    return result.defaultWalletId
  },
  dealerBtcWalletResolver: async () => {
    const user: AccountRecord | null = await Account.findOne(
      { role: "dealer" },
      { id: 1 },
    )
    if (!user) throw new MissingDealerAccountConfigError()
    // FIXME remove the use of AccountRecord when role if part of the AccountRepository
    const accountId = fromObjectId<AccountId>(user._id)
    const wallets = await WalletsRepository().listByAccountId(accountId)
    if (wallets instanceof Error) {
      baseLogger.error({ err: wallets }, "Error while listing wallets for dealer")
      throw new UnknownConfigError("Couldn't load dealer wallets")
    }
    const wallet = wallets.find((wallet) => wallet.currency === WalletCurrency.Btc)
    if (wallet === undefined) throw new MissingBtcDealerWalletConfigError()
    return wallet.id
  },
  dealerUsdWalletResolver: async () => {
    const user: AccountRecord | null = await Account.findOne(
      { role: "dealer" },
      { id: 1 },
    )
    if (!user) throw new MissingDealerAccountConfigError()
    // FIXME remove the use of AccountRecord when role if part of the AccountRepository
    const accountId = fromObjectId<AccountId>(user._id)
    const wallets = await WalletsRepository().listByAccountId(accountId)
    if (wallets instanceof Error) {
      baseLogger.error({ err: wallets }, "Error while listing wallets for dealer")
      throw new UnknownConfigError("Couldn't load dealer wallets")
    }
    const wallet = wallets.find((wallet) => wallet.currency === WalletCurrency.Usd)
    if (wallet === undefined) throw new MissingUsdDealerWalletConfigError()
    return wallet.id
  },
  funderWalletResolver: async () => {
    const result = await Account.findOne({ role: "funder" }, { defaultWalletId: 1 })
    if (!result) throw new MissingFunderAccountConfigError()
    return result.defaultWalletId
  },
})

// TODO add an event listenever if we got disconnecter from MongoDb
// after a first successful connection

const mgCred = mongodbCredentials()

let path: string
if (mgCred.user && mgCred.password) {
  path = `mongodb://${mgCred.user}:${mgCred.password}@${mgCred.address}/${mgCred.db}`
} else {
  path = `mongodb://${mgCred.address}/${mgCred.db}`
}

export const setupMongoConnection = async (syncIndexes = false) => {
  try {
    await mongoose.connect(path, { autoIndex: false })
  } catch (err) {
    baseLogger.fatal(
      { err, user: mgCred.user, address: mgCred.address, db: mgCred.db },
      `error connecting to mongodb`,
    )
    throw err
  }

  try {
    mongoose.set("runValidators", true)
    if (syncIndexes) {
      for (const model in mongoose.models) {
        baseLogger.info({ model }, "Syncing indexes")
        await mongoose.models[model].syncIndexes()
      }
    }
  } catch (err) {
    baseLogger.fatal(
      { err, user: mgCred.user, address: mgCred.address, db: mgCred.db },
      `error setting the indexes`,
    )
    throw err
  }

  return mongoose
}
