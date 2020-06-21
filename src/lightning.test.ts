/**
 * @jest-environment node
 */
import { setupMongoConnection } from "./db"
// this import needs to be before medici

import moment from "moment"
import { LightningUserWallet } from "./LightningUserWallet"
import { LightningAdminWallet } from "./LightningAdminImpl"
import { btc2sat, waitForNodeSync, getAuth } from "./utils";
import { login } from "./text";
import { OnboardingEarn } from "./types"
const lnService = require('ln-service')
const lightningPayReq = require('bolt11')
const mongoose = require("mongoose")
const BitcoindClient = require('bitcoin-core')

let lightningWallet
let lightningWalletOutside1
let lightningWalletOutside2

let user1: string
const user2: string = "user2"

const lndOutside1Addr = process.env.LNDOUTSIDE1ADDR ?? 'lnd-outside-1'
const lndOutside1Port = process.env.LNDOUTSIDE1RPCPORT ?? '10009'
const lndOutside2Addr = process.env.LNDOUTSIDE2ADDR ?? 'lnd-outside-2'
const lndOutside2Port = process.env.LNDOUTSIDE2RPCPORT ?? '10009'

const testAccounts = [{ phone: "+16505554321", code: 321321, network: "regtest" }, { phone: "+16505554322", code: 321321, network: "regtest" }]

const onBoardingEarnAmt: number = Object.values(OnboardingEarn).reduce((a, b) => a + b, 0)
const onBoardingEarnIds: string[] = Object.keys(OnboardingEarn)

beforeAll(async () => {
  await setupMongoConnection()

  // FIXME: this might cause issue when running test in parrallel?
  //this also fails the test due to user authentication issue
  // return await mongoose.connection.dropDatabase()
  lightningWalletOutside1 = lnService.authenticatedLndGrpc({
    cert: process.env.TLS,
    macaroon: process.env.MACAROONOUTSIDE1,
    socket: `${lndOutside1Addr}:${lndOutside1Port}`,
  }).lnd;

  lightningWalletOutside2 = lnService.authenticatedLndGrpc({
    cert: process.env.TLS,
    macaroon: process.env.MACAROONOUTSIDE2,
    socket: `${lndOutside2Addr}:${lndOutside2Port}`,
  }).lnd;

});

afterAll(async () => {
  return await mongoose.connection.close()
});

beforeEach(async () => {
  const collections: any[] = await mongoose.connection.db.collections()
  collections.forEach(async collection => await collection.deleteMany())
  await login(testAccounts[0])
  let Users = mongoose.model("User")
  user1 = (await Users.find({}))[0]._id
  lightningWallet = new LightningUserWallet({ uid: user1 })
})

it('Lightning Wallet Get Info works', async () => {
  // const result = await lightningWallet.getInfo()
  // console.log({result})
  const outside1PubKey = (await lnService.getWalletInfo({ lnd: lightningWalletOutside1 })).public_key;
  const outside2PubKey = (await lnService.getWalletInfo({ lnd: lightningWalletOutside2 })).public_key;
  // expect(result === 0).toBeTruthy()
  console.log("Outside node 1 pub key", outside1PubKey)
  console.log("Second node 2 pub key", outside2PubKey)
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
  lightningWallet = new LightningUserWallet({ uid: user2 })
  const request = await lightningWallet.addInvoice({ value: 1000000, memo: "tx 2" })

  const decoded = lightningPayReq.decode(request)
  const decodedHash = decoded.tags.filter(item => item.tagName === "payment_hash")[0].data

  const InvoiceUser = mongoose.model("InvoiceUser")
  const { uid } = await InvoiceUser.findById(decodedHash)

  expect(uid).toBe(user2)
})

const checkIsBalanced = async () => {
  const User = mongoose.model("User")
  const admin = await new User({ role: "admin" }).save()
  const adminWallet = new LightningAdminWallet({ uid: admin._id })
  const { assetsEqualLiabilities, lndBalanceSheetAreSynced } = await adminWallet.balanceSheetIsBalanced()
  expect(assetsEqualLiabilities).toBeTruthy()

  // FIXME add this back
  // expect(lndBalanceSheetAreSynced).toBeTruthy()
}

it('add earn adds balance correctly', async () => {
  let currentBalance: number = await lightningWallet.getBalance()
  await lightningWallet.addEarn(onBoardingEarnIds)
  let finalBalance: number = await lightningWallet.getBalance()
  expect(finalBalance).toBe(currentBalance + onBoardingEarnAmt)
  await checkIsBalanced()
})

it('receives external funding correctly', async () => {
  const connection_obj = {
    network: 'regtest', username: 'rpcuser', password: 'rpcpass',
    host: process.env.BITCOINDADDR, port: process.env.BITCOINDPORT
  }
  const bitcoindClient = new BitcoindClient(connection_obj)

  const { lnd } = lnService.authenticatedLndGrpc(getAuth())

  let currentBalance: number = await lightningWallet.getBalance()
  let onChainAddress: string = await lightningWallet.getOnChainAddress()
  let result = await bitcoindClient.generateToAddress(1, onChainAddress)
  await waitForNodeSync(lnd)
  let finalBalance: number = await lightningWallet.getBalance()
  expect(finalBalance).toBe(currentBalance + btc2sat(50))
  await checkIsBalanced()
})

it('payInvoice', async () => {
  const { request } = await lnService.createInvoice({ lnd: lightningWalletOutside1, tokens: 10000 })
  await lightningWallet.addEarn(onBoardingEarnIds)
  const currentBalance: number = await lightningWallet.getBalance()
  const result: string = await lightningWallet.pay({ invoice: request })
  expect(result).toBe("success")
  const finalBalance: number = await lightningWallet.getBalance()
  expect(finalBalance).toBe(currentBalance - 10000)
  await checkIsBalanced()
})

it('payInvoiceToAnotherGaloyUser', async () => {
  await login(testAccounts[1])
  const Users = mongoose.model("User")
  const galoyUser2 = (await Users.find({}))[1]._id
  const lightningWallet2 = new LightningUserWallet({ uid: galoyUser2 })
  const user2CurrentBalance = await lightningWallet2.getBalance()
  const user1CurrentBalance = await lightningWallet.getBalance()
  const request = await lightningWallet2.addInvoice({ value: 1000, memo: "on us txn" })
  await lightningWallet.pay({ invoice: request })
  const user2FinalBalance = await lightningWallet2.getBalance()
  const user1FinalBalance = await lightningWallet.getBalance()
  expect(user1FinalBalance).toBe(user1CurrentBalance - 1000)
  expect(user2FinalBalance).toBe(user2CurrentBalance + 1000)
  await checkIsBalanced()
})

// it('payInvoiceToSelf', async () => {
//   // TODO should fail
// })

it('pushPayment', async () => {
  const destination = (await lnService.getWalletInfo({ lnd: lightningWalletOutside1 })).public_key;
  const tokens = 1000
  await lightningWallet.addEarn(onBoardingEarnIds)
  const currentBalance: number = await lightningWallet.getBalance()
  const res = await lightningWallet.pay({ destination, tokens })
  const finalBalance: number = await lightningWallet.getBalance()
  expect(res).toBe("success")
  expect(finalBalance).toBe(currentBalance - 1000)
  await checkIsBalanced()
})

// it('testDbTransaction', async () => {
//   //TODO try to fetch simulataneously (ie: with Premise.all[])
//   // balances with pending but settled transaction to see if 
//   // we can create a race condition in the DB
// })