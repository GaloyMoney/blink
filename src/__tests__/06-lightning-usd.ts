/**
 * @jest-environment node
 */
import { quit } from "../lock";
import { InvoiceUser, MainBook, setupMongoConnection, Transaction } from "../mongodb";
import { Price } from "../priceImpl";
import { checkIsBalanced, getUserWallet, lndOutside1 } from "../tests/helper";
import { getAmount, getHash } from "../utils";
import { customerPath } from "../wallet";
const lnService = require('ln-service')
const mongoose = require("mongoose")

let userWalletUsd, initBalanceUsd
let userWallet2, initBalance2

const amountInvoiceUsd = 2

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

it('add invoice with dollar amount', async () => {
  const request = await userWalletUsd.addInvoice({ value: amountInvoiceUsd })
  expect(request.startsWith("lnbcrt")).toBeTruthy()
  const { uid, usd } = await InvoiceUser.findById(getHash(request))

  expect(uid).toBe(userWalletUsd.uid)
  expect(usd).toBe(amountInvoiceUsd)
  
  const price = new Price()
  const lastPrice = await price.lastPrice()
  const satoshis = getAmount(request)!
  expect(usd).toBeCloseTo(satoshis * lastPrice)
})

it('add invoice with no amount', async () => {
  await expect(userWalletUsd.addInvoice({})).rejects.toThrow()
})

it('receives payment from outside', async () => {
  const request = await userWalletUsd.addInvoice({ value: amountInvoiceUsd })
  await lnService.pay({ lnd: lndOutside1, request })

  const finalBalance = await userWalletUsd.getBalance()
  expect(finalBalance).toBe(initBalanceUsd + amountInvoiceUsd)

  const { balance: balanceUSD } = await MainBook.balance({
    account: customerPath(userWalletUsd.uid),
    currency: "USD", 
  })

  const { balance: balanceBTC } = await MainBook.balance({
    account: customerPath(userWalletUsd.uid),
    currency: "BTC", 
  })

  expect(balanceUSD).toBeTruthy()
  expect(balanceBTC).toBeFalsy()

  await checkIsBalanced()
}, 50000)


// it('payInvoice', async () => {
//   const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: amountInvoice })
//   const result = await initBalanceUsd.pay({ invoice: request })
//   expect(result).toBe("success")
//   const finalBalance = await initBalanceUsd.getBalance()
//   expect(finalBalance).toBe(initBalanceUsd - amountInvoice)
//   await checkIsBalanced()
// }, 50000)
