/**
 * @jest-environment node
 */
import { setupMongoConnection } from "../db";
// this import needs to be before medici
import { createHash, randomBytes } from 'crypto';
import { LightningAdminWallet } from "../LightningAdminImpl";
import { LightningUserWallet } from "../LightningUserWallet";
import { OnboardingEarn } from "../types";
import { checkIsBalanced } from "../utils_for_tst";
const lnService = require('ln-service')
const lightningPayReq = require('bolt11')
const mongoose = require("mongoose")
const Users = mongoose.model("User")

let userWallet1, userWallet2
let uidFromToken1, uidFromToken2


import {lndOutside1, getUidFromToken, getUserWallet} from "./import"


//FIXME: Maybe switch to using single reward
const onBoardingEarnAmt: number = Object.values(OnboardingEarn).reduce((a, b) => a + b, 0)
const onBoardingEarnIds: string[] = Object.keys(OnboardingEarn)

beforeAll(async () => {
  await setupMongoConnection()
  uidFromToken1 = await getUidFromToken(1)
  userWallet1 = await getUserWallet(1)
  uidFromToken2 = await getUidFromToken(2)
  userWallet2 = await getUserWallet(2)
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

it('get balance', async () => {
  const balance = await userWallet1.getBalance()
  expect(balance).toBe(-0)
})

it('add invoice', async () => {
  const request = await userWallet1.addInvoice({ value: 1000, memo: "tx 1" })
  expect(request.startsWith("lnbcrt10")).toBeTruthy()

  const decoded = lightningPayReq.decode(request)
  const decodedHash = decoded.tags.filter(item => item.tagName === "payment_hash")[0].data

  const InvoiceUser = mongoose.model("InvoiceUser")
  const { uid } = await InvoiceUser.findById(decodedHash)
  //expect(uid).toBe(user1) does not work
  expect(uid).toBe(uidFromToken1)
})


it('add invoice to different user', async () => {
  const lightningWalletUser2 = new LightningUserWallet({ uid: uidFromToken2 })
  const request = await lightningWalletUser2.addInvoice({ value: 1000000, memo: "tx 2" })

  const decoded = lightningPayReq.decode(request)
  const decodedHash = decoded.tags.filter(item => item.tagName === "payment_hash")[0].data

  const InvoiceUser = mongoose.model("InvoiceUser")
  const { uid } = await InvoiceUser.findById(decodedHash)

  expect(uid).toBe(uidFromToken2)
})

it('add earn adds balance correctly', async () => {
  await userWallet1.addEarn(onBoardingEarnIds)
  let finalBalance = await userWallet1.getBalance()
  expect(finalBalance).toBe(onBoardingEarnAmt)
  await checkIsBalanced()
})

const amountInvoice = 1000

it('payInvoice', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: amountInvoice })
  await userWallet1.addEarn(onBoardingEarnIds)
  const result = await userWallet1.pay({ invoice: request })
  expect(result).toBe("success")
  const finalBalance = await userWallet1.getBalance()
  expect(finalBalance).toBe(onBoardingEarnAmt - amountInvoice)
  await checkIsBalanced()
}, 50000)

it('fails to pay when insufficient balance', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: 10000000 })
  //FIXME: Check exact error message also
  await expect(userWallet1.pay({ invoice: request })).rejects.toThrow()
})

it('payInvoiceToAnotherGaloyUser', async () => {
  const request = await userWallet2.addInvoice({ value: amountInvoice, memo: "on us txn" })
  await userWallet1.pay({ invoice: request })
  const user1FinalBalance = await userWallet1.getBalance()
  const user2FinalBalance = await userWallet2.getBalance()
  expect(user1FinalBalance).toBe(onBoardingEarnAmt - 2 * amountInvoice) 
  // FIXME 2* is not great design.
  // here to account for "payInvoice payment"
  expect(user2FinalBalance).toBe(1000)
  await checkIsBalanced()
}, 50000)

it('payInvoiceToSelf', async () => {
  const invoice = await userWallet1.addInvoice({ value: 1000, memo: "self payment" })
  await expect(userWallet1.pay({ invoice })).rejects.toThrow()
}, 50000)

it('pushPayment', async () => {
  const destination = (await lnService.getWalletInfo({ lnd: lndOutside1 })).public_key;
  const res = await userWallet1.pay({ destination, amountInvoice })
  const finalBalance = await userWallet1.getBalance()
  expect(res).toBe("success")
  expect(finalBalance).toBe(onBoardingEarnAmt - 3 * amountInvoice)
  await checkIsBalanced()
}, 50000)

it('receives payment from outside', async () => {
  const request = await userWallet1.addInvoice({ value: amountInvoice, memo: "receive from outside" })
  await lnService.pay({ lnd: lndOutside1, request })
  const finalBalance = await userWallet1.getBalance()
  expect(finalBalance).toBe(onBoardingEarnAmt - 2 * amountInvoice)
  await checkIsBalanced()
}, 50000)

it('fails to pay when channel capacity exceeded', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: 2000000 })
  const admin = await new Users({ role: "admin" }).save()
  const adminWallet = new LightningAdminWallet({ uid: admin._id })
  await adminWallet.addFunds({ amount: 2000005, uid: uidFromToken1 })
  let didThrow: boolean = false

  // FIXME: below statement fails due to some reason, so using try catch for now
  // await expect(userWallet1.pay({ invoice: request })).rejects.toThrow()
  try {
    await userWallet1.pay({ invoice: request })
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
  await userWallet1.addEarn(onBoardingEarnIds)
  expect(await userWallet1.pay({ invoice: request })).toBe("pending")
  await checkIsBalanced()
}, 25000)

// it('testDbTransaction', async () => {
//   //TODO try to fetch simulataneously (ie: with Premise.all[])
//   // balances with pending but settled transaction to see if 
//   // we can create a race condition in the DB
// })