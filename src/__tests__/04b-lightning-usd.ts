/**
 * @jest-environment node
 */
import { quit } from "../lock";
import { InvoiceUser, setupMongoConnection, Transaction } from "../mongodb";
import { checkIsBalanced, getUserWallet, lndOutside1 } from "../tests/helper";
import { getHash } from "../utils";
const lnService = require('ln-service')
const lightningPayReq = require('bolt11')
const mongoose = require("mongoose")

let userWalletUsd, initBalanceUsd
let userWallet2, initBalance2

const amountInvoice = 1000

beforeAll(async () => {
  await setupMongoConnection()
  userWalletUsd = await getUserWallet(5)
  expect(userWalletUsd.currency).toBe("USD")

  userWallet2 = await getUserWallet(2)
});

beforeEach(async () => {
  initBalanceUsd = await userWalletUsd.getBalance()
  initBalance2 = await userWallet2.getBalance()
})

afterAll(async () => {
  await mongoose.connection.close()
  await quit()
});

it('add invoice', async () => {
  const request = await initBalanceUsd.addInvoice({ value: 1000 })
  expect(request.startsWith("lnbcrt10")).toBeTruthy()
  const { uid } = await InvoiceUser.findById(getHash(request))
  expect(uid).toBe(initBalanceUsd.uid)
})

it('add invoice with no amount', async () => {
  // should not be working
  const request = await userWallet2.addInvoice({})
  const { uid } = await InvoiceUser.findById(getHash(request))
  expect(uid).toBe(userWallet2.uid)
})

it('payInvoice', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: amountInvoice })
  const result = await initBalanceUsd.pay({ invoice: request })
  expect(result).toBe("success")
  const finalBalance = await initBalanceUsd.getBalance()
  expect(finalBalance).toBe(initBalanceUsd - amountInvoice)
  await checkIsBalanced()
}, 50000)

it('receives payment from outside', async () => {
  const memo = "myMemo"

  const request = await initBalanceUsd.addInvoice({ value: amountInvoice, memo })
  await lnService.pay({ lnd: lndOutside1, request })
  const finalBalance = await initBalanceUsd.getBalance()
  expect(finalBalance).toBe(initBalanceUsd + amountInvoice)

  const mongotx = await Transaction.findOne({hash: getHash(request)})
  expect(mongotx.memo).toBe(memo)
  await checkIsBalanced()
}, 50000)
