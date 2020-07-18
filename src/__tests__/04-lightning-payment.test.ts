/**
 * @jest-environment node
 */
// this import needs to be before medici
import { createHash, randomBytes } from 'crypto';
import { setupMongoConnection } from "../db";
import { LightningAdminWallet } from "../LightningAdminImpl";
import { LightningUserWallet } from "../LightningUserWallet";
import { login, TEST_NUMBER } from "../text";
import { OnboardingEarn } from "../types";
import { sleep } from "../utils";
import { checkIsBalanced } from "../utils_for_tst";
const lnService = require('ln-service')
const lightningPayReq = require('bolt11')
const mongoose = require("mongoose")
const Users = mongoose.model("User")
const BitcoindClient = require('bitcoin-core')

let lightningWallet
let lndOutside1
let lndOutside2

let user1: string
const user2 = "user2"

const lndOutside1Addr = process.env.LNDOUTSIDE1ADDR ?? 'lnd-outside-1'
const lndOutside1Port = process.env.LNDOUTSIDE1RPCPORT ?? '10009'
const lndOutside2Addr = process.env.LNDOUTSIDE2ADDR ?? 'lnd-outside-2'
const lndOutside2Port = process.env.LNDOUTSIDE2RPCPORT ?? '10009'

//FIXME: Maybe switch to using single reward
const onBoardingEarnAmt: number = Object.values(OnboardingEarn).reduce((a, b) => a + b, 0)
const onBoardingEarnIds: string[] = Object.keys(OnboardingEarn)

beforeAll(async () => {
  await setupMongoConnection()

  // FIXME: this might cause issue when running test in parrallel?
  //this also fails the test due to user authentication issue
  // return await mongoose.connection.dropDatabase()
  lndOutside1 = lnService.authenticatedLndGrpc({
    cert: process.env.TLS,
    macaroon: process.env.MACAROONOUTSIDE1,
    socket: `${lndOutside1Addr}:${lndOutside1Port}`,
  }).lnd;

  lndOutside2 = lnService.authenticatedLndGrpc({
    cert: process.env.TLS,
    macaroon: process.env.MACAROONOUTSIDE2,
    socket: `${lndOutside2Addr}:${lndOutside2Port}`,
  }).lnd;

});

afterAll(async () => {
  return await mongoose.connection.close()
});

//Does not seem to be best approach
// const initTestUserWallet = async (i) => {
//   await login(TEST_NUMBER[i])
//   const Users = mongoose.model("User")
//   sleep(2000)
//   user1 = (await Users.findOne({}))._id
//   lightningWallet = new LightningUserWallet({ uid: user1 })
// }

beforeEach(async () => {
  // await mongoose.connection.db.dropCollection('users')
  await login(TEST_NUMBER[0])
  let Users = mongoose.model("User")
  sleep(2000) // FIXME
  console.log("current users", await Users.find({}))
  user1 = (await Users.findOne({}))._id
  lightningWallet = new LightningUserWallet({ uid: user1 })
})

it('list transactions', async () => {

  const result = await lightningWallet.getTransactions()
  expect(result.length).toBe(0)

  // TODO validate a transaction to be and verify result == 1 afterwards.
  // TODO more testing with devnet
})

it('get balance', async () => {
  const balance = await lightningWallet.getBalance()
  expect(balance).toBe(-0)
})


it('add invoice', async () => {
  const request = await lightningWallet.addInvoice({ value: 1000, memo: "tx 1" })
  expect(request.startsWith("lnbcrt10")).toBeTruthy()

  const decoded = lightningPayReq.decode(request)
  const decodedHash = decoded.tags.filter(item => item.tagName === "payment_hash")[0].data

  const InvoiceUser = mongoose.model("InvoiceUser")
  const { uid } = await InvoiceUser.findById(decodedHash)
  //expect(uid).toBe(user1) does not work
  expect(uid == user1).toBe(true)
})


it('add invoice to different user', async () => {
  const lightningWalletUser2 = new LightningUserWallet({ uid: user2 })
  const request = await lightningWalletUser2.addInvoice({ value: 1000000, memo: "tx 2" })

  const decoded = lightningPayReq.decode(request)
  const decodedHash = decoded.tags.filter(item => item.tagName === "payment_hash")[0].data

  const InvoiceUser = mongoose.model("InvoiceUser")
  const { uid } = await InvoiceUser.findById(decodedHash)

  expect(uid).toBe(user2)
})

it('add earn adds balance correctly', async () => {
  await lightningWallet.addEarn(onBoardingEarnIds)
  let finalBalance = await lightningWallet.getBalance()
  expect(finalBalance).toBe(onBoardingEarnAmt)
  await checkIsBalanced()
})

it('payInvoice', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: 10000 })
  await lightningWallet.addEarn(onBoardingEarnIds)
  const result: string = await lightningWallet.pay({ invoice: request })
  expect(result).toBe("success")
  const finalBalance = await lightningWallet.getBalance()
  expect(finalBalance).toBe(onBoardingEarnAmt - 10000)
  await checkIsBalanced()
}, 50000)

it('fails to pay when insufficient balance', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: 10000 })
  //FIXME: Check exact error message also
  await expect(lightningWallet.pay({ invoice: request })).rejects.toThrow()
})

it('payInvoiceToAnotherGaloyUser', async () => {
  await login(TEST_NUMBER[1])
  const galoyUser2 = (await Users.findOne({phone: TEST_NUMBER[1].phone}))._id
  const lightningWallet2 = new LightningUserWallet({ uid: galoyUser2 })
  await lightningWallet.addEarn(onBoardingEarnIds)
  const request = await lightningWallet2.addInvoice({ value: 1000, memo: "on us txn" })
  await lightningWallet.pay({ invoice: request })
  const user2FinalBalance = await lightningWallet2.getBalance()
  const user1FinalBalance = await lightningWallet.getBalance()
  expect(user1FinalBalance).toBe(onBoardingEarnAmt - 1000)
  expect(user2FinalBalance).toBe(1000)
  await checkIsBalanced()
}, 50000)

it('payInvoiceToSelf', async () => {
  const invoice = await lightningWallet.addInvoice({ value: 1000, memo: "self payment" })
  await expect(lightningWallet.pay({ invoice })).rejects.toThrow()
}, 50000)

it('pushPayment', async () => {
  const destination = (await lnService.getWalletInfo({ lnd: lndOutside1 })).public_key;
  const tokens = 1000
  await lightningWallet.addEarn(onBoardingEarnIds)
  const res = await lightningWallet.pay({ destination, tokens })
  const finalBalance = await lightningWallet.getBalance()
  expect(res).toBe("success")
  expect(finalBalance).toBe(onBoardingEarnAmt - tokens)
  await checkIsBalanced()
}, 50000)

it('receives payment from outside', async () => {
  const request = await lightningWallet.addInvoice({ value: 1000, memo: "receive from outside" })
  await lnService.pay({ lnd: lndOutside1, request })
  const finalBalance = await lightningWallet.getBalance()
  expect(finalBalance).toBe(1000)
  await checkIsBalanced()
}, 50000)

it('fails to pay when channel capacity exceeded', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: 2000000 })
  const admin = await new Users({ role: "admin" }).save()
  const adminWallet = new LightningAdminWallet({ uid: admin._id })
  await adminWallet.addFunds({ amount: 2000005, uid: user1 })
  let didThrow: boolean = false

  // FIXME: below statement fails due to some reason, so using try catch for now
  // await expect(lightningWallet.pay({ invoice: request })).rejects.toThrow()
  try {
    await lightningWallet.pay({ invoice: request })
  } catch (error) {
    didThrow = true
  }
  //FIXME: Are single line if bad design?
  if (!didThrow) fail('Function did not fail')
  await checkIsBalanced()
}, 50000)

it('pay hodl invoice', async () => {
  const randomSecret = () => randomBytes(32);
  const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');
  const secret = randomSecret();
  const id = sha256(secret);

  const { request } = await lnService.createHodlInvoice({ id, lnd: lndOutside1, tokens: 1000 });
  await lightningWallet.addEarn(onBoardingEarnIds)
  expect(await lightningWallet.pay({ invoice: request })).toBe("pending")
  await checkIsBalanced()
}, 25000)

// it('testDbTransaction', async () => {
//   //TODO try to fetch simulataneously (ie: with Premise.all[])
//   // balances with pending but settled transaction to see if 
//   // we can create a race condition in the DB
// })