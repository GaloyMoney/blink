/**
 * @jest-environment node
 */
import { createHash, randomBytes } from 'crypto';
import { AdminWallet } from "../AdminWallet";
import { FEECAP } from "../Lightning";
import { quit } from "../lock";
import { InvoiceUser, setupMongoConnection, Transaction } from "../mongodb";
import { checkIsBalanced, getUserWallet, lndOutside1, lndOutside2, mockGetExchangeBalance, onBoardingEarnAmt, onBoardingEarnIds, username } from "../tests/helper";
import { getAuth, getHash, sleep } from "../utils";

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
  // uncomment when necessary
  
  // const finalBalance = await userWallet1.getBalance()
  // const funderWallet = await getFunderWallet({ logger: baseLogger })

  // if (!!finalBalance) {
  //   const request = await funderWallet.addInvoice({ value: finalBalance })
  //   await userWallet1.pay({ invoice: request })
  // }

  // await User.findOneAndRemove({ _id: userWallet1.uid })



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


const createInvoiceHash = () => {
  const randomSecret = () => randomBytes(32);
  const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');
  const secret = randomSecret();
  const id = sha256(secret);
  return {id, secret: secret.toString('hex')}
}

const functionToTests = [
  { 
    name: "getFee + pay",
    fn: function fn(wallet) {
      return (input) => {
        wallet.getLightningFee(input);
        return wallet.pay(input)
      }
    }
  },
  {
    name: "direct pay",
    fn: function fn(wallet) {
      return (input) => {
        return wallet.pay(input)
      }
    },
  }
]

functionToTests.forEach(({fn, name}) => {
  it(`simple payInvoice ${name}`, async () => {
    const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: amountInvoice })
    const result = await fn(userWallet1)({ invoice: request })
    expect(result).toBe("success")
  
    const finalBalance = await userWallet1.getBalance()
    expect(finalBalance).toBe(initBalance1 - amountInvoice)
  })

  // it(`fails when repaying invoice ${name}`, async () => {
  //   const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: amountInvoice })
  //   await fn(userWallet1)({ invoice: request })
  //   const result = await fn(userWallet1)({ invoice: request })
  //   expect(result).toBe("already_paid")
  
  //   const finalBalance = await userWallet1.getBalance()
  //   expect(finalBalance).toBe(initBalance1 - amountInvoice)
  // })

  it(`payInvoice with High CLTV Delta ${name}`, async () => {
    const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: amountInvoice, cltv_delta: 200 })
    const result = await await fn(userWallet1)({ invoice: request })
    expect(result).toBe("success")
    const finalBalance = await userWallet1.getBalance()
    expect(finalBalance).toBe(initBalance1 - amountInvoice)
  })

  it(`payInvoiceToAnotherGaloyUser ${name}`, async () => {
    const memo = "my memo as a payer"

    const paymentOtherGaloyUser = async ({walletPayer, walletPayee}) => {
      const payerInitialBalance = await walletPayer.getBalance()
      const payeeInitialBalance = await walletPayee.getBalance()

      const request = await walletPayee.addInvoice({ value: amountInvoice })
      await fn(walletPayer)({ invoice: request, memo })
  
      const payerFinalBalance = await walletPayer.getBalance()
      const payeeFinalBalance = await walletPayee.getBalance()
  
      expect(payerFinalBalance).toBe(payerInitialBalance - amountInvoice)
      expect(payeeFinalBalance).toBe(payeeInitialBalance + amountInvoice)
  
      const hash = getHash(request)
      const matchTx = tx => tx.type === 'on_us' && tx.hash === hash
  
      const user2Txn = await walletPayee.getTransactions()
      const user2OnUsTxn = user2Txn.filter(matchTx)
      expect(user2OnUsTxn[0].type).toBe('on_us')
      await checkIsBalanced()
  
      const user1Txn = await walletPayer.getTransactions()
      const user1OnUsTxn = user1Txn.filter(matchTx)
      expect(user1OnUsTxn[0].type).toBe('on_us')
  
      // making request twice because there is a cancel state, and this should be re-entrant
      expect(await walletPayer.updatePendingInvoice({ hash })).toBeTruthy()
      expect(await walletPayee.updatePendingInvoice({ hash })).toBeTruthy()
      expect(await walletPayer.updatePendingInvoice({ hash })).toBeTruthy()
      expect(await walletPayee.updatePendingInvoice({ hash })).toBeTruthy()
    }

    const init_cashback = await InvoiceUser.countDocuments({cashback: true})
    
    // a cashback tx
    await paymentOtherGaloyUser({walletPayee: userWallet2, walletPayer: userWallet1})
    
    if (process.env.CASHBACK) {
      expect(await InvoiceUser.countDocuments({cashback: true})).toBe(init_cashback + 1)
    }
    
    // a cashback tx
    await paymentOtherGaloyUser({walletPayee: userWallet2, walletPayer: userWallet0})
    
    if (process.env.CASHBACK) {
      expect(await InvoiceUser.countDocuments({cashback: true})).toBe(init_cashback + 2)
    }
    
    // not a cashback transaction
    await paymentOtherGaloyUser({walletPayee: userWallet1, walletPayer: userWallet2})
    if (process.env.CASHBACK) {
      expect(await InvoiceUser.countDocuments({cashback: true})).toBe(init_cashback + 2)
    }
    

    userWallet0 = await getUserWallet(0)
    userWallet1 = await getUserWallet(1)
    userWallet2 = await getUserWallet(2)

    expect(userWallet0.user.contacts.length).toBe(1)
    expect(userWallet0.user.contacts[0]).toHaveProperty("id", userWallet2.user.username)
    
    if (process.env.CASHBACK) {
      const tx_count = await Transaction.countDocuments()
      const adminWallet = new AdminWallet()
      await adminWallet.payCashBack()
      expect(await Transaction.countDocuments()).toBe(tx_count + 4)
    }

  })

  it(`payInvoice to lnd outside2 ${name}`, async () => {
    const { request } = await lnService.createInvoice({ lnd: lndOutside2, tokens: amountInvoice, is_including_private_channels: true })
    
    const initialBalance = await userWallet1.getBalance()
    
    const result = await fn(userWallet1)({ invoice: request, memo: "pay an unconnected node" })

    expect(result).toBe("success")
    const finalBalance = await userWallet1.getBalance()
    
    // const { id } = await lnService.decodePaymentRequest({ lnd: lndOutside2, request })
    // const { results: [{ fee }] } = await MainBook.ledger({ account: userWallet1.accountPath, hash: id })
    // ^^^^ this fetch the wrong transaction
    
    // TODO: have a way to do this more programatically?
    // base rate: 1, fee Rate: 1
    const fee = 2
  
    expect(finalBalance).toBe(initialBalance - amountInvoice - fee)
  })

  it(`pay hodl invoice ${name}`, async () => {
    const {id, secret} = createInvoiceHash()

    const { request } = await lnService.createHodlInvoice({ id, lnd: lndOutside1, tokens: amountInvoice });
    const result = await fn(userWallet1)({ invoice: request })

    expect(result).toBe("pending")
    const balanceBeforeSettlement = await userWallet1.getBalance()
    expect(balanceBeforeSettlement).toBe(initBalance1 - amountInvoice * (1 + FEECAP))
    // FIXME: necessary to not have openHandler ?
    // https://github.com/alexbosworth/ln-service/issues/122
    await lnService.settleHodlInvoice({ lnd: lndOutside1, secret });

    await sleep(5000)

    const finalBalance = await userWallet1.getBalance()
    expect(finalBalance).toBe(initBalance1 - amountInvoice)
  }, 60000)

  it(`don't settle hodl invoice`, async () => {
    const {id} = createInvoiceHash()

    const { request } = await lnService.createHodlInvoice({ id, lnd: lndOutside1, tokens: amountInvoice });
    const result = await fn(userWallet1)({ invoice: request })
    
    expect(result).toBe("pending")
    console.log("payment has timeout. status is pending.")

    const intermediateBalance = await userWallet1.getBalance()
    expect(intermediateBalance).toBe(initBalance1 - (amountInvoice * (1 + FEECAP)))

    await lnService.cancelHodlInvoice({ id, lnd: lndOutside1 });

    // making sure it's propagating back to lnd0.
    // use an event to do it deterministically
    await sleep(5000)
    // await userWallet1.updatePendingPayments()

    const finalBalance = await userWallet1.getBalance()
    expect(finalBalance).toBe(initBalance1)
  }, 60000)

})

it(`fails to pay when user has insufficient balance`, async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: initBalance1 + 1000000 })
  //FIXME: Check exact error message also
  await expect(userWallet1.pay({ invoice: request })).rejects.toThrow()
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

  const dbSetSpy = jest.spyOn(Lightning, 'delay').mockImplementation(() => ({value: 1, unit: 'seconds', "additional_delay_value": 0}))

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

  await sleep(1000)
    
  expect(await InvoiceUser.countDocuments({_id: id})).toBe(0)
  
  try {
    const { lnd } = lnService.authenticatedLndGrpc(getAuth())
    await lnService.getInvoice({ lnd, id })
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

it('payInvoice_ToAnotherGaloyUserWithMemo', async () => {
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

it('payInvoice_ToAnotherGaloyUserWith2DifferentMemo', async () => {
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
  const userTransaction0 = await userWallet0.getTransactions()
  const finalBalance1 = await userWallet1.getBalance()
  const userTransaction1 = await userWallet1.getTransactions()
  
  expect(res).toBe("success")
  expect(finalBalance0).toBe(initBalance0 + amountInvoice)
  expect(finalBalance1).toBe(initBalance1 - amountInvoice)

  expect(userTransaction0[0]).toHaveProperty("username", userWallet1.user.username)
  expect(userTransaction0[0]).toHaveProperty("description", `from ${userWallet1.user.username}`)
  expect(userTransaction1[0]).toHaveProperty("username", userWallet0.user.username)
  expect(userTransaction1[0]).toHaveProperty("description", `to ${userWallet0.user.username}`)

  userWallet0 = await getUserWallet(0)
  userWallet1 = await getUserWallet(1)

  expect(userWallet0.user.contacts[userWallet0.user.contacts.length - 1]).toHaveProperty("id", userWallet1.user.username)
  expect(userWallet1.user.contacts[userWallet1.user.contacts.length - 1]).toHaveProperty("id", userWallet0.user.username)

  await checkIsBalanced()
})

it('onUs pushPayment error for same user', async () => {
  const destination = await userWallet0.getNodePubkey()
  await expect(userWallet0.pay({ destination, username, amount: amountInvoice })).rejects.toThrow()
  await checkIsBalanced()
})

// it('pushPayment payment other node', async () => {

// })

// it('pushPayment receipt other node', async () => {

// })

it('fails to pay when channel capacity exceeded', async () => {
  const { request } = await lnService.createInvoice({ lnd: lndOutside1, tokens: 15000000 })
  await expect(userWallet1.pay({ invoice: request })).rejects.toThrow()
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