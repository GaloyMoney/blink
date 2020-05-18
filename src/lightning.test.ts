import moment from "moment"
const lnService = require('ln-service')
import { LightningWalletAuthed } from "./LightningUserWallet"
import { createInvoiceUser, setupMongoose } from "./db"
var lightningPayReq = require('bolt11')
const mongoose = require("mongoose");


let lightningWallet
let lightningWallet2

const user1 = "user1"
const user2 = "user2"


beforeAll(async () => {
  await setupMongoose()

  // FIXME: this might cause issue when running test in parrallel?
  //this also fails the test due to user authentication issue
  // return await mongoose.connection.dropDatabase()
});


beforeEach(async () => {
  lightningWallet = new LightningWalletAuthed({uid: user1})


  // // example for @kartik
  lightningWallet2 = lnService.authenticatedLndGrpc({
    cert: process.env.TLS,
    macaroon: process.env.MACAROON2,
    socket: 'lnd-service-1:10009',
  }).lnd;
  console.log(lightningWallet2)
  console.log("w2",lightningWallet)
  const nodePublicKey = (await lnService.getWalletInfo({lnd:lightningWallet2})).public_key;
  console.log("Second node pub key", nodePublicKey)
  // lnService.createInvoice({lnd: lnd2, amoint... })
  // lnService.pay({lnd: lnd2, amoint... })

})

it('Lightning Wallet Get Info works', async () => {
  const result = await lightningWallet.getInfo()
  console.log({result})
  const nodePublicKey = (await lnService.getWalletInfo({lnd:lightningWallet2})).public_key;
  // expect(result === 0).toBeTruthy()
  console.log("Second node pub key", nodePublicKey)
})


it('add invoice', async () => {
  const { request } = await lightningWallet.addInvoice({value: 1000, memo: "tx 1"})
  expect(request.startsWith("lntb10")).toBeTruthy()

  const decoded = lightningPayReq.decode(request)
  const decodedHash = decoded.tags.filter(item => item.tagName === "payment_hash")[0].data

  const InvoiceUser = await createInvoiceUser()
  const {uid} = await InvoiceUser.findById(decodedHash)

  expect(uid).toBe(user1)
})


it('add invoice to different user', async () => {
  lightningWallet = new LightningWalletAuthed({uid: user2})
  const { request } = await lightningWallet.addInvoice({value: 1000000, memo: "tx 2"})

  const decoded = lightningPayReq.decode(request)
  const decodedHash = decoded.tags.filter(item => item.tagName === "payment_hash")[0].data

  const InvoiceUser = await createInvoiceUser()
  const {uid} = await InvoiceUser.findById(decodedHash)

  expect(uid).toBe(user2)
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


// it('payInvoice', async () => {
//   // TODO need a way to generate an invoice from another node
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