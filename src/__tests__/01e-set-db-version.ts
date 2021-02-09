/**
 * @jest-environment node
 */
import { setupMongoConnection, DbVersion, MainBook, Transaction } from "../mongodb";
import { lightningAccountingPath, lndFee } from "../ledger"
import { fixChannelFeeTxns } from '../upgrade'
const mongoose = require("mongoose");


beforeAll(async () => {
  await setupMongoConnection()
})

afterAll(async () => {
  await mongoose.connection.close()
})


it('db version', async () => {
  const dbVersion = new DbVersion()
  dbVersion.version = 1
  await dbVersion.save()
})
