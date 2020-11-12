/**
 * @jest-environment node
 */
import { createHash, randomBytes } from 'crypto';
import { quit } from "../lock";
import { InvoiceUser, MainBook, setupMongoConnection, Transaction, User } from "../mongodb";
import { checkIsBalanced, getUserWallet, lndOutside1, lndOutside2, mockGetExchangeBalance, onBoardingEarnAmt, onBoardingEarnIds, username } from "../tests/helper";
import { baseLogger, getAuth, getHash, sleep } from "../utils";
import { getFunderWallet } from "../walletFactory";

const lnService = require('ln-service')
const mongoose = require("mongoose")

let userWallet0, userWallet1, userWallet2
let initBalance0, initBalance1, initBalance2

const amountInvoice = 1000

jest.mock('../notification')
const { sendNotification } = require("../notification");


beforeAll(async () => {
  await setupMongoConnection()
  mockGetExchangeBalance()

  userWallet0 = await getUserWallet(0)
  userWallet1 = await getUserWallet(1)
  userWallet2 = await getUserWallet(2)
});

beforeEach(async () => {
  initBalance0 = await userWallet0.getBalance()
  initBalance1 = await userWallet1.getBalance()
  initBalance2 = await userWallet2.getBalance()

  jest.clearAllMocks()
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  // to make this test re-entrant, we need to remove the fund from userWallet1 and delete the user
  const finalBalance = await userWallet1.getBalance()
  const funderWallet = await getFunderWallet({ logger: baseLogger })

  if (!!finalBalance) {
    const request = await funderWallet.addInvoice({ value: finalBalance })
    await userWallet1.pay({ invoice: request })
  }

  await User.findOneAndRemove({ _id: userWallet1.uid })
  jest.restoreAllMocks();

  await mongoose.connection.close()
  await quit()
});


it('add invoice', async () => {
  const request = await userWallet1.addInvoice({ value: 1000 })
  expect(request.startsWith("lnbcrt10")).toBeTruthy()
  const { uid } = await InvoiceUser.findById(getHash(request))
  expect(uid).toBe(userWallet1.uid)
})

it('add public invoice', async () => {
  const request = await userWallet1.addInvoice({ selfGenerated: false })
  expect(request.startsWith("lnbcrt1")).toBeTruthy()
  const { uid, selfGenerated } = await InvoiceUser.findById(getHash(request))
  expect(uid).toBe(userWallet1.uid)
  expect(selfGenerated).toBe(false)
})

it('add invoice to different user', async () => {
  const request = await userWallet2.addInvoice({ value: 1000000 })
  const { uid } = await InvoiceUser.findById(getHash(request))
  expect(uid).toBe(userWallet2.uid)
})

it('add invoice with no amount', async () => {
  const request = await userWallet2.addInvoice({})
  const { uid } = await InvoiceUser.findById(getHash(request))
  expect(uid).toBe(userWallet2.uid)
})

it('add earn adds balance correctly', async () => {
  const getAndVerifyRewards = async () => {
    await userWallet1.addEarn(onBoardingEarnIds)
    const finalBalance = await userWallet1.getBalance()
    expect(finalBalance).toBe(onBoardingEarnAmt)
    await checkIsBalanced()
  }

  await getAndVerifyRewards()

  // yet, if we do it another time, the balance should not increase, 
  // because all the rewards has already been been consumed:
  await getAndVerifyRewards()
}, 30000)

it('payInvoice', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: amountInvoice })
  const result = await userWallet1.pay({ invoice: request })
  expect(result).toBe("success")
  const finalBalance = await userWallet1.getBalance()
  expect(finalBalance).toBe(initBalance1 - amountInvoice)
})

it('payInvoice with High CLTV Delta', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: amountInvoice, cltv_delta: 200 })
  const result = await userWallet1.pay({ invoice: request })
  expect(result).toBe("success")
  const finalBalance = await userWallet1.getBalance()
  expect(finalBalance).toBe(initBalance1 - amountInvoice)
})

it('receives payment from outside', async () => {
  const memo = "myMemo"

  const request = await userWallet1.addInvoice({ value: amountInvoice, memo })
  await lnService.pay({ lnd: lndOutside1, request })
  const finalBalance = await userWallet1.getBalance()
  expect(finalBalance).toBe(initBalance1 + amountInvoice)

  const hash = getHash(request)

  const mongotx = await Transaction.findOne({ hash })
  expect(mongotx.memo).toBe(memo)

  expect(await userWallet1.updatePendingInvoice({ hash })).toBeTruthy()
  expect(await userWallet1.updatePendingInvoice({ hash })).toBeTruthy()

})

// @ts-ignore
const Lightning = require('../Lightning');

it('expired payment', async () => {
  const memo = "payment that should expire"
  const { lnd } = lnService.authenticatedLndGrpc(getAuth())

  const dbSetSpy = jest.spyOn(Lightning, 'delay').mockImplementation(() => ({value: 1, unit: 'seconds'}))

  const request = await userWallet1.addInvoice({ value: amountInvoice, memo })
  const { id } = await lnService.decodePaymentRequest({ lnd, request })
  expect(await InvoiceUser.countDocuments({_id: id})).toBe(1)

  // is deleting the invoice the same as when as invoice expired?
  // const res = await lnService.cancelHodlInvoice({ lnd, id })
  // console.log({res}, "cancelHodlInvoice result")

  await sleep(5000)
  
  // hacky way to test if an invoice has expired 
  // without having to to have a big timeout.
  // let i = 30
  // let hasExpired = false
  // while (i > 0 || hasExpired) {
  //   try {
  //     console.log({i}, "get invoice start")
  //     const res = await lnService.getInvoice({ lnd, id })
  //     console.log({res, i}, "has expired?")
  //   } catch (err) {
  //     console.log({err})
  //   }
  //   i--
  //   await sleep(1000)
  // }
  
  // try {
  //   await lnService.pay({ lnd: lndOutside1, request })
  // } catch (err) {
  //   console.log({err}, "error paying expired/cancelled invoice (that is intended)")
  // }

  // await expect(lnService.pay({ lnd: lndOutside1, request })).rejects.toThrow()
  

  await userWallet1.getBalance()

  await sleep(500)
    
  expect(await InvoiceUser.countDocuments({_id: id})).toBe(0)
  
  try {
    await lnService.getInvoice({ lnd: getAuth(), id })
  } catch (err) {
    console.log({err}, "invoice should not exist any more")
  }

  expect(await userWallet1.updatePendingInvoice({ hash: id })).toBeFalsy()
  
}, 150000)

it('fails to pay when user has insufficient balance', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: initBalance1 + 1000000 })
  //FIXME: Check exact error message also
  await expect(userWallet1.pay({ invoice: request })).rejects.toThrow()
})

it('payInvoiceToAnotherGaloyUser', async () => {
  const memo = "my memo as a payer"

  const request = await userWallet2.addInvoice({ value: amountInvoice })
  await userWallet1.pay({ invoice: request, memo })

  const user1FinalBalance = await userWallet1.getBalance()
  const user2FinalBalance = await userWallet2.getBalance()

  expect(user1FinalBalance).toBe(initBalance1 - amountInvoice)
  expect(user2FinalBalance).toBe(initBalance2 + amountInvoice)

  const hash = getHash(request)
  const matchTx = tx => tx.type === 'on_us' && tx.hash === hash

  const user2Txn = await userWallet2.getTransactions()
  const user2OnUsTxn = user2Txn.filter(matchTx)
  expect(user2OnUsTxn[0].type).toBe('on_us')
  expect(user2OnUsTxn[0].description).toBe('on_us')
  await checkIsBalanced()

  const user1Txn = await userWallet1.getTransactions()
  const user1OnUsTxn = user1Txn.filter(matchTx)
  expect(user1OnUsTxn[0].type).toBe('on_us')
  expect(user1OnUsTxn[0].description).toBe(memo)

  // making request twice because there is a cancel state, and this should be re-entrant
  expect(await userWallet1.updatePendingInvoice({ hash })).toBeTruthy()
  expect(await userWallet2.updatePendingInvoice({ hash })).toBeTruthy()
  expect(await userWallet1.updatePendingInvoice({ hash })).toBeTruthy()
  expect(await userWallet2.updatePendingInvoice({ hash })).toBeTruthy()

})

it('payInvoiceToAnotherGaloyUserWithMemo', async () => {
  const memo = "invoiceMemo"

  const request = await userWallet1.addInvoice({ value: amountInvoice, memo })
  await userWallet2.pay({ invoice: request })

  const matchTx = tx => tx.type === 'on_us' && tx.hash === getHash(request)

  const user1Txn = await userWallet1.getTransactions()
  expect(user1Txn.filter(matchTx)[0].description).toBe(memo)
  expect(user1Txn.filter(matchTx)[0].type).toBe('on_us')

  const user2Txn = await userWallet2.getTransactions()
  expect(user2Txn.filter(matchTx)[0].description).toBe(memo)
  expect(user2Txn.filter(matchTx)[0].type).toBe('on_us')
})

it('payInvoiceToAnotherGaloyUserWith2DifferentMemo', async () => {
  const memo = "invoiceMemo"
  const memoPayer = "my memo as a payer"

  const request = await userWallet2.addInvoice({ value: amountInvoice, memo })
  await userWallet1.pay({ invoice: request, memo: memoPayer })

  const matchTx = tx => tx.type === 'on_us' && tx.hash === getHash(request)

  const user2Txn = await userWallet2.getTransactions()
  expect(user2Txn.filter(matchTx)[0].description).toBe(memo)
  expect(user2Txn.filter(matchTx)[0].type).toBe('on_us')

  const user1Txn = await userWallet1.getTransactions()
  expect(user1Txn.filter(matchTx)[0].description).toBe(memoPayer)
  expect(user1Txn.filter(matchTx)[0].type).toBe('on_us')
})

it('payInvoiceToSelf', async () => {
  const invoice = await userWallet1.addInvoice({ value: 1000, memo: "self payment" })
  await expect(userWallet1.pay({ invoice })).rejects.toThrow()
})

it('onUs pushPayment', async () => {
  const destination = await userWallet0.getNodePubkey()
  const res = await userWallet1.pay({ destination, username, amount: amountInvoice })

  const finalBalance0 = await userWallet0.getBalance()
  const finalBalance1 = await userWallet1.getBalance()  
  
  expect(res).toBe("success")
  expect(finalBalance0).toBe(initBalance0 + amountInvoice)
  expect(finalBalance1).toBe(initBalance1 - amountInvoice)
  await checkIsBalanced()
})

it('onUs pushPayment error for same user', async () => {
  const destination = await userWallet0.getNodePubkey()
  await expect(userWallet0.pay({ destination, username, amount: amountInvoice })).rejects.toThrow()
  await checkIsBalanced()
})

// it('pushPayment payment', async () => {

// })

// it('pushPayment receipt', async () => {

// })

it('fails to pay when channel capacity exceeded', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: 15000000 })

  let didThrow = false

  // FIXME: below statement fails due to some reason, so using try catch for now
  // await expect(userWallet1.pay({ invoice: request })).rejects.toThrow()
  try {
    await userWallet1.pay({ invoice: request })
  } catch (error) {
    didThrow = true
  }
  //FIXME: Are single line if bad design?
  if (!didThrow) fail('Function did not fail')
})

it('pay hodl invoice', async () => {
  const randomSecret = () => randomBytes(32);
  const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');
  const secret = randomSecret();
  const id = sha256(secret);

  const { request } = await lnService.createHodlInvoice({ id, lnd: lndOutside1, tokens: amountInvoice });
  console.log({ request })
  const result = await userWallet1.pay({ invoice: request })

  expect(result).toBe("pending")
  const finalBalance = await userWallet1.getBalance()
  // FIXME: necessary to not have openHandler ?
  // https://github.com/alexbosworth/ln-service/issues/122
  await lnService.settleHodlInvoice({ lnd: lndOutside1, secret: secret.toString('hex') });
  expect(finalBalance).toBe(initBalance1 - amountInvoice)
}, 60000)

it(`don't settle hodl invoice`, async () => {
  const randomSecret = () => randomBytes(32);
  const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');
  const secret = randomSecret();
  const id = sha256(secret);

  const { request } = await lnService.createHodlInvoice({ id, lnd: lndOutside1, tokens: amountInvoice });
  console.log({ request })
  const result = await userWallet1.pay({ invoice: request })
  expect(result).toBe("pending")

  console.log("payment has timeout. status is pending.")

  const intermediateBalance = await userWallet1.getBalance()
  expect(intermediateBalance).toBe(initBalance1 - amountInvoice)

  await lnService.cancelHodlInvoice({ id, lnd: lndOutside1 });

  // making sure it's propagating back to lnd0.
  // use an event to do it deterministically
  await sleep(5000)
  // await userWallet1.updatePendingPayments()

  const finalBalance = await userWallet1.getBalance()
  expect(finalBalance).toBe(initBalance1)
}, 60000)

it('payInvoice to lnd outside 2', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside2, tokens: amountInvoice, is_including_private_channels: true })
  const { id } = await lnService.decodePaymentRequest({ lnd: lndOutside2, request })

  const initialBalance = await userWallet1.getBalance()

  const result = await userWallet1.pay({ invoice: request, memo: "pay an unconnected node" })
  expect(result).toBe("success")
  const finalBalance = await userWallet1.getBalance()

  const { results: [{ fee }] } = await MainBook.ledger({ account: userWallet1.accountPath, hash: id })
  expect(finalBalance).toBe(initialBalance - amountInvoice - fee)
})

it('if fee are too high, payment is cancelled', async () => {
  // TODO
})

it('pays zero amount invoice', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1 })
  const initialBalance = await userWallet1.getBalance()
  const result = await userWallet1.pay({ invoice: request, amount: amountInvoice })
  expect(result).toBe("success")
  const finalBalance = await userWallet1.getBalance()
  expect(finalBalance).toBe(initialBalance - amountInvoice)
})

it('receive zero amount invoice', async () => {
  const initialBalance = await userWallet1.getBalance()
  const invoice = await userWallet1.addInvoice({})
  await lnService.pay({ lnd: lndOutside1, request: invoice, tokens: amountInvoice })
  const finalBalance = await userWallet1.getBalance()
  expect(finalBalance).toBe(initialBalance + amountInvoice)
})

it('fails to pay zero amt invoice without separate amt', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1 })
  await expect(userWallet1.pay({ invoice: request })).rejects.toThrow()
})

it('fails to pay regular invoice with separate amt', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: amountInvoice })
  await expect(userWallet1.pay({ invoice: request, amount: amountInvoice })).rejects.toThrow()
})



// it('testDbTransaction', async () => {
//   //TODO try to fetch simulataneously (ie: with Premise.all[])
//   // balances with pending but settled transaction to see if 
//   // we can create a race condition in the DB
// })