import { FiatWallet } from "./fiatImpl"
import { setupMongoose } from "./db";
const mongoose = require("mongoose");


const default_uid = "abcdef" // FIXME

beforeAll(async () => {
  await setupMongoose()
  await mongoose.connection.dropDatabase()
});

it('balanceStartAtZero', async () => {
  const fiatWallet = new FiatWallet(default_uid)
  const result = await fiatWallet.getBalance()
  expect(result === 0).toBeTruthy()
})

it('addFunds', async () => {
  const fiatWallet = new FiatWallet(default_uid)
  await fiatWallet.addFunds({amount: 1000})
  const result = await fiatWallet.getBalance()
  expect(result).toEqual(1000)
})
