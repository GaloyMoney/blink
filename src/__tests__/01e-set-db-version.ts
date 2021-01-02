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

it('applies version 9 upgrade correctly', async () => {

  const fee = 1234
  const metadata = { currency: "BTC", txid: "xyz", type: "fee" }
  await MainBook.entry("channel closing onchain fee")
    .debit(lightningAccountingPath, fee, { ...metadata })
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

  const [journalId] = (await Transaction.find({ "accounts": lndFee }, { "_journal": 1 })).map(({ _journal }) => _journal)

  console.log(await Transaction.find({ "accounts": lndFee }))
  await MainBook.void(journalId)
  console.log(await Transaction.find({ "accounts": lndFee }))

  const { balance: expenseBalanceAfterVoid } = await MainBook.balance({
    account: lndFee,
    currency: "BTC",
  })

  expect(expenseBalanceAfterUpgrade).toBe(0)
})