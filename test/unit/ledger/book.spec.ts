import { toSats } from "@domain/bitcoin"
import { intraledger } from "@services/ledger/intraledger"
import { Book } from "medici"
import { MongoMemoryReplSet } from "mongodb-memory-server"
import mongoose from "mongoose"

let replSet: MongoMemoryReplSet

jest.setTimeout(30000)

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    binary: {
      version: "4.4.0",
    },
    instanceOpts: [
      // Set the expiry job in MongoDB to run every second
      { args: ["--setParameter", "ttlMonitorSleepSecs=1"] },
    ],
    replSet: {
      name: "rs0",
      storageEngine: "wiredTiger",
    },
  })
  const connectionString = replSet.getUri("medici_test")
  console.log(replSet.getUri())
  await mongoose.connect(connectionString)
})

afterAll(async () => {
  await mongoose.disconnect()
  if (replSet) {
    await replSet.stop()
  }
})

it("create book", async () => {
  const myBook = new Book("MyBook")

  const senderWalletId = "sender" as WalletId
  const recipientWalletId = "recipient" as WalletId
  const sats = toSats(1000)

  await intraledger.addOnChainIntraledgerTxSend({})

  const journal = await myBook
    .entry("Received payment")
    .debit("Assets:Cash", 1000)
    .credit("Income", 1000, { client: "Joe Blow" })
    .commit()

  console.log({ journal })
})
