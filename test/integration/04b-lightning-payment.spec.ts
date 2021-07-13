/**
 * @jest-environment node
 */
import { createHash, randomBytes } from "crypto"
import {
  cancelHodlInvoice,
  closeChannel,
  createHodlInvoice,
  createInvoice,
  decodePaymentRequest,
  getChannels,
  pay,
  settleHodlInvoice,
} from "lightning"
import { yamlConfig } from "src/config"
import { FEECAP } from "src/lndAuth"
import { getActiveLnd, nodesPubKey } from "src/lndUtils"
import { setupMongoConnection } from "src/mongodb"
import { InvoiceUser, Transaction } from "src/schema"
import { getHash, sleep } from "src/utils"
import {
  checkIsBalanced,
  getUserWallet,
  lnd1,
  lndOutside1,
  lndOutside2,
  mockGetExchangeBalance,
  openChannelTesting,
} from "test/helpers"

let userWallet0, userWallet1, userWallet2
let initBalance0, initBalance1

const amountInvoice = 1000

jest.mock("src/notifications/notification")
jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))

const date = Date.now() + 1000 * 60 * 60 * 24 * 8

jest.spyOn(global.Date, "now").mockImplementation(() => new Date(date).valueOf())

beforeAll(async () => {
  await setupMongoConnection()
  mockGetExchangeBalance()

  userWallet0 = await getUserWallet(0)
  userWallet1 = await getUserWallet(1)
  userWallet2 = await getUserWallet(2)
})

beforeEach(async () => {
  ;({ BTC: initBalance0 } = await userWallet0.getBalances())
  ;({ BTC: initBalance1 } = await userWallet1.getBalances())
  await userWallet2.getBalances()

  jest.clearAllMocks()
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks()
  // remove direct connection between lndoutside1 and lndoutside2
})

it("addInvoice", async () => {
  const request = await userWallet1.addInvoice({ value: 1000 })
  expect(request.startsWith("lnbcrt10")).toBeTruthy()
  const { uid } = await InvoiceUser.findById(getHash(request))
  expect(String(uid)).toBe(String(userWallet1.user._id))
})

it("addPublicInvoice", async () => {
  const request = await userWallet1.addInvoice({ selfGenerated: false })
  expect(request.startsWith("lnbcrt1")).toBeTruthy()
  const { uid, selfGenerated } = await InvoiceUser.findById(getHash(request))
  expect(String(uid)).toBe(String(userWallet1.user._id))
  expect(selfGenerated).toBe(false)
})

it("addInvoiceWithNoAmount", async () => {
  const request = await userWallet2.addInvoice({})
  const { uid } = await InvoiceUser.findById(getHash(request))
  expect(String(uid)).toBe(String(userWallet2.user._id))
})

it("receivesPaymentFromOutside", async () => {
  const memo = "myMemo"

  // larger amount to not fall below the escrow limit
  const amount = 50000

  const request = await userWallet1.addInvoice({ value: amount, memo })
  await pay({ lnd: lndOutside1, request })
  const { BTC: finalBalance } = await userWallet1.getBalances()
  expect(finalBalance).toBe(initBalance1 + amount)

  const hash = getHash(request)

  const mongotx = await Transaction.findOne({ hash })
  expect(mongotx.memo).toBe(memo)

  expect(await userWallet1.updatePendingInvoice({ hash })).toBeTruthy()
  expect(await userWallet1.updatePendingInvoice({ hash })).toBeTruthy()
})

const createInvoiceHash = () => {
  const randomSecret = () => randomBytes(32)
  const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex")
  const secret = randomSecret()
  const id = sha256(secret)
  return { id, secret: secret.toString("hex") }
}

const functionToTests = [
  {
    name: "getFeeAndPay",
    initialFee: 0,
    fn: function fn(wallet) {
      return async (input) => {
        await wallet.getLightningFee(input)
        return wallet.pay(input)
      }
    },
  },
  {
    name: "directPay",
    initialFee: FEECAP,
    fn: function fn(wallet) {
      return async (input) => {
        return wallet.pay(input)
      }
    },
  },
]

functionToTests.forEach(({ fn, name, initialFee }) => {
  it(`simple payInvoice ${name}`, async () => {
    const { request } = await createInvoice({ lnd: lndOutside1, tokens: amountInvoice })
    const result = await fn(userWallet1)({ invoice: request })
    expect(result).toBe("success")

    const { BTC: finalBalance } = await userWallet1.getBalances()
    expect(finalBalance).toBe(initBalance1 - amountInvoice)
  })

  it(`fails when repaying invoice ${name}`, async () => {
    const { request } = await createInvoice({ lnd: lndOutside1, tokens: amountInvoice })
    await fn(userWallet1)({ invoice: request })
    const intermediateBalance = await userWallet1.getBalances()
    const result = await fn(userWallet1)({ invoice: request })
    expect(result).toBe("already_paid")

    const finalBalance = await userWallet1.getBalances()
    expect(finalBalance).toStrictEqual(intermediateBalance)
  })

  it(`payInvoice with High CLTV Delta ${name}`, async () => {
    const { request } = await createInvoice({
      lnd: lndOutside1,
      tokens: amountInvoice,
      cltv_delta: 200,
    })
    const result = await await fn(userWallet1)({ invoice: request })
    expect(result).toBe("success")
    const { BTC: finalBalance } = await userWallet1.getBalances()
    expect(finalBalance).toBe(initBalance1 - amountInvoice)
  })

  it(`payInvoiceToAnotherGaloyUser-${name}`, async () => {
    const memo = "my memo as a payer"

    const paymentOtherGaloyUser = async ({ walletPayer, walletPayee }) => {
      const { BTC: payerInitialBalance } = await walletPayer.getBalances()
      const { BTC: payeeInitialBalance } = await walletPayee.getBalances()

      const request = await walletPayee.addInvoice({ value: amountInvoice })
      await fn(walletPayer)({ invoice: request, memo })

      const { BTC: payerFinalBalance } = await walletPayer.getBalances()
      const { BTC: payeeFinalBalance } = await walletPayee.getBalances()

      expect(payerFinalBalance).toBe(payerInitialBalance - amountInvoice)
      expect(payeeFinalBalance).toBe(payeeInitialBalance + amountInvoice)

      const hash = getHash(request)
      const matchTx = (tx) => tx.type === "on_us" && tx.hash === hash

      const user2Txn = await walletPayee.getTransactions()
      const user2OnUsTxn = user2Txn.filter(matchTx)
      expect(user2OnUsTxn[0].type).toBe("on_us")
      await checkIsBalanced()

      const user1Txn = await walletPayer.getTransactions()
      const user1OnUsTxn = user1Txn.filter(matchTx)
      expect(user1OnUsTxn[0].type).toBe("on_us")

      // making request twice because there is a cancel state, and this should be re-entrant
      expect(await walletPayer.updatePendingInvoice({ hash })).toBeTruthy()
      expect(await walletPayee.updatePendingInvoice({ hash })).toBeTruthy()
      expect(await walletPayer.updatePendingInvoice({ hash })).toBeTruthy()
      expect(await walletPayee.updatePendingInvoice({ hash })).toBeTruthy()
    }

    await paymentOtherGaloyUser({ walletPayee: userWallet2, walletPayer: userWallet1 })
    await paymentOtherGaloyUser({ walletPayee: userWallet2, walletPayer: userWallet0 })
    await paymentOtherGaloyUser({ walletPayee: userWallet1, walletPayer: userWallet2 })

    // jest.mock("src/lndAuth", () => ({
    //   // remove first lnd so that ActiveLnd return the second lnd
    //   params: jest
    //     .fn()
    //     .mockReturnValueOnce(addProps(inputs.shift()))
    // }))
    // await paymentOtherGaloyUser({walletPayee: userWallet1, walletPayer: userWallet2})

    userWallet0 = await getUserWallet(0)
    userWallet1 = await getUserWallet(1)
    userWallet2 = await getUserWallet(2)

    expect(userWallet0.user.contacts.length).toBe(1)
    expect(userWallet0.user.contacts[0]).toHaveProperty("id", userWallet2.user.username)
  })

  it(`payInvoice to lnd outside2 ${name}`, async () => {
    const { request } = await createInvoice({
      lnd: lndOutside2,
      tokens: amountInvoice,
      is_including_private_channels: true,
    })

    const { BTC: initialBalance } = await userWallet1.getBalances()

    const result = await fn(userWallet1)({
      invoice: request,
      memo: "pay an unconnected node",
    })

    expect(result).toBe("success")
    const { BTC: finalBalance } = await userWallet1.getBalances()

    // const { id } = await decodePaymentRequest({ lnd: lndOutside2, request })
    // const { results: [{ fee }] } = await MainBook.ledger({ account: userWallet1.accountPath, hash: id })
    // ^^^^ this fetch the wrong transaction

    // TODO: have a way to do this more programatically?
    // base rate: 1, fee Rate: 1
    const fee = 2

    expect(finalBalance).toBe(initialBalance - amountInvoice - fee)
  })

  it(`payHodlInvoice-${name}`, async () => {
    const { id, secret } = createInvoiceHash()

    const { request } = await createHodlInvoice({
      id,
      lnd: lndOutside1,
      tokens: amountInvoice,
    })
    const result = await fn(userWallet1)({ invoice: request })

    expect(result).toBe("pending")
    const { BTC: balanceBeforeSettlement } = await userWallet1.getBalances()
    expect(balanceBeforeSettlement).toBe(initBalance1 - amountInvoice * (1 + initialFee))

    // FIXME: necessary to not have openHandler ?
    // https://github.com/alexbosworth/ln-service/issues/122
    await settleHodlInvoice({ lnd: lndOutside1, secret })

    await sleep(5000)

    const { BTC: finalBalance } = await userWallet1.getBalances()
    expect(finalBalance).toBe(initBalance1 - amountInvoice)
  }, 60000)

  it(`don't settle hodl invoice ${name}`, async () => {
    const { id } = createInvoiceHash()

    const { request } = await createHodlInvoice({
      id,
      lnd: lndOutside1,
      tokens: amountInvoice,
    })
    const result = await fn(userWallet1)({ invoice: request })

    expect(result).toBe("pending")
    console.log("payment has timeout. status is pending.")

    const { BTC: intermediateBalance } = await userWallet1.getBalances()
    expect(intermediateBalance).toBe(initBalance1 - amountInvoice * (1 + initialFee))

    await cancelHodlInvoice({ id, lnd: lndOutside1 })

    // making sure it's propagating back to lnd0.
    // use an event to do it deterministically
    await sleep(5000)
    // await userWallet1.updatePendingPayments()

    const { BTC: finalBalance } = await userWallet1.getBalances()
    expect(finalBalance).toBe(initBalance1)
  }, 60000)
})

it(`fails to pay when user has insufficient balance`, async () => {
  const { request } = await createInvoice({
    lnd: lndOutside1,
    tokens: initBalance1 + 1000000,
  })
  //FIXME: Check exact error message also
  await expect(userWallet1.pay({ invoice: request })).rejects.toThrow()
})

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Lightning = require("src/Lightning")

it("expired payment", async () => {
  const memo = "payment that should expire"

  jest
    .spyOn(Lightning, "delay")
    .mockImplementation(() => ({ value: 1, unit: "seconds", additional_delay_value: 0 }))

  const { lnd } = getActiveLnd()

  const request = await userWallet1.addInvoice({ value: amountInvoice, memo })
  const { id } = await decodePaymentRequest({ lnd, request })
  expect(await InvoiceUser.countDocuments({ _id: id })).toBe(1)

  // is deleting the invoice the same as when as invoice expired?
  // const res = await cancelHodlInvoice({ lnd, id })
  // console.log({res}, "cancelHodlInvoice result")

  await sleep(5000)

  // hacky way to test if an invoice has expired
  // without having to to have a big timeout.
  // let i = 30
  // let hasExpired = false
  // while (i > 0 || hasExpired) {
  //   try {
  //     console.log({i}, "get invoice start")
  //     const res = await getInvoice({ lnd, id })
  //     console.log({res, i}, "has expired?")
  //   } catch (err) {
  //     console.log({err})
  //   }
  //   i--
  //   await sleep(1000)
  // }

  // try {
  //   await pay({ lnd: lndOutside1, request })
  // } catch (err) {
  //   console.log({err}, "error paying expired/cancelled invoice (that is intended)")
  // }

  // await expect(pay({ lnd: lndOutside1, request })).rejects.toThrow()

  // await sleep(1000)

  await userWallet1.getBalances()

  // FIXME: test is failing.
  // lnd doens't always delete invoice just after they have expired

  // expect(await InvoiceUser.countDocuments({_id: id})).toBe(0)

  // try {
  //   await getInvoice({ lnd, id })
  // } catch (err) {
  //   console.log({err}, "invoice should not exist any more")
  // }

  // expect(await userWallet1.updatePendingInvoice({ hash: id })).toBeFalsy()
}, 150000)

it("fails to pay when user has insufficient balance", async () => {
  const { request } = await createInvoice({
    lnd: lndOutside1,
    tokens: initBalance1 + 1000000,
  })
  //FIXME: Check exact error message also
  await expect(userWallet1.pay({ invoice: request })).rejects.toThrow()
})

it("payInvoice_ToAnotherGaloyUserWithMemo", async () => {
  const memo = "invoiceMemo"

  const request = await userWallet1.addInvoice({ value: amountInvoice, memo })
  await userWallet2.pay({ invoice: request })

  const matchTx = (tx) => tx.type === "on_us" && tx.hash === getHash(request)

  const user1Txn = await userWallet1.getTransactions()
  expect(user1Txn.filter(matchTx)[0].description).toBe(memo)
  expect(user1Txn.filter(matchTx)[0].type).toBe("on_us")

  const user2Txn = await userWallet2.getTransactions()
  expect(user2Txn.filter(matchTx)[0].description).toBe(memo)
  expect(user2Txn.filter(matchTx)[0].type).toBe("on_us")
})

it("payInvoice_ToAnotherGaloyUserWith2DifferentMemo", async () => {
  const memo = "invoiceMemo"
  const memoPayer = "my memo as a payer"

  const request = await userWallet2.addInvoice({ value: amountInvoice, memo })
  await userWallet1.pay({ invoice: request, memo: memoPayer })

  const matchTx = (tx) => tx.type === "on_us" && tx.hash === getHash(request)

  const user2Txn = await userWallet2.getTransactions()
  expect(user2Txn.filter(matchTx)[0].description).toBe(memo)
  expect(user2Txn.filter(matchTx)[0].type).toBe("on_us")

  const user1Txn = await userWallet1.getTransactions()
  expect(user1Txn.filter(matchTx)[0].description).toBe(memoPayer)
  expect(user1Txn.filter(matchTx)[0].type).toBe("on_us")
})

it("payInvoiceToSelf", async () => {
  const invoice = await userWallet1.addInvoice({ value: 1000, memo: "self payment" })
  await expect(userWallet1.pay({ invoice })).rejects.toThrow()
})

it("negative amount should be rejected", async () => {
  const destination = nodesPubKey[0]
  expect(
    userWallet1.pay({
      destination,
      username: userWallet0.user.username,
      amount: -amountInvoice,
    }),
  ).rejects.toThrow()
})

it("onUs pushPayment", async () => {
  const destination = nodesPubKey[0]
  const res = await userWallet1.pay({
    destination,
    username: userWallet0.user.username,
    amount: amountInvoice,
  })

  const { BTC: finalBalance0 } = await userWallet0.getBalances()
  const userTransaction0 = await userWallet0.getTransactions()
  const { BTC: finalBalance1 } = await userWallet1.getBalances()
  const userTransaction1 = await userWallet1.getTransactions()

  expect(res).toBe("success")
  expect(finalBalance0).toBe(initBalance0 + amountInvoice)
  expect(finalBalance1).toBe(initBalance1 - amountInvoice)

  expect(userTransaction0[0]).toHaveProperty("username", userWallet1.user.username)
  expect(userTransaction0[0]).toHaveProperty(
    "description",
    `from ${userWallet1.user.username}`,
  )
  expect(userTransaction1[0]).toHaveProperty("username", userWallet0.user.username)
  expect(userTransaction1[0]).toHaveProperty(
    "description",
    `to ${userWallet0.user.username}`,
  )

  userWallet0 = await getUserWallet(0)
  userWallet1 = await getUserWallet(1)

  expect(userWallet0.user.contacts[userWallet0.user.contacts.length - 1]).toHaveProperty(
    "id",
    userWallet1.user.username,
  )
  expect(userWallet1.user.contacts[userWallet1.user.contacts.length - 1]).toHaveProperty(
    "id",
    userWallet0.user.username,
  )

  await checkIsBalanced()
})

it("onUs pushPayment error for same user", async () => {
  const destination = nodesPubKey[0]
  await expect(
    userWallet0.pay({
      destination,
      username: userWallet0.user.username,
      amount: amountInvoice,
    }),
  ).rejects.toThrow()
  await checkIsBalanced()
})

// it('pushPayment payment other node', async () => {

// })

// it('pushPayment receipt other node', async () => {

// })

it("fails to pay when channel capacity exceeded", async () => {
  const { request } = await createInvoice({ lnd: lndOutside1, tokens: 15000000 })
  await expect(userWallet1.pay({ invoice: request })).rejects.toThrow()
})

it("if fee are too high, payment is cancelled", async () => {
  // TODO
})

it("paysZeroAmountInvoice", async () => {
  const { request } = await createInvoice({ lnd: lndOutside1 })
  const { BTC: initialBalance } = await userWallet1.getBalances()
  const result = await userWallet1.pay({ invoice: request, amount: amountInvoice })
  expect(result).toBe("success")
  const { BTC: finalBalance } = await userWallet1.getBalances()
  expect(finalBalance).toBe(initialBalance - amountInvoice)
})

it("receive zero amount invoice", async () => {
  const { BTC: initialBalance } = await userWallet1.getBalances()
  const invoice = await userWallet1.addInvoice({})
  await pay({ lnd: lndOutside1, request: invoice, tokens: amountInvoice })
  const { BTC: finalBalance } = await userWallet1.getBalances()
  expect(finalBalance).toBe(initialBalance + amountInvoice)
})

it("fails to pay zero amt invoice without separate amt", async () => {
  const { request } = await createInvoice({ lnd: lndOutside1 })
  await expect(userWallet1.pay({ invoice: request })).rejects.toThrow()
})

it("fails to pay regular invoice with separate amt", async () => {
  const { request } = await createInvoice({ lnd: lndOutside1, tokens: amountInvoice })
  await expect(
    userWallet1.pay({ invoice: request, amount: amountInvoice }),
  ).rejects.toThrow()
})

it("fails to pay when withdrawalLimit exceeded", async () => {
  const { request } = await createInvoice({ lnd: lndOutside1, tokens: 2e6 })
  await expect(userWallet0.pay({ invoice: request })).rejects.toThrow()
})

it("fails to pay when amount exceeds onUs limit", async () => {
  const level1Limit = yamlConfig.limits.onUs.level["1"]
  const request = await userWallet1.addInvoice({ value: level1Limit + 1 })
  await expect(userWallet0.pay({ invoice: request })).rejects.toThrow()
})

// it('testDbTransaction', async () => {
//   //TODO try to fetch simulataneously (ie: with Premise.all[])
//   // balances with pending but settled transaction to see if
//   // we can create a race condition in the DB
// })

it("close channel (related to fee calculation in 09f)", async () => {
  const { channels } = await getChannels({ lnd: lndOutside2 })
  await closeChannel({ lnd: lndOutside2, id: channels[channels.length - 1].id })

  // open channel from lnd1 to lndOutside2
  // So that we have a route from lndOutside 1 to lndOutside2 via lnd1
  const socket = `lnd-outside-2:9735`
  await openChannelTesting({ lnd: lnd1, other_lnd: lndOutside2, socket })
})

// it(`test123`, async () => {
//   const fn = function fn(wallet) {
//     return async (input) => {
//       return wallet.pay(input)
//     }
//   }

//   const memo = "my memo as a payer"

//   const paymentOtherGaloyUser = async ({walletPayer, walletPayee}) => {
//     const {BTC: payerInitialBalance} = await walletPayer.getBalances()
//     const {BTC: payeeInitialBalance} = await walletPayee.getBalances()

//     const request = await walletPayee.addInvoice({ value: amountInvoice })
//     await fn(walletPayer)({ invoice: request, memo })

//     const {BTC: payerFinalBalance} = await walletPayer.getBalances()
//     const {BTC: payeeFinalBalance} = await walletPayee.getBalances()

//     expect(payerFinalBalance).toBe(payerInitialBalance - amountInvoice)
//     expect(payeeFinalBalance).toBe(payeeInitialBalance + amountInvoice)

//     const hash = getHash(request)
//     const matchTx = tx => tx.type === 'on_us' && tx.hash === hash

//     const user2Txn = await walletPayee.getTransactions()
//     const user2OnUsTxn = user2Txn.filter(matchTx)
//     expect(user2OnUsTxn[0].type).toBe('on_us')
//     await checkIsBalanced()

//     const user1Txn = await walletPayer.getTransactions()
//     const user1OnUsTxn = user1Txn.filter(matchTx)
//     expect(user1OnUsTxn[0].type).toBe('on_us')

//     // making request twice because there is a cancel state, and this should be re-entrant
//     expect(await walletPayer.updatePendingInvoice({ hash })).toBeTruthy()
//     expect(await walletPayee.updatePendingInvoice({ hash })).toBeTruthy()
//     expect(await walletPayer.updatePendingInvoice({ hash })).toBeTruthy()
//     expect(await walletPayee.updatePendingInvoice({ hash })).toBeTruthy()
//   }

//   jest.mock("src/lndAuth", () => ({
//     // remove first lnd so that ActiveLnd return the second lnd
//     params: jest
//       .fn()
//       .mockReturnValueOnce(addProps(inputs.shift()))
//   }))
//   await paymentOtherGaloyUser({walletPayee: userWallet1, walletPayer: userWallet2})

// })
