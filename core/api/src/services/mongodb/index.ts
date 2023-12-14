import mongoose from "mongoose"

import { baseLogger } from "../logger"

import { Account } from "../mongoose/schema"

import {
  MONGODB_CON,
  MissingBankOwnerAccountConfigError,
  MissingBtcDealerWalletConfigError,
  MissingDealerAccountConfigError,
  MissingFunderAccountConfigError,
  MissingUsdDealerWalletConfigError,
  UnknownConfigError,
} from "@/config"
import { WalletCurrency } from "@/domain/shared"
import { lazyLoadLedgerAdmin } from "@/services/ledger"
import { WalletsRepository } from "@/services/mongoose"

export const ledgerAdmin = lazyLoadLedgerAdmin({
  bankOwnerWalletResolver: async () => {
    const result = await Account.findOne({ role: "bankowner" }, { defaultWalletId: 1 })
    if (!result) throw new MissingBankOwnerAccountConfigError()
    return result.defaultWalletId
  },
  dealerBtcWalletResolver: async () => {
    const account: AccountRecord | null = await Account.findOne(
      { role: "dealer" },
      { id: 1 },
    )
    if (!account) throw new MissingDealerAccountConfigError()
    const wallets = await WalletsRepository().listByAccountId(account.id as AccountId)
    if (wallets instanceof Error) {
      baseLogger.error({ err: wallets }, "Error while listing wallets for dealer")
      throw new UnknownConfigError("Couldn't load btc dealer wallets")
    }
    const wallet = wallets.find((wallet) => wallet.currency === WalletCurrency.Btc)
    if (wallet === undefined) throw new MissingBtcDealerWalletConfigError()
    return wallet.id
  },
  dealerUsdWalletResolver: async () => {
    const account: AccountRecord | null = await Account.findOne(
      { role: "dealer" },
      { id: 1 },
    )
    if (!account) throw new MissingDealerAccountConfigError()
    const wallets = await WalletsRepository().listByAccountId(account.id as AccountId)
    if (wallets instanceof Error) {
      baseLogger.error({ err: wallets }, "Error while listing wallets for dealer")
      throw new UnknownConfigError("Couldn't load usd dealer wallets")
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

export const setupMongoConnection = async (syncIndexes = false) => {
  try {
    await mongoose.connect(MONGODB_CON, { autoIndex: false })
  } catch (err) {
    baseLogger.fatal(`error connecting to mongodb`)
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
    baseLogger.fatal(`error setting the indexes`)
    throw err
  }

  return mongoose
}
