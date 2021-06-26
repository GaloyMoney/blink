import { exit } from "process"
import { sleep } from "./utils"
import { baseLogger } from "./logger"

import mongoose from "mongoose"

import { User, Transaction, InvoiceUser } from "./schema"

// we have to import schema before medici
import { book } from "medici"

export const MainBook = new book("MainBook")

// TODO add an event listenever if we got disconnecter from MongoDb
// after a first succesful connection

const user = process.env.MONGODB_USER ?? "testGaloy"
const password = process.env.MONGODB_PASSWORD
const address = process.env.MONGODB_ADDRESS ?? "mongodb"
const db = process.env.MONGODB_DATABASE ?? "galoy"

const path = `mongodb://${user}:${password}@${address}/${db}`

export const setupMongoConnection = async () => {
  try {
    await mongoose.connect(path, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    })
    mongoose.set("runValidators", true)
    await User.syncIndexes()
    await Transaction.syncIndexes()
    await InvoiceUser.syncIndexes()
  } catch (err) {
    baseLogger.fatal({ err, path }, `error connecting to mongodb`)
    await sleep(100)
    exit(1)
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
    baseLogger.fatal({ err, path }, `error connecting to secondary mongodb`)
    await sleep(100)
    exit(1)
  }

  return mongoose
}
