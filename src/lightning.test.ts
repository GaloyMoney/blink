import { LightningWalletAuthed } from "./lightningImpl"
import moment from "moment"
import { createInvoiceUser } from "./db"
var lightningPayReq = require('bolt11')


let lightningWallet

const default_uid = "abcdef" // FIXME

beforeEach(async () => {
  lightningWallet = new LightningWalletAuthed({uid: default_uid})
})

it('Lightning Wallet Get Info works', async () => {
  const result = await lightningWallet.getInfo()
  console.log({result})
  // expect(result === 0).toBeTruthy()
})

it('list transactions', async () => {
  const result = await lightningWallet.getTransactions()
  expect(Array.isArray(result)).toBeTruthy()

  let lastDate = result[0].created_at
  let currentDate

  result.forEach(input => {
    currentDate = moment(input.created_at)

    if (currentDate > lastDate) {
      throw Error("date are not in the correct order")
    }

    lastDate = currentDate
  })

  // TODO more testing with devnet
})

it('get balance', async () => {
  const balance = await lightningWallet.getBalance()
  console.log({balance})
})

it('add invoice', async () => {
  const { request } = await lightningWallet.addInvoice({value: 1000, memo: "tx 1"})
  expect(request.startsWith("lntb10")).toBeTruthy()

  const decoded = lightningPayReq.decode(request)
  const decodedHash = decoded.tags.filter(item => item.tagName === "payment_hash")[0].data

  const InvoiceUser = await createInvoiceUser()
  const {user} = await InvoiceUser.findById(decodedHash)

  expect(user).toBe(default_uid)
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

