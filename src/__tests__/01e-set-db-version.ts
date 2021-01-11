/**
 * @jest-environment node
 */
import { setupMongoConnection, DbVersion, MainBook, Transaction } from "../mongodb";
import { lndAccountingPath, lndFee } from "../ledger"
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

it('applies version 9 upgrade correctly', async () => {

  const fee = 1234
  const metadata = { currency: "BTC", txid: "xyz", type: "fee", pending: false }
  await MainBook.entry("channel closing onchain fee")
    .debit(lndAccountingPath, fee, { ...metadata })
    .credit(lndFee, fee, { ...metadata })
    .commit()

  const { balance: wrongExpenseBalance } = await MainBook.balance({
    account: lndFee,
    currency: "BTC",
  })

  expect(wrongExpenseBalance).toBe(fee)

  await fixChannelFeeTxns()

  const { balance: expenseBalanceAfterUpgrade } = await MainBook.balance({
    account: lndFee,
    currency: "BTC",
  })

  expect(expenseBalanceAfterUpgrade).toBe(fee * -1)

  const journal = await Transaction.findOne({ "accounts": lndFee }, { "_journal": 1 })
  await MainBook.void(journal._journal)

  const { balance: expenseBalanceAfterVoid } = await MainBook.balance({
    account: lndFee,
    currency: "BTC",
  })

  expect(expenseBalanceAfterVoid).toBe(0)
})