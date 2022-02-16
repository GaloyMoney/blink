import { createHash, randomBytes } from "crypto"

import { Wallets, Lightning } from "@app"

import { delete2fa } from "@app/users"
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
import { LndService } from "@services/lnd"
import { getActiveLnd, getInvoiceAttempt } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { LnPaymentsRepository, WalletInvoicesRepository } from "@services/mongoose"
import { WalletInvoice } from "@services/mongoose/schema"

import { sleep } from "@utils"

import { getCurrentPrice } from "@app/prices"

import { DisplayCurrencyConverter } from "@domain/fiat/display-currency"

import { add, toCents } from "@domain/fiat"

import {
  cancelHodlInvoice,
  checkIsBalanced,
  createHodlInvoice,
  createInvoice,
  createUserAndWalletFromUserRef,
  decodePaymentRequest,
  enable2FA,
  generateTokenHelper,
  getAccountByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  getHash,
  getInvoice,
  getUserIdByTestUserRef,
  getUserRecordByTestUserRef,
  lndOutside1,
  lndOutside2,
  settleHodlInvoice,
  waitFor,
  waitUntilChannelBalanceSyncAll,
} from "test/helpers"
import { getBTCBalance, getRemainingTwoFALimit } from "test/helpers/wallet"

const date = Date.now() + 1000 * 60 * 60 * 24 * 8
// required to avoid withdrawal limits validation
jest.spyOn(global.Date, "now").mockImplementation(() => new Date(date).valueOf())

jest.mock("@app/prices/get-current-price", () => require("test/mocks/get-current-price"))

const accountLimits: IAccountLimits = {
  intraLedgerLimit: 100 as UsdCents,
  withdrawalLimit: 100 as UsdCents,
}

jest.mock("@config", () => {
  return {
    ...jest.requireActual("@config"),
    getAccountLimits: jest
      .fn()
      .mockReturnValueOnce({
        intraLedgerLimit: 100 as UsdCents,
        withdrawalLimit: 100 as UsdCents,
      })
      .mockReturnValueOnce({
        intraLedgerLimit: 100 as UsdCents,
        withdrawalLimit: 100 as UsdCents,
      })
      .mockReturnValue({
        intraLedgerLimit: 100000 as UsdCents,
        withdrawalLimit: 100000 as UsdCents,
      }),
  }
})

let initBalanceA: Satoshis, initBalanceB: Satoshis
const amountInvoice = toSats(1000)

const invoicesRepo = WalletInvoicesRepository()
let userRecordA: UserRecord

let userIdA: UserId

let accountA: Account
let accountB: Account
let accountC: Account

let walletIdA: WalletId
let walletIdB: WalletId
let walletIdC: WalletId

let usernameA: Username
let usernameB: Username
let usernameC: Username

beforeAll(async () => {
  await createUserAndWalletFromUserRef("A")
  await createUserAndWalletFromUserRef("B")
  await createUserAndWalletFromUserRef("C")

  userIdA = await getUserIdByTestUserRef("A")

  accountA = await getAccountByTestUserRef("A")
  accountB = await getAccountByTestUserRef("B")
  accountC = await getAccountByTestUserRef("C")

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  walletIdB = await getDefaultWalletIdByTestUserRef("B")
  walletIdC = await getDefaultWalletIdByTestUserRef("C")

  userRecordA = await getUserRecordByTestUserRef("A")
  usernameA = userRecordA.username as Username

  const userRecord1 = await getUserRecordByTestUserRef("B")
  usernameB = userRecord1.username as Username

  const userRecordC = await getUserRecordByTestUserRef("C")
  usernameC = userRecordC.username as Username
})

beforeEach(async () => {
  initBalanceA = await getBTCBalance(walletIdA)
  initBalanceB = await getBTCBalance(walletIdB)
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe("UserWallet - Lightning Pay", () => {
  it("fails to pay when withdrawalLimit exceeded", async () => {
    const amountAboveThreshold = toCents(accountLimits.withdrawalLimit + 10)

    const price = await getCurrentPrice()
    if (price instanceof Error) throw price
    const dCConverter = DisplayCurrencyConverter(price)
    const amount = dCConverter.fromCentsToSats(amountAboveThreshold)

    const { request } = await createInvoice({
      lnd: lndOutside1,
      tokens: amount,
    })
    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: request as EncodedPaymentRequest,
      memo: null,
      senderWalletId: walletIdB,
      senderAccount: accountB,
      logger: baseLogger,
    })

    expect(paymentResult).toBeInstanceOf(LimitsExceededError)
    const expectedError = `Cannot transfer more than ${accountLimits.withdrawalLimit} cents in 24 hours`
    expect((paymentResult as Error).message).toBe(expectedError)
  })

  it("fails to pay when amount exceeds intraLedger limit", async () => {
    const amountAboveThreshold = toCents(accountLimits.intraLedgerLimit + 10)

    const price = await getCurrentPrice()
    if (price instanceof Error) throw price
    const dCConverter = DisplayCurrencyConverter(price)
    const amount = dCConverter.fromCentsToSats(amountAboveThreshold)

    const lnInvoice = await Wallets.addInvoiceForSelf({
      walletId: walletIdA as WalletId,
      amount,
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: request } = lnInvoice

    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: request as EncodedPaymentRequest,
      memo: null,
      senderWalletId: walletIdB,
      senderAccount: accountB,
      logger: baseLogger,
    })

    expect(paymentResult).toBeInstanceOf(LimitsExceededError)
    const expectedError = `Cannot transfer more than ${accountLimits.intraLedgerLimit} cents in 24 hours`
    expect((paymentResult as Error).message).toBe(expectedError)
  })

  it("sends to another Galoy user with memo", async () => {
    const memo = "invoiceMemo"

    const lnInvoice = await Wallets.addInvoiceForSelf({
      walletId: walletIdC as WalletId,
      amount: amountInvoice,
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
      senderWalletId: walletIdB,
      senderAccount: accountB,
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
      walletId: walletIdB,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const userBTxn = txResult.result
    expect(userBTxn.filter(matchTx)[0].memo).toBe(memo)
    expect(userBTxn.filter(matchTx)[0].settlementVia.type).toBe("intraledger")
    // expect(userBTxn.filter(matchTx)[0].recipientUsername).toBe("lily")

    txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletIdB,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const userCTxn = txResult.result
    expect(userCTxn.filter(matchTx)[0].memo).toBe(memo)
    expect(userCTxn.filter(matchTx)[0].settlementVia.type).toBe("intraledger")
  })

  it("sends to another Galoy user with two different memos", async () => {
    const memo = "invoiceMemo"
    const memoPayer = "my memo as a payer"

    const lnInvoice = await Wallets.addInvoiceForSelf({
      walletId: walletIdC as WalletId,
      amount: amountInvoice,
      memo,
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: request } = lnInvoice

    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: request,
      memo: memoPayer,
      senderWalletId: walletIdB,
      senderAccount: accountB,
      logger: baseLogger,
    })
    if (paymentResult instanceof Error) throw paymentResult

    const matchTx = (tx) =>
      tx.settlementVia.type === PaymentInitiationMethod.IntraLedger &&
      tx.initiationVia.paymentHash === getHash(request)

    let txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletIdC,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const walletTxs = txResult.result
    expect(walletTxs.filter(matchTx)[0].memo).toBe(memo)
    expect(walletTxs.filter(matchTx)[0].settlementVia.type).toBe("intraledger")

    txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletIdB,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const userBTxn = txResult.result
    expect(userBTxn.filter(matchTx)[0].memo).toBe(memoPayer)
    expect(userBTxn.filter(matchTx)[0].settlementVia.type).toBe("intraledger")
  })

  it("sends to another Galoy user a push payment", async () => {
    const res = await Wallets.intraledgerPaymentSendUsername({
      recipientUsername: usernameA,
      memo: "",
      amount: amountInvoice,
      senderWalletId: walletIdB,
      senderAccount: accountB,
      logger: baseLogger,
    })
    if (res instanceof Error) throw res

    const finalBalanceA = await getBTCBalance(walletIdA)
    const { result: txWalletA, error } = await Wallets.getTransactionsForWalletId({
      walletId: walletIdA,
    })
    if (error instanceof Error || txWalletA === null) {
      throw error
    }

    const finalBalanceB = await getBTCBalance(walletIdB)
    const txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletIdB,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const userBTransaction = txResult.result
    expect(res).toBe(PaymentSendStatus.Success)
    expect(finalBalanceA).toBe(initBalanceA + amountInvoice)
    expect(finalBalanceB).toBe(initBalanceB - amountInvoice)

    expect(txWalletA[0].initiationVia).toHaveProperty("counterPartyUsername", usernameB)
    expect(userBTransaction[0].initiationVia).toHaveProperty(
      "counterPartyUsername",
      usernameA,
    )

    let userRecordA = await getUserRecordByTestUserRef("A")
    let userRecordB = await getUserRecordByTestUserRef("B")

    expect(userRecordA.contacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: usernameB })]),
    )
    const contactA = userRecordA.contacts.find(
      (userContact) => userContact.id === usernameB,
    )
    const txnCountA = contactA?.transactionsCount || 0

    expect(userRecordB.contacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: usernameA })]),
    )
    const contact1 = userRecordB.contacts.find(
      (userContact) => userContact.id === usernameA,
    )
    const txnCount1 = contact1?.transactionsCount || 0

    const res2 = await Wallets.intraledgerPaymentSendUsername({
      recipientUsername: usernameA,
      memo: "",
      amount: amountInvoice,
      senderWalletId: walletIdB,
      senderAccount: accountB,
      logger: baseLogger,
    })
    if (res2 instanceof Error) throw res2
    expect(res2).toBe(PaymentSendStatus.Success)

    userRecordA = await getUserRecordByTestUserRef("A")
    expect(userRecordA.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: usernameB,
          transactionsCount: txnCountA + 1,
        }),
      ]),
    )
    userRecordB = await getUserRecordByTestUserRef("B")
    expect(userRecordB.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: usernameA,
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
      amount: amountInvoice,
      senderWalletId: walletIdB,
      senderAccount: accountB,
      logger: baseLogger,
    })
    if (paymentResult instanceof Error) throw paymentResult
    expect(paymentResult).toBe(PaymentSendStatus.Success)

    const finalBalance = await getBTCBalance(walletIdB)
    expect(finalBalance).toBe(initBalanceB - amountInvoice)
  })

  it("filters spam from send to another Galoy user as push payment", async () => {
    const satsBelow = 100
    const memoSpamBelowThreshold = "Spam BELOW threshold"
    const resBelowThreshold = await Wallets.intraledgerPaymentSendUsername({
      recipientUsername: usernameA,
      memo: memoSpamBelowThreshold,
      amount: toSats(satsBelow),
      senderWalletId: walletIdB,
      senderAccount: accountB,
      logger: baseLogger,
    })
    if (resBelowThreshold instanceof Error) throw resBelowThreshold

    const satsAbove = 1100
    const memoSpamAboveThreshold = "Spam ABOVE threshold"
    const resAboveThreshold = await Wallets.intraledgerPaymentSendUsername({
      recipientUsername: usernameA,
      memo: memoSpamAboveThreshold,
      amount: toSats(satsAbove),
      senderWalletId: walletIdB,
      senderAccount: accountB,
      logger: baseLogger,
    })
    if (resAboveThreshold instanceof Error) throw resAboveThreshold

    let txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletIdA,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const userTransaction0 = txResult.result
    const transaction0Above = userTransaction0[0]
    const transaction0Below = userTransaction0[1]

    txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletIdB,
    })
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const userBTransaction = txResult.result
    const transaction1Above = userBTransaction[0]
    const transaction1Below = userBTransaction[1]

    // confirm both transactions succeeded
    expect(resBelowThreshold).toBe(PaymentSendStatus.Success)
    expect(resAboveThreshold).toBe(PaymentSendStatus.Success)

    // check below-threshold transaction for recipient was filtered
    expect(transaction0Below.initiationVia).toHaveProperty(
      "counterPartyUsername",
      usernameB,
    )
    expect(transaction0Below.memo).toBeNull()
    expect(transaction1Below.initiationVia).toHaveProperty(
      "counterPartyUsername",
      usernameA,
    )
    expect(transaction1Below.memo).toBe(memoSpamBelowThreshold)

    // check above-threshold transaction for recipient was NOT filtered
    expect(transaction0Above.initiationVia).toHaveProperty(
      "counterPartyUsername",
      usernameB,
    )
    expect(transaction0Above.memo).toBe(memoSpamAboveThreshold)
    expect(transaction1Above.initiationVia).toHaveProperty(
      "counterPartyUsername",
      usernameA,
    )
    expect(transaction1Above.memo).toBe(memoSpamAboveThreshold)

    // check contacts being added
    const userRecordA = await getUserRecordByTestUserRef("A")
    const userRecordB = await getUserRecordByTestUserRef("B")

    expect(userRecordA.contacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: usernameB })]),
    )

    expect(userRecordB.contacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: usernameA })]),
    )
  })

  it("fails if sends to self", async () => {
    const lnInvoice = await Wallets.addInvoiceForSelf({
      walletId: walletIdB as WalletId,
      amount: amountInvoice,
      memo: "self payment",
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: invoice } = lnInvoice

    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: invoice,
      memo: null,
      senderWalletId: walletIdB,
      senderAccount: accountB,
      logger: baseLogger,
    })
    expect(paymentResult).toBeInstanceOf(DomainSelfPaymentError)
  })

  it("fails if sends to self an on us push payment", async () => {
    const paymentResult = await Wallets.intraledgerPaymentSendUsername({
      recipientUsername: usernameB,
      memo: "",
      amount: amountInvoice,
      senderWalletId: walletIdB,
      senderAccount: accountB,
      logger: baseLogger,
    })
    expect(paymentResult).toBeInstanceOf(DomainSelfPaymentError)
  })

  it("fails when user has insufficient balance", async () => {
    const { request: invoice } = await createInvoice({
      lnd: lndOutside1,
      tokens: initBalanceB + 1000000,
    })
    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: invoice as EncodedPaymentRequest,
      memo: null,
      senderWalletId: walletIdB,
      senderAccount: accountB,
      logger: baseLogger,
    })
    expect(paymentResult).toBeInstanceOf(DomainInsufficientBalanceError)
  })

  it("fails to pay when channel capacity exceeded", async () => {
    const { request } = await createInvoice({ lnd: lndOutside1, tokens: 1500000 })
    const paymentResult = await Wallets.payInvoiceByWalletId({
      paymentRequest: request as EncodedPaymentRequest,
      memo: null,
      senderWalletId: walletIdA,
      senderAccount: accountA,
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
      senderWalletId: walletIdB,
      senderAccount: accountB,
      logger: baseLogger,
    })
    expect(paymentResult).toBeInstanceOf(ValidationError)
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
          const feeFromProbe = await Wallets.getRoutingFee({
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
        const result = await fn({ account: accountB, walletId: walletIdB })({
          invoice: request,
        })
        if (result instanceof Error) throw result
        expect(result).toBe(PaymentSendStatus.Success)

        const finalBalance = await getBTCBalance(walletIdB)
        expect(finalBalance).toBe(initBalanceB - amountInvoice)
      })

      it("fails when repaying invoice", async () => {
        const { request } = await createInvoice({
          lnd: lndOutside1,
          tokens: amountInvoice,
        })
        const intermediateResult = await fn({
          account: accountB,
          walletId: walletIdB,
        })({
          invoice: request,
        })
        if (intermediateResult instanceof Error) throw intermediateResult
        const intermediateBalanceSats = await getBTCBalance(walletIdB)

        const result = await fn({ account: accountB, walletId: walletIdB })({
          invoice: request,
        })
        if (result instanceof Error) throw result
        expect(result).toBe(PaymentSendStatus.AlreadyPaid)

        const finalBalanceSats = await getBTCBalance(walletIdB)
        expect(finalBalanceSats).toEqual(intermediateBalanceSats)
      })

      it("pay invoice with High CLTV Delta", async () => {
        const { request } = await createInvoice({
          lnd: lndOutside1,
          tokens: amountInvoice,
          cltv_delta: 200,
        })
        const result = await fn({ account: accountB, walletId: walletIdB })({
          invoice: request,
        })
        if (result instanceof Error) throw result
        expect(result).toBe(PaymentSendStatus.Success)
        const finalBalance = await getBTCBalance(walletIdB)
        expect(finalBalance).toBe(initBalanceB - amountInvoice)
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
            amount: amountInvoice,
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
          const userCTxn = txResult.result
          const userCOnUsTxn = userCTxn.filter(matchTx)
          expect(userCOnUsTxn[0].settlementVia.type).toBe("intraledger")
          await checkIsBalanced()

          txResult = await Wallets.getTransactionsForWalletId({
            walletId: walletIdPayer as WalletId,
          })
          if (txResult.error instanceof Error || txResult.result === null) {
            throw txResult.error
          }
          const userBTxn = txResult.result
          const userBOnUsTxn = userBTxn.filter(matchTx)
          expect(userBOnUsTxn[0].settlementVia.type).toBe("intraledger")

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
          walletIdPayee: walletIdC,
          walletIdPayer: walletIdB,
          accountPayer: accountB,
        })
        await paymentOtherGaloyUser({
          walletIdPayee: walletIdC,
          walletIdPayer: walletIdA,
          accountPayer: accountA,
        })
        await paymentOtherGaloyUser({
          walletIdPayee: walletIdB,
          walletIdPayer: walletIdC,
          accountPayer: accountC,
        })

        // jest.mock("@services/walletA/auth", () => ({
        //   // remove first lnd so that ActiveLnd return the second lnd
        //   params: jest
        //     .fn()
        //     .mockReturnValueOnce(addProps(inputs.shift()))
        // }))
        // await paymentOtherGaloyUser({walletPayee: userWalletB, walletPayer: userwalletC})
        const userRecordA = await getUserRecordByTestUserRef("A")
        expect(userRecordA.contacts).toEqual(
          expect.not.arrayContaining([expect.objectContaining({ id: usernameC })]),
        )
      })

      it("pay invoice to lnd outside2", async () => {
        const { request } = await createInvoice({
          lnd: lndOutside2,
          tokens: amountInvoice,
          is_including_private_channels: true,
        })

        const initialBalance = await getBTCBalance(walletIdB)

        const result = await fn({ account: accountB, walletId: walletIdB })({
          invoice: request,
          memo: "pay an unconnected node",
        })
        if (result instanceof Error) throw result

        // wait for balance updates because invoice event
        // arrives before wallet balances updates in lnd
        await waitUntilChannelBalanceSyncAll()

        expect(result).toBe(PaymentSendStatus.Success)
        const finalBalance = await getBTCBalance(walletIdB)

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
        const result = await fn({ account: accountB, walletId: walletIdB })({
          invoice: request,
        })
        if (result instanceof Error) throw result

        expect(result).toBe(PaymentSendStatus.Pending)
        const balanceBeforeSettlement = await getBTCBalance(walletIdB)
        expect(balanceBeforeSettlement).toBe(
          initBalanceB - amountInvoice * (1 + initialFee),
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

        // Run lnPayments update task
        const lnPaymentUpdateOnPending = await Lightning.updateLnPayments()
        if (lnPaymentUpdateOnPending instanceof Error) throw lnPaymentUpdateOnPending

        // Test 'lnpayment' is still pending
        const lnPaymentOnPending = await lnPaymentsRepo.findByPaymentHash(
          id as PaymentHash,
        )
        expect(lnPaymentOnPending).not.toBeInstanceOf(Error)
        if (lnPaymentOnPending instanceof Error) throw lnPaymentOnPending

        expect(lnPaymentOnPending.paymentHash).toBe(id)
        expect(lnPaymentOnPending.paymentRequest).toBe(request)
        expect(lnPaymentOnPending.isCompleteRecord).toBeFalsy()
        expect(lnPaymentOnPending.createdAt).toBeInstanceOf(Date)
        expect(lnPaymentOnPending.status).toBeUndefined()

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
            walletId: walletIdB,
            logger: baseLogger,
          })
          if (updatedPayments instanceof Error) throw updatedPayments

          const count = await LedgerService().getPendingPaymentsCount(walletIdB)
          if (count instanceof Error) throw count

          const { is_confirmed } = await getInvoice({ lnd: lndOutside1, id })
          return is_confirmed && count === 0
        })

        await waitUntilChannelBalanceSyncAll()

        // Run lnPayments update task
        const lnPaymentUpdateOnSettled = await Lightning.updateLnPayments()
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

        const finalBalance = await getBTCBalance(walletIdB)
        expect(finalBalance).toBe(initBalanceB - amountInvoice)
      }, 60000)

      it("don't settle hodl invoice", async () => {
        const { id } = createInvoiceHash()

        const { request } = await createHodlInvoice({
          id,
          lnd: lndOutside1,
          tokens: amountInvoice,
        })
        const result = await fn({ account: accountB, walletId: walletIdB })({
          invoice: request,
        })
        if (result instanceof Error) throw result

        expect(result).toBe(PaymentSendStatus.Pending)
        baseLogger.info("payment has timeout. status is pending.")
        const intermediateBalance = await getBTCBalance(walletIdB)
        expect(intermediateBalance).toBe(initBalanceB - amountInvoice * (1 + initialFee))

        await cancelHodlInvoice({ id, lnd: lndOutside1 })

        await waitFor(async () => {
          const updatedPayments = await Wallets.updatePendingPaymentsByWalletId({
            walletId: walletIdB,
            logger: baseLogger,
          })
          if (updatedPayments instanceof Error) throw updatedPayments

          const count = await LedgerService().getPendingPaymentsCount(walletIdB)
          if (count instanceof Error) throw count

          return count === 0
        })

        const invoice = await getInvoiceAttempt({ lnd: lndOutside1, id })
        expect(invoice).toBeNull()

        // wait for balance updates because invoice event
        // arrives before wallet balances updates in lnd
        await waitUntilChannelBalanceSyncAll()

        const finalBalance = await getBTCBalance(walletIdB)
        expect(finalBalance).toBe(initBalanceB)
      }, 60000)

      it(`fails to pay above 2fa limit without 2fa token`, async () => {
        if (userRecordA.twoFA.secret) {
          await delete2fa({
            userId: userIdA,
            token: generateTokenHelper(userRecordA.twoFA.secret),
          })
        }

        const secret = await enable2FA(userIdA)
        userRecordA = await getUserRecordByTestUserRef("A")
        expect(secret).toBe(userRecordA.twoFA.secret)

        const price = await getCurrentPrice()
        if (price instanceof Error) throw price
        const dCConverter = DisplayCurrencyConverter(price)

        const remainingLimit = await getRemainingTwoFALimit({
          walletId: walletIdA,
          dCConverter,
        })

        const aboveThreshold = add(remainingLimit, toCents(10))
        const aboveThresholdSats = dCConverter.fromCentsToSats(aboveThreshold)

        const { request } = await createInvoice({
          lnd: lndOutside1,
          tokens: aboveThresholdSats,
        })
        const result = await fn({ account: accountA, walletId: walletIdA })({
          invoice: request,
        })

        expect(result).toBeInstanceOf(TwoFAError)

        const finalBalance = await getBTCBalance(walletIdA)
        expect(finalBalance).toBe(initBalanceA)
      })

      it(`Makes large payment with a 2fa code`, async () => {
        await enable2FA(userIdA)
        const userRecordA = await getUserRecordByTestUserRef("A")
        const secret = userRecordA.twoFA.secret

        const { request } = await createInvoice({
          lnd: lndOutside1,
          tokens: userRecordA.twoFA.threshold + 1,
        })

        const twoFAToken = generateTokenHelper(secret)
        const result = await fn({ account: accountA, walletId: walletIdA })({
          invoice: request,
          twoFAToken,
        })
        if (result instanceof Error) throw result
        expect(result).toBe(PaymentSendStatus.Success)
      })
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
    walletId: walletIdB as WalletId,
    amount: amountInvoice,
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

  // await getBTCBalance(walletB)

  // FIXME: test is failing.
  // lnd doesn't always delete invoice just after they have expired

  // expect(await WalletInvoice.countDocuments({_id: id})).toBe(0)

  // try {
  //   await getInvoice({ lnd, id })
  // } catch (err) {
  //   baseLogger.warn({err}, "invoice should not exist any more")
  // }

  // expect(await userWalletB.updatePendingInvoice({ hash: id })).toBeFalsy()
}, 150000)
