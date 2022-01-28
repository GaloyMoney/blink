import { createHash, randomBytes } from "crypto"

import { Wallets } from "@app"
import { getUserLimits } from "@config"
import { FEECAP_PERCENT, toSats } from "@domain/bitcoin"
import {
  LightningServiceError,
  PaymentSendStatus,
  PaymentStatus,
} from "@domain/bitcoin/lightning"
import {
  InsufficientBalanceError as DomainInsufficientBalanceError,
  LimitsExceededError,
  SelfPaymentError as DomainSelfPaymentError,
  ValidationError,
} from "@domain/errors"
import { TwoFAError } from "@domain/twoFA"
import { PaymentInitiationMethod } from "@domain/wallets"
import { LedgerService } from "@services/ledger"
import { getActiveLnd, getInvoiceAttempt } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { LnPaymentsRepository, WalletInvoicesRepository } from "@services/mongoose"
import { WalletInvoice } from "@services/mongoose/schema"
import { LndService } from "@services/lnd"

import { sleep } from "@utils"

import { updateLnPayments } from "@app/lightning"
import { delete2fa } from "@app/users"

import {
  cancelHodlInvoice,
  checkIsBalanced,
  createHodlInvoice,
  createInvoice,
  decodePaymentRequest,
  enable2FA,
  generateTokenHelper,
  getInvoice,
  lndOutside1,
  lndOutside2,
  settleHodlInvoice,
  waitFor,
  waitUntilChannelBalanceSyncAll,
  getHash,
  getUserIdByTestUserIndex,
  getDefaultWalletIdByTestUserIndex,
  getUserRecordByTestUserIndex,
  createUserWallet,
  getAccountIdByTestUserIndex,
  getAccountByTestUserIndex,
} from "test/helpers"
import { getBTCBalance, getRemainingTwoFALimit } from "test/helpers/wallet"

const date = Date.now() + 1000 * 60 * 60 * 24 * 8
// required to avoid withdrawal limits validation
jest.spyOn(global.Date, "now").mockImplementation(() => new Date(date).valueOf())

let initBalance0, initBalance1
const amountInvoice = 1000
const userLimits = getUserLimits({ level: 1 })

const invoicesRepo = WalletInvoicesRepository()
let userType0: UserRecord

let userId0: UserId

let account0: Account
let accountId1: AccountId
let account1: Account
let account2: Account

let walletId0: WalletId
let walletId1: WalletId
let walletId2: WalletId

let username0: Username
let username1: Username
let username2: Username

beforeAll(async () => {
  await createUserWallet(0)
  await createUserWallet(1)
  await createUserWallet(2)

  userId0 = await getUserIdByTestUserIndex(0)

  account0 = await getAccountByTestUserIndex(0)
  accountId1 = await getAccountIdByTestUserIndex(1)
  account1 = await getAccountByTestUserIndex(1)
  account2 = await getAccountByTestUserIndex(2)

  walletId0 = await getDefaultWalletIdByTestUserIndex(0)
  walletId1 = await getDefaultWalletIdByTestUserIndex(1)
  walletId2 = await getDefaultWalletIdByTestUserIndex(2)

  userType0 = await getUserRecordByTestUserIndex(0)
  username0 = userType0.username as Username

  const userType1 = await getUserRecordByTestUserIndex(1)
  username1 = userType1.username as Username

  const userType2 = await getUserRecordByTestUserIndex(2)
  username2 = userType2.username as Username
})

beforeEach(async () => {
  initBalance0 = await getBTCBalance(walletId0)
  initBalance1 = await getBTCBalance(walletId1)
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe("UserWallet - Lightning Pay", () => {
  it("sends to another Galoy user with memo", async () => {
    const memo = "invoiceMemo"

    const lnInvoice = await Wallets.addInvoiceForSelf({
      walletId: walletId2 as WalletId,
      amount: toSats(amountInvoice),
      memo,
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: invoice } = lnInvoice

    let walletInvoice = await invoicesRepo.findByPaymentHash(lnInvoice.paymentHash)
    expect(walletInvoice).not.toBeInstanceOf(Error)
    if (walletInvoice instanceof Error) throw walletInvoice
    expect(walletInvoice.paid).toBeFalsy()

    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: invoice,
      memo: null,
      senderWalletId: walletId1,
      senderAccount: account1,
      logger: baseLogger,
    })
    if (paymentResult instanceof Error) throw paymentResult

    walletInvoice = await invoicesRepo.findByPaymentHash(lnInvoice.paymentHash)
    expect(walletInvoice).not.toBeInstanceOf(Error)
    if (walletInvoice instanceof Error) throw walletInvoice
    expect(walletInvoice.paid).toBeTruthy()

    const matchTx = (tx) =>
      tx.settlementVia.type === PaymentInitiationMethod.IntraLedger &&
      tx.initiationVia.paymentHash === getHash(invoice)

    let txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletId1,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const user1Txn = txResult.result
    expect(user1Txn.filter(matchTx)[0].deprecated.description).toBe(memo)
    expect(user1Txn.filter(matchTx)[0].settlementVia.type).toBe("intraledger")
    // expect(user1Txn.filter(matchTx)[0].recipientUsername).toBe("lily")

    txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletId1,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const user2Txn = txResult.result
    expect(user2Txn.filter(matchTx)[0].deprecated.description).toBe(memo)
    expect(user2Txn.filter(matchTx)[0].settlementVia.type).toBe("intraledger")
  })

  it("sends to another Galoy user with two different memos", async () => {
    const memo = "invoiceMemo"
    const memoPayer = "my memo as a payer"

    const lnInvoice = await Wallets.addInvoiceForSelf({
      walletId: walletId2 as WalletId,
      amount: toSats(amountInvoice),
      memo,
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: request } = lnInvoice

    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: request,
      memo: memoPayer,
      senderWalletId: walletId1,
      senderAccount: account1,
      logger: baseLogger,
    })
    if (paymentResult instanceof Error) throw paymentResult

    const matchTx = (tx) =>
      tx.settlementVia.type === PaymentInitiationMethod.IntraLedger &&
      tx.initiationVia.paymentHash === getHash(request)

    let txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletId2,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const user2Txn = txResult.result
    expect(user2Txn.filter(matchTx)[0].deprecated.description).toBe(memo)
    expect(user2Txn.filter(matchTx)[0].settlementVia.type).toBe("intraledger")

    txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletId1,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const user1Txn = txResult.result
    expect(user1Txn.filter(matchTx)[0].deprecated.description).toBe(memoPayer)
    expect(user1Txn.filter(matchTx)[0].settlementVia.type).toBe("intraledger")
  })

  it("sends to another Galoy user a push payment", async () => {
    const res = await Wallets.intraledgerPaymentSendUsername({
      recipientUsername: username0,
      memo: "",
      amount: toSats(amountInvoice),
      senderWalletId: walletId1,
      payerAccountId: accountId1,
      logger: baseLogger,
    })

    expect(res).not.toBeInstanceOf(Error)
    if (res instanceof Error) throw res

    const finalBalance0 = await getBTCBalance(walletId0)
    const { result: userTransaction0, error } = await Wallets.getTransactionsForWalletId({
      walletId: walletId0,
    })
    if (error instanceof Error || userTransaction0 === null) {
      throw error
    }

    const finalBalance1 = await getBTCBalance(walletId1)
    const txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletId1,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const userTransaction1 = txResult.result
    expect(res).toBe(PaymentSendStatus.Success)
    expect(finalBalance0).toBe(initBalance0 + amountInvoice)
    expect(finalBalance1).toBe(initBalance1 - amountInvoice)

    expect(userTransaction0[0].initiationVia).toHaveProperty(
      "counterPartyUsername",
      username1,
    )
    const oldFields0 = userTransaction0[0].deprecated
    expect(oldFields0).toHaveProperty("description", `from ${username1}`)
    expect(userTransaction1[0].initiationVia).toHaveProperty(
      "counterPartyUsername",
      username0,
    )
    const oldFields1 = userTransaction1[0].deprecated
    expect(oldFields1).toHaveProperty("description", `to ${username0}`)

    let userType0 = await getUserRecordByTestUserIndex(0)
    let userType1 = await getUserRecordByTestUserIndex(1)

    expect(userType0.contacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: username1 })]),
    )
    const contact0 = userType0.contacts.find(
      (userContact) => userContact.id === username1,
    )
    const txnCount0 = contact0?.transactionsCount || 0

    expect(userType1.contacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: username0 })]),
    )
    const contact1 = userType1.contacts.find(
      (userContact) => userContact.id === username0,
    )
    const txnCount1 = contact1?.transactionsCount || 0

    const res2 = await Wallets.intraledgerPaymentSendUsername({
      recipientUsername: username0,
      memo: "",
      amount: toSats(amountInvoice),
      senderWalletId: walletId1,
      payerAccountId: accountId1,
      logger: baseLogger,
    })
    expect(res2).not.toBeInstanceOf(Error)
    if (res2 instanceof Error) throw res2
    expect(res2).toBe(PaymentSendStatus.Success)

    userType0 = await getUserRecordByTestUserIndex(0)
    expect(userType0.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: username1,
          transactionsCount: txnCount0 + 1,
        }),
      ]),
    )
    userType1 = await getUserRecordByTestUserIndex(1)
    expect(userType1.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: username0,
          transactionsCount: txnCount1 + 1,
        }),
      ]),
    )
  })

  it("pay zero amount invoice", async () => {
    const { request } = await createInvoice({ lnd: lndOutside1 })
    const paymentResult = await Wallets.payNoAmountInvoiceByWalletId({
      paymentRequest: request as EncodedPaymentRequest,
      memo: null,
      amount: toSats(amountInvoice),
      senderWalletId: walletId1,
      senderAccount: account1,
      logger: baseLogger,
    })
    if (paymentResult instanceof Error) throw paymentResult
    expect(paymentResult).toBe(PaymentSendStatus.Success)

    const finalBalance = await getBTCBalance(walletId1)
    expect(finalBalance).toBe(initBalance1 - amountInvoice)
  })

  it("filters spam from send to another Galoy user as push payment", async () => {
    const satsBelow = 100
    const memoSpamBelowThreshold = "Spam BELOW threshold"
    const resBelowThreshold = await Wallets.intraledgerPaymentSendUsername({
      recipientUsername: username0,
      memo: memoSpamBelowThreshold,
      amount: toSats(satsBelow),
      senderWalletId: walletId1,
      payerAccountId: accountId1,
      logger: baseLogger,
    })
    expect(resBelowThreshold).not.toBeInstanceOf(Error)
    if (resBelowThreshold instanceof Error) throw resBelowThreshold

    const satsAbove = 1100
    const memoSpamAboveThreshold = "Spam ABOVE threshold"
    const resAboveThreshold = await Wallets.intraledgerPaymentSendUsername({
      recipientUsername: username0,
      memo: memoSpamAboveThreshold,
      amount: toSats(satsAbove),
      senderWalletId: walletId1,
      payerAccountId: accountId1,
      logger: baseLogger,
    })
    expect(resAboveThreshold).not.toBeInstanceOf(Error)
    if (resAboveThreshold instanceof Error) throw resAboveThreshold

    let txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletId0,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const userTransaction0 = txResult.result
    const transaction0Above = userTransaction0[0]
    const transaction0Below = userTransaction0[1]

    txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletId1,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const userTransaction1 = txResult.result
    const transaction1Above = userTransaction1[0]
    const transaction1Below = userTransaction1[1]

    // confirm both transactions succeeded
    expect(resBelowThreshold).toBe(PaymentSendStatus.Success)
    expect(resAboveThreshold).toBe(PaymentSendStatus.Success)

    // check below-threshold transaction for recipient was filtered
    expect(transaction0Below.initiationVia).toHaveProperty(
      "counterPartyUsername",
      username1,
    )
    expect(transaction0Below.deprecated).toHaveProperty(
      "description",
      `from ${username1}`,
    )
    expect(transaction1Below.initiationVia).toHaveProperty(
      "counterPartyUsername",
      username0,
    )
    expect(transaction1Below.deprecated).toHaveProperty(
      "description",
      memoSpamBelowThreshold,
    )

    // check above-threshold transaction for recipient was NOT filtered
    expect(transaction0Above.initiationVia).toHaveProperty(
      "counterPartyUsername",
      username1,
    )
    expect(transaction0Above.deprecated).toHaveProperty(
      "description",
      memoSpamAboveThreshold,
    )
    expect(transaction1Above.initiationVia).toHaveProperty(
      "counterPartyUsername",
      username0,
    )
    expect(transaction1Above.deprecated).toHaveProperty(
      "description",
      memoSpamAboveThreshold,
    )

    // check contacts being added
    const userType0 = await getUserRecordByTestUserIndex(0)
    const userType1 = await getUserRecordByTestUserIndex(1)

    expect(userType0.contacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: username1 })]),
    )

    expect(userType1.contacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: username0 })]),
    )
  })

  it("fails if sends to self", async () => {
    const lnInvoice = await Wallets.addInvoiceForSelf({
      walletId: walletId1 as WalletId,
      amount: toSats(amountInvoice),
      memo: "self payment",
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: invoice } = lnInvoice

    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: invoice,
      memo: null,
      senderWalletId: walletId1,
      senderAccount: account1,
      logger: baseLogger,
    })
    expect(paymentResult).toBeInstanceOf(DomainSelfPaymentError)
  })

  it("fails if sends to self an on us push payment", async () => {
    const paymentResult = await Wallets.intraledgerPaymentSendUsername({
      recipientUsername: username1,
      memo: "",
      amount: toSats(amountInvoice),
      senderWalletId: walletId1,
      payerAccountId: accountId1,
      logger: baseLogger,
    })
    expect(paymentResult).toBeInstanceOf(DomainSelfPaymentError)
  })

  it("fails when user has insufficient balance", async () => {
    const { request: invoice } = await createInvoice({
      lnd: lndOutside1,
      tokens: initBalance1 + 1000000,
    })
    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: invoice as EncodedPaymentRequest,
      memo: null,
      senderWalletId: walletId1,
      senderAccount: account1,
      logger: baseLogger,
    })
    await expect(paymentResult).toBeInstanceOf(DomainInsufficientBalanceError)
  })

  it("fails to pay when channel capacity exceeded", async () => {
    const { request } = await createInvoice({ lnd: lndOutside1, tokens: 1500000 })
    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: request as EncodedPaymentRequest,
      memo: null,
      senderWalletId: walletId0,
      senderAccount: account0,
      logger: baseLogger,
    })
    expect(paymentResult).toBeInstanceOf(LightningServiceError)
  })

  it("fails to pay zero amount invoice without separate amount", async () => {
    const { request } = await createInvoice({ lnd: lndOutside1 })
    // TODO: use custom ValidationError not apollo error
    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: request as EncodedPaymentRequest,
      memo: null,
      senderWalletId: walletId1,
      senderAccount: account1,
      logger: baseLogger,
    })
    expect(paymentResult).toBeInstanceOf(ValidationError)
  })

  it("fails to pay when withdrawalLimit exceeded", async () => {
    const { request } = await createInvoice({
      lnd: lndOutside1,
      tokens: userLimits.withdrawalLimit + 1,
    })
    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: request as EncodedPaymentRequest,
      memo: null,
      senderWalletId: walletId1,
      senderAccount: account1,
      logger: baseLogger,
    })
    expect(paymentResult).toBeInstanceOf(LimitsExceededError)
    const expectedError = `Cannot transfer more than ${userLimits.withdrawalLimit} sats in 24 hours`
    expect((paymentResult as Error).message).toBe(expectedError)
  })

  it("fails to pay when amount exceeds onUs limit", async () => {
    const lnInvoice = await Wallets.addInvoiceForSelf({
      walletId: walletId0 as WalletId,
      amount: toSats(userLimits.onUsLimit + 1),
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: request } = lnInvoice

    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: request as EncodedPaymentRequest,
      memo: null,
      senderWalletId: walletId1,
      senderAccount: account1,
      logger: baseLogger,
    })
    expect(paymentResult).toBeInstanceOf(LimitsExceededError)
    const expectedError = `Cannot transfer more than ${userLimits.onUsLimit} sats in 24 hours`
    expect((paymentResult as Error).message).toBe(expectedError)
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
      fn: function fn({ walletId, account }: { walletId: WalletId; account: Account }) {
        return async (input): Promise<PaymentSendStatus | ApplicationError> => {
          const feeFromProbe = await Wallets.getLightningFee({
            walletId: walletId,
            paymentRequest: input.invoice,
          })
          if (feeFromProbe instanceof Error) throw feeFromProbe
          const paymentResult = await Wallets.payInvoiceByWalletIdWithTwoFA({
            paymentRequest: input.invoice as EncodedPaymentRequest,
            memo: input.memo,
            senderWalletId: walletId,
            senderAccount: account,
            twoFAToken: input.twoFAToken || null,
            logger: baseLogger,
          })
          return paymentResult
        }
      },
    },
    {
      name: "directPay",
      initialFee: FEECAP_PERCENT,
      fn: function fn({ walletId, account }: { walletId: WalletId; account: Account }) {
        return async (input): Promise<PaymentSendStatus | ApplicationError> => {
          const paymentResult = await Wallets.payInvoiceByWalletIdWithTwoFA({
            paymentRequest: input.invoice as EncodedPaymentRequest,
            senderAccount: account,
            memo: input.memo,
            senderWalletId: walletId,
            twoFAToken: input.twoFAToken || null,
            logger: baseLogger,
          })
          return paymentResult
        }
      },
    },
  ]

  functionToTests.forEach(({ fn, name, initialFee }) => {
    describe(`${name}`, () => {
      it("pay invoice", async () => {
        const { request } = await createInvoice({
          lnd: lndOutside1,
          tokens: amountInvoice,
        })
        const result = await fn({ account: account1, walletId: walletId1 })({
          invoice: request,
        })
        if (result instanceof Error) throw result
        expect(result).toBe(PaymentSendStatus.Success)

        const finalBalance = await getBTCBalance(walletId1)
        expect(finalBalance).toBe(initBalance1 - amountInvoice)
      })

      it("fails when repaying invoice", async () => {
        const { request } = await createInvoice({
          lnd: lndOutside1,
          tokens: amountInvoice,
        })
        const intermediateResult = await fn({
          account: account1,
          walletId: walletId1,
        })({
          invoice: request,
        })
        if (intermediateResult instanceof Error) throw intermediateResult
        const intermediateBalanceSats = await getBTCBalance(walletId1)

        const result = await fn({ account: account1, walletId: walletId1 })({
          invoice: request,
        })
        if (result instanceof Error) throw result
        expect(result).toBe(PaymentSendStatus.AlreadyPaid)

        const finalBalanceSats = await getBTCBalance(walletId1)
        expect(finalBalanceSats).toEqual(intermediateBalanceSats)
      })

      it("pay invoice with High CLTV Delta", async () => {
        const { request } = await createInvoice({
          lnd: lndOutside1,
          tokens: amountInvoice,
          cltv_delta: 200,
        })
        const result = await fn({ account: account1, walletId: walletId1 })({
          invoice: request,
        })
        if (result instanceof Error) throw result
        expect(result).toBe(PaymentSendStatus.Success)
        const finalBalance = await getBTCBalance(walletId1)
        expect(finalBalance).toBe(initBalance1 - amountInvoice)
      })

      it("pay invoice to another Galoy user", async () => {
        const memo = "my memo as a payer"

        const paymentOtherGaloyUser = async ({
          walletIdPayer,
          accountPayer,
          walletIdPayee,
        }: {
          walletIdPayer: WalletId
          accountPayer: Account
          walletIdPayee: WalletId
        }) => {
          const payerInitialBalance = await getBTCBalance(walletIdPayer)
          const payeeInitialBalance = await getBTCBalance(walletIdPayee)

          const lnInvoice = await Wallets.addInvoiceForSelf({
            walletId: walletIdPayee as WalletId,
            amount: toSats(amountInvoice),
          })
          if (lnInvoice instanceof Error) throw lnInvoice
          const { paymentRequest: request } = lnInvoice
          const result = await fn({ account: accountPayer, walletId: walletIdPayer })({
            invoice: request,
            memo,
          })
          if (result instanceof Error) throw result

          const payerFinalBalance = await getBTCBalance(walletIdPayer)
          const payeeFinalBalance = await getBTCBalance(walletIdPayee)

          expect(payerFinalBalance).toBe(payerInitialBalance - amountInvoice)
          expect(payeeFinalBalance).toBe(payeeInitialBalance + amountInvoice)

          const hash = getHash(request)
          const matchTx = (tx) =>
            tx.settlementVia.type === PaymentInitiationMethod.IntraLedger &&
            tx.initiationVia.paymentHash === hash

          let txResult = await Wallets.getTransactionsForWalletId({
            walletId: walletIdPayee,
          })
          if (txResult.error instanceof Error || txResult.result === null) {
            throw txResult.error
          }
          const user2Txn = txResult.result
          const user2OnUsTxn = user2Txn.filter(matchTx)
          expect(user2OnUsTxn[0].settlementVia.type).toBe("intraledger")
          await checkIsBalanced()

          txResult = await Wallets.getTransactionsForWalletId({
            walletId: walletIdPayer as WalletId,
          })
          if (txResult.error instanceof Error || txResult.result === null) {
            throw txResult.error
          }
          const user1Txn = txResult.result
          const user1OnUsTxn = user1Txn.filter(matchTx)
          expect(user1OnUsTxn[0].settlementVia.type).toBe("intraledger")

          // making request twice because there is a cancel state, and this should be re-entrant
          expect(
            await Wallets.updatePendingInvoiceByPaymentHash({
              paymentHash: hash as PaymentHash,
              logger: baseLogger,
            }),
          ).not.toBeInstanceOf(Error)
          expect(
            await Wallets.updatePendingInvoiceByPaymentHash({
              paymentHash: hash as PaymentHash,
              logger: baseLogger,
            }),
          ).not.toBeInstanceOf(Error)
        }

        await paymentOtherGaloyUser({
          walletIdPayee: walletId2,
          walletIdPayer: walletId1,
          accountPayer: account1,
        })
        await paymentOtherGaloyUser({
          walletIdPayee: walletId2,
          walletIdPayer: walletId0,
          accountPayer: account0,
        })
        await paymentOtherGaloyUser({
          walletIdPayee: walletId1,
          walletIdPayer: walletId2,
          accountPayer: account2,
        })

        // jest.mock("@services/wallet0/auth", () => ({
        //   // remove first lnd so that ActiveLnd return the second lnd
        //   params: jest
        //     .fn()
        //     .mockReturnValueOnce(addProps(inputs.shift()))
        // }))
        // await paymentOtherGaloyUser({walletPayee: userWallet1, walletPayer: userWallet2})
        const userType0 = await getUserRecordByTestUserIndex(0)
        expect(userType0.contacts).toEqual(
          expect.not.arrayContaining([expect.objectContaining({ id: username2 })]),
        )
      })

      it("pay invoice to lnd outside2", async () => {
        const { request } = await createInvoice({
          lnd: lndOutside2,
          tokens: amountInvoice,
          is_including_private_channels: true,
        })

        const initialBalance = await getBTCBalance(walletId1)

        const result = await fn({ account: account1, walletId: walletId1 })({
          invoice: request,
          memo: "pay an unconnected node",
        })
        if (result instanceof Error) throw result

        // wait for balance updates because invoice event
        // arrives before wallet balances updates in lnd
        await waitUntilChannelBalanceSyncAll()

        expect(result).toBe(PaymentSendStatus.Success)
        const finalBalance = await getBTCBalance(walletId1)

        // const { id } = await decodePaymentRequest({ lnd: lndOutside2, request })
        // const { results: [{ fee }] } = await getAccountTransactions(userWallet1.user.walletPath, { hash: id })
        // ^^^^ this fetch the wrong transaction

        // TODO: have a way to do this more programmatically?
        // base rate: 1, fee Rate: 1
        const fee = 0

        expect(finalBalance).toBe(initialBalance - amountInvoice - fee)
      })

      it("pay hodl invoice & ln payments repo updates", async () => {
        const { id, secret } = createInvoiceHash()

        const { request } = await createHodlInvoice({
          id,
          lnd: lndOutside1,
          tokens: amountInvoice,
        })
        const result = await fn({ account: account1, walletId: walletId1 })({
          invoice: request,
        })
        if (result instanceof Error) throw result

        expect(result).toBe(PaymentSendStatus.Pending)
        const balanceBeforeSettlement = await getBTCBalance(walletId1)
        expect(balanceBeforeSettlement).toBe(
          initBalance1 - amountInvoice * (1 + initialFee),
        )

        const lnPaymentsRepo = LnPaymentsRepository()

        // Test 'lnpayment' is pending
        const lnPaymentOnPay = await lnPaymentsRepo.findByPaymentHash(id as PaymentHash)
        expect(lnPaymentOnPay).not.toBeInstanceOf(Error)
        if (lnPaymentOnPay instanceof Error) throw lnPaymentOnPay
        expect(lnPaymentOnPay.paymentHash).toBe(id)
        expect(lnPaymentOnPay.paymentRequest).toBe(request)
        expect(lnPaymentOnPay.isCompleteRecord).toBeFalsy()
        expect(lnPaymentOnPay.createdAt).toBeInstanceOf(Date)
        expect(lnPaymentOnPay.status).toBeUndefined()

        // Run update task
        const lnPaymentUpdateOnPending = await updateLnPayments()
        if (lnPaymentUpdateOnPending instanceof Error) throw lnPaymentUpdateOnPending

        // Test 'lnpayment' is pending
        const lnPaymentOnPending = await lnPaymentsRepo.findByPaymentHash(
          id as PaymentHash,
        )
        expect(lnPaymentOnPending).not.toBeInstanceOf(Error)
        if (lnPaymentOnPending instanceof Error) throw lnPaymentOnPending

        expect(lnPaymentOnPay.paymentHash).toBe(id)
        expect(lnPaymentOnPay.paymentRequest).toBe(request)
        expect(lnPaymentOnPay.isCompleteRecord).toBeFalsy()
        expect(lnPaymentOnPay.createdAt).toBeInstanceOf(Date)
        expect(lnPaymentOnPay.status).toBeUndefined()

        const lndService = LndService()
        if (lndService instanceof Error) throw lndService
        const pubkeys = lndService.listActivePubkeys()
        expect(pubkeys).toContain(lnPaymentOnPay.sentFromPubkey)

        // FIXME: necessary to not have openHandler ?
        // https://github.com/alexbosworth/ln-service/issues/122
        await waitFor(async () => {
          try {
            await settleHodlInvoice({ lnd: lndOutside1, secret })
            return true
          } catch (error) {
            baseLogger.warn({ error }, "settleHodlInvoice failed. trying again.")
            return false
          }
        })

        await waitFor(async () => {
          const updatedPayments = await Wallets.updatePendingPaymentsByWalletId({
            walletId: walletId1,
            logger: baseLogger,
          })
          if (updatedPayments instanceof Error) throw updatedPayments

          const count = await LedgerService().getPendingPaymentsCount(walletId1)
          if (count instanceof Error) throw count

          const { is_confirmed } = await getInvoice({ lnd: lndOutside1, id })
          return is_confirmed && count === 0
        })

        await waitUntilChannelBalanceSyncAll()

        // Run update task
        const lnPaymentUpdateOnSettled = await updateLnPayments()
        if (lnPaymentUpdateOnSettled instanceof Error) throw lnPaymentUpdateOnSettled

        // Test 'lnpayment' is complete
        const payments = await lndService.listSettledPayments({
          pubkey: lnPaymentOnPay.sentFromPubkey,
          after: undefined,
        })
        if (payments instanceof Error) throw payments
        const payment = payments.lnPayments.find((p) => p.paymentHash === id)
        expect(payment).not.toBeUndefined()
        if (payment === undefined) throw new Error("Could not find payment in lnd")

        const lnPaymentOnSettled = await lnPaymentsRepo.findByPaymentHash(
          id as PaymentHash,
        )
        expect(lnPaymentOnSettled).not.toBeInstanceOf(Error)
        if (lnPaymentOnSettled instanceof Error) throw lnPaymentOnSettled

        expect(lnPaymentOnSettled.createdAt).toStrictEqual(payment.createdAt)
        expect(lnPaymentOnSettled.status).toBe(PaymentStatus.Settled)
        expect(lnPaymentOnSettled.milliSatsAmount).toBe(payment.milliSatsAmount)
        expect(lnPaymentOnSettled.roundedUpAmount).toBe(payment.roundedUpAmount)
        expect(lnPaymentOnSettled.confirmedDetails?.revealedPreImage).not.toBeUndefined()
        expect(lnPaymentOnSettled.attempts).not.toBeUndefined()
        expect(lnPaymentOnSettled.attempts?.length).toBeGreaterThanOrEqual(1)

        expect(lnPaymentOnSettled.paymentRequest).toBe(request)
        expect(lnPaymentOnSettled.sentFromPubkey).toBe(lnPaymentOnPay.sentFromPubkey)
        expect(lnPaymentOnSettled.isCompleteRecord).toBeTruthy()

        const finalBalance = await getBTCBalance(walletId1)
        expect(finalBalance).toBe(initBalance1 - amountInvoice)
      }, 60000)

      it("don't settle hodl invoice", async () => {
        const { id } = createInvoiceHash()

        const { request } = await createHodlInvoice({
          id,
          lnd: lndOutside1,
          tokens: amountInvoice,
        })
        const result = await fn({ account: account1, walletId: walletId1 })({
          invoice: request,
        })
        if (result instanceof Error) throw result

        expect(result).toBe(PaymentSendStatus.Pending)
        baseLogger.info("payment has timeout. status is pending.")
        const intermediateBalance = await getBTCBalance(walletId1)
        expect(intermediateBalance).toBe(initBalance1 - amountInvoice * (1 + initialFee))

        await cancelHodlInvoice({ id, lnd: lndOutside1 })

        await waitFor(async () => {
          const updatedPayments = await Wallets.updatePendingPaymentsByWalletId({
            walletId: walletId1,
            logger: baseLogger,
          })
          if (updatedPayments instanceof Error) throw updatedPayments

          const count = await LedgerService().getPendingPaymentsCount(walletId1)
          if (count instanceof Error) throw count

          return count === 0
        })

        const invoice = await getInvoiceAttempt({ lnd: lndOutside1, id })
        expect(invoice).toBeNull()

        // wait for balance updates because invoice event
        // arrives before wallet balances updates in lnd
        await waitUntilChannelBalanceSyncAll()

        const finalBalance = await getBTCBalance(walletId1)
        expect(finalBalance).toBe(initBalance1)
      }, 60000)
    })

    describe("2FA", () => {
      it(`fails to pay above 2fa limit without 2fa token`, async () => {
        if (userType0.twoFA.secret) {
          await delete2fa({
            userId: userId0,
            token: generateTokenHelper(userType0.twoFA.secret),
          })
        }

        const secret = await enable2FA(userId0)
        userType0 = await getUserRecordByTestUserIndex(0)
        expect(secret).toBe(userType0.twoFA.secret)

        const remainingLimit = await getRemainingTwoFALimit(walletId0)
        expect(remainingLimit).not.toBeInstanceOf(Error)
        if (remainingLimit instanceof Error) throw remainingLimit

        const { request } = await createInvoice({
          lnd: lndOutside1,
          tokens: remainingLimit + 1,
        })
        const result = await fn({ account: account0, walletId: walletId0 })({
          invoice: request,
        })
        expect(result).toBeInstanceOf(TwoFAError)

        const finalBalance = await getBTCBalance(walletId0)
        expect(finalBalance).toBe(initBalance0)
      })

      it(`Makes large payment with a 2fa code`, async () => {
        await enable2FA(userId0)
        const userType0 = await getUserRecordByTestUserIndex(0)
        const secret = userType0.twoFA.secret

        const { request } = await createInvoice({
          lnd: lndOutside1,
          tokens: userType0.twoFA.threshold + 1,
        })

        const twoFAToken = generateTokenHelper(secret)
        const result = await fn({ account: account0, walletId: walletId0 })({
          invoice: request,
          twoFAToken,
        })
        if (result instanceof Error) throw result
        expect(result).toBe(PaymentSendStatus.Success)
      })
    })
  })

  it.skip("cancel the payment if the fee is too high", async () => {
    // TODO
  })

  it.skip("expired payment", async () => {
    const memo = "payment that should expire"

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Lightning = require("src/Lightning")
    jest.spyOn(Lightning, "delay").mockImplementation(() => ({
      value: 1,
      unit: "seconds",
      additional_delay_value: 0,
    }))

    const { lnd } = getActiveLnd()

    const lnInvoice = await Wallets.addInvoiceForSelf({
      walletId: walletId1 as WalletId,
      amount: toSats(amountInvoice),
      memo,
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: request } = lnInvoice

    const { id } = await decodePaymentRequest({ lnd, request })
    expect(await WalletInvoice.countDocuments({ _id: id })).toBe(1)

    // is deleting the invoice the same as when as invoice expired?
    // const res = await cancelHodlInvoice({ lnd, id })
    // baseLogger.debug({res}, "cancelHodlInvoice result")

    await sleep(5000)

    // hacky way to test if an invoice has expired
    // without having to to have a big timeout.
    // let i = 30
    // let hasExpired = false
    // while (i > 0 || hasExpired) {
    //   try {
    //     baseLogger.debug({i}, "get invoice start")
    //     const res = await getInvoice({ lnd, id })
    //     baseLogger.debug({res, i}, "has expired?")
    //   } catch (err) {
    //     baseLogger.warn({err})
    //   }
    //   i--
    //   await sleep(1000)
    // }

    // try {
    //   await pay({ lnd: lndOutside1, request })
    // } catch (err) {
    //   baseLogger.warn({err}, "error paying expired/cancelled invoice (that is intended)")
    // }

    // await expect(pay({ lnd: lndOutside1, request })).rejects.toThrow()

    // await sleep(1000)

    // await getBTCBalance(wallet1)

    // FIXME: test is failing.
    // lnd doesn't always delete invoice just after they have expired

    // expect(await WalletInvoice.countDocuments({_id: id})).toBe(0)

    // try {
    //   await getInvoice({ lnd, id })
    // } catch (err) {
    //   baseLogger.warn({err}, "invoice should not exist any more")
    // }

    // expect(await userWallet1.updatePendingInvoice({ hash: id })).toBeFalsy()
  }, 150000)
})
