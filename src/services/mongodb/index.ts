import { exit } from "process"
import { sleep } from "@core/utils"
import { getMongoDBConfig } from "@config/app"
import { baseLogger } from "../logger"

import mongoose from "mongoose"

import { User, Transaction, InvoiceUser } from "../mongoose/schema"
// we have to import schema before ledger
import { loadLedger } from "@services/ledger"

export const ledger = loadLedger({
  bankOwnerAccountResolver: async () => {
    const { _id } = await User.findOne(
      { role: "bankowner" },
      { lastIPs: 0, lastConnection: 0 },
    )
    return _id
  },
  dealerAccountResolver: async () => {
    const { _id } = await User.findOne(
      { role: "dealer" },
      { lastIPs: 0, lastConnection: 0 },
    )
    return _id
  },
})

// TODO add an event listenever if we got disconnecter from MongoDb
// after a first succesful connection

export const setupMongoConnection = async () => {
  const { user, address, db, path } = getMongoDBConfig()
  try {
    await mongoose.connect(path, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    })
  } catch (err) {
    baseLogger.fatal({ err, user, address, db }, `error connecting to mongodb`)
    await sleep(100)
    exit(99)
  }

  try {
    mongoose.set("runValidators", true)
    await User.syncIndexes()
    await Transaction.syncIndexes()
    await InvoiceUser.syncIndexes()
  } catch (err) {
    baseLogger.fatal({ err, user, address, db }, `error setting the indexes`)
    await sleep(100)
    exit(99)
  }

  return mongoose
}
export const setupMongoConnectionSecondary = async () => {
  const { user, address, db, path } = getMongoDBConfig()
  try {
    await mongoose.connect(path, {
      replset: { readPreference: "secondary" },
    })
    mongoose.set("runValidators", true)
  } catch (err) {
    baseLogger.fatal({ err, user, address, db }, `error connecting to secondary mongodb`)
    await sleep(100)
    exit(99)
  }

  return mongoose
}
