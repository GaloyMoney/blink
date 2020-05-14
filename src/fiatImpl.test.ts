import { FiatAdminWallet } from "./FiatAdminWallet"
import { setupMongoose } from "./db";
const mongoose = require("mongoose");


const uid = "abc123" // FIXME
let fiatWallet

beforeAll(async () => {
  await setupMongoose()

  // FIXME: this might cause issue when running test in parrallel?
  //this also fails the test due to user authentication issue
  // return await mongoose.connection.dropDatabase()
});

beforeEach(async () => {
  fiatWallet = new FiatAdminWallet()
})

afterAll(async () => {
  return await mongoose.connection.close()
});

it('balanceStartAtZero', async () => {
  const result = await fiatWallet.getBalance()
  expect(result).toBe(-0)
})

it('addFunds', async () => {
  await fiatWallet.addFunds({amount: 1000, uid, type: "earn"})
  const result = await fiatWallet.getBalance()
  expect(result).toEqual(-1000)
})

it('withdrawFunds', async () => {
  await fiatWallet.widthdrawFunds({amount: 250, uid, type: "earn"})
  const result = await fiatWallet.getBalance()
  expect(result).toEqual(-750)
})

// TODO
// it('listTransactions', async () => {
//   const transactions = await fiatWallet.getTransactions()
//   expect(transactions.length).toEqual(2)
// })
