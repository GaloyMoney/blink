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

type SetupMongoConnectionArgs = {
  syncIndexes: boolean
  options?: mongoose.ConnectOptions
}

const DEFAULT_MONGODB_OPTIONS = {
  autoIndex: false,
  maxPoolSize: 50,
  minPoolSize: 10,
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  connectTimeoutMS: 20000, // Give up initial connection after 20 seconds
  serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
  retryWrites: true,
  writeConcern: {
    w: "majority", // Wait for majority acknowledgment
    j: true, // Wait for journal commit
    wtimeout: 5000, // Write timeout
  },
  maxConnecting: 10, // Maximum number of concurrent connection attempts
  compression: ["snappy", "zlib"], // Enable compression
  readPreference: "primaryPreferred", // Prefer primary but allow secondary reads
  readConcern: { level: "majority" }, // Read from majority-committed data
} as const

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

export const setupMongoConnection = async (
  { syncIndexes, options }: SetupMongoConnectionArgs = { syncIndexes: false },
) => {
  try {
    await mongoose.connect(MONGODB_CON, { ...DEFAULT_MONGODB_OPTIONS, ...options })
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
