import { FiatWallet } from "./fiatImpl"
import { setupMongoose } from "./db";
const mongoose = require("mongoose");


const uid = "abc123" // FIXME
let fiatWallet

beforeAll(async () => {
  await setupMongoose()

  // FIXME: this might cause issue when running test in parrallel?
  return await mongoose.connection.dropDatabase()
});

beforeEach(async () => {
  fiatWallet = new FiatWallet({uid})
})

afterAll(async () => {
  return await mongoose.connection.close()
});

it('balanceStartAtZero', async () => {
  const result = await fiatWallet.getBalance()
  expect(result === 0).toBeTruthy()
})

it('addFunds', async () => {
  await fiatWallet.addFunds({amount: 1000})
  const result = await fiatWallet.getBalance()
  expect(result).toEqual(1000)
})

it('withdrawFunds', async () => {
  await fiatWallet.widthdrawFunds({amount: 250})
  const result = await fiatWallet.getBalance()
  expect(result).toEqual(750)
})

it('listTransactions', async () => {
  const transactions = await fiatWallet.getTransactions()
  expect(transactions.length).toEqual(2)
})
