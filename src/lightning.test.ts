/**
 * @jest-environment node
 */
import { setupMongoConnection } from "./db"
// this import needs to be before medici


import moment from "moment"
import { LightningUserWallet } from "./LightningUserWallet"
const lnService = require('ln-service')
var lightningPayReq = require('bolt11')
const mongoose = require("mongoose")


let lightningWallet
let lightningWalletOutside1
let lightningWalletOutside2

const user1 = "user1"
const user2 = "user2"

const lndOutside1Addr = process.env.LNDOUTSIDE1ADDR ?? 'lnd-outside-1'
const lndOutside1Port = process.env.LNDOUTSIDE1RPCPORT ?? '10009'
const lndOutside2Addr = process.env.LNDOUTSIDE2ADDR ?? 'lnd-outside-2'
const lndOutside2Port = process.env.LNDOUTSIDE2RPCPORT ?? '10009'

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
  lightningWallet = new LightningUserWallet({uid: user1})


  // // example for @kartik

  // lnService.createInvoice({lnd: lnd2, amoint... })
  // lnService.pay({lnd: lnd2, amoint... })

})

it('Lightning Wallet Get Info works', async () => {
  const result = await lightningWallet.getInfo()
  console.log({result})
  const outside1PubKey = (await lnService.getWalletInfo({lnd:lightningWalletOutside1})).public_key;
  const outside2PubKey = (await lnService.getWalletInfo({lnd:lightningWalletOutside2})).public_key;
  // expect(result === 0).toBeTruthy()
  console.log("Outside node 1 pub key", outside1PubKey)
  console.log("Second node 2 pub key", outside2PubKey)
})


it('add invoice', async () => {
  const request = await lightningWallet.addInvoice({value: 1000, memo: "tx 1"})
  expect(request.startsWith("lnbcrt10")).toBeTruthy()

  const decoded = lightningPayReq.decode(request)
  const decodedHash = decoded.tags.filter(item => item.tagName === "payment_hash")[0].data

  const InvoiceUser = mongoose.model("InvoiceUser")
  const {uid} = await InvoiceUser.findById(decodedHash)

  expect(uid).toBe(user1)
})


it('add invoice to different user', async () => {
  lightningWallet = new LightningUserWallet({uid: user2})
  const request = await lightningWallet.addInvoice({value: 1000000, memo: "tx 2"})

  const decoded = lightningPayReq.decode(request)
  const decodedHash = decoded.tags.filter(item => item.tagName === "payment_hash")[0].data

  const InvoiceUser = mongoose.model("InvoiceUser")
  const {uid} = await InvoiceUser.findById(decodedHash)

  expect(uid).toBe(user2)
})



// it('list transactions', async () => {

//   const result = await lightningWallet.getTransactions()
//   expect(result.length).toBe(0) 

//   // TODO validate a transaction to be and verify result == 1 afterwards.
//   // TODO more testing with devnet
// })

// it('get balance', async () => {
//   const balance = await lightningWallet.getBalance()
//   expect(balance).toBe(-0)
// })



// it('payInvoice', async () => {
//   // TODO need a way to generate an invoice from another node
//   var { request } = await lnService.createInvoice({ lnd: lightningWalletOutside1, tokens: 10000 })
//   var result = await lightningWallet.payInvoice({ invoice: request })
//   expect(result.result).toBe(true)
// })

// it('payInvoiceToAnotherGaloyUser', async () => {
//   // TODO Manage on us transaction from 2 users of our network
// })

// it('payInvoiceToSelf', async () => {
//   // TODO should fail
// })

// it('pushPayment', async () => {
//   // payment without invoice, lnd 0.9+
// })

// it('testDbTransaction', async () => {
//   //TODO try to fetch simulataneously (ie: with Premise.all[])
//   // balances with pending but settled transaction to see if 
//   // we can create a race condition in the DB
// })