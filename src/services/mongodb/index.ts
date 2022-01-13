import mongoose from "mongoose"

import { loadLedger } from "@services/ledger"

import { baseLogger } from "../logger"

import { User, Transaction, InvoiceUser } from "../mongoose/schema"

// we have to import schema before ledger

export const ledger = loadLedger({
  bankOwnerWalletResolver: async () => {
    const { walletId } = await User.findOne({ role: "bankowner" }, { walletId: 1 })
    return walletId
  },
  dealerWalletResolver: async () => {
    const { walletId } = await User.findOne({ role: "dealer" }, { walletId: 1 })
    return walletId
  },
  funderWalletResolver: async () => {
    const { walletId } = await User.findOne({ role: "funder" }, { walletId: 1 })
    return walletId
  },
})

// TODO add an event listenever if we got disconnecter from MongoDb
// after a first successful connection

const user = process.env.MONGODB_USER ?? "testGaloy"
const password = process.env.MONGODB_PASSWORD
const address = process.env.MONGODB_ADDRESS ?? "mongodb"
const db = process.env.MONGODB_DATABASE ?? "galoy"

const path = `mongodb://${user}:${password}@${address}/${db}`

export const setupMongoConnection = async (syncIndexes = false) => {
  try {
    await mongoose.connect(path, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    })
  } catch (err) {
    baseLogger.fatal({ err, user, address, db }, `error connecting to mongodb`)
    throw err
  }

  try {
    mongoose.set("runValidators", true)
    if (syncIndexes) {
      await User.syncIndexes()
      await Transaction.syncIndexes()
      await InvoiceUser.syncIndexes()
    }
  } catch (err) {
    baseLogger.fatal({ err, user, address, db }, `error setting the indexes`)
    throw err
  }

  return mongoose
}
export const setupMongoConnectionSecondary = async () => {
  try {
    await mongoose.connect(path, {
      replset: { readPreference: "secondary" },
    })
    mongoose.set("runValidators", true)
  } catch (err) {
    baseLogger.fatal({ err, user, address, db }, `error connecting to secondary mongodb`)
    throw err
  }

  return mongoose
}
