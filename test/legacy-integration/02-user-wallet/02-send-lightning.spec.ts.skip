import { createHash, randomBytes } from "crypto"

import { getLocale } from "@config"

import { Lightning, Payments, Wallets } from "@app"
import * as PaymentsHelpers from "@app/payments/helpers"
import { getCurrentPriceAsDisplayPriceRatio } from "@app/prices"

import { AccountLimitsChecker } from "@domain/accounts"
import { toSats } from "@domain/bitcoin"
import {
  defaultTimeToExpiryInSeconds,
  InvalidFeeProbeStateError,
  InvoiceExpiredOrBadPaymentHashError,
  PaymentRejectedByDestinationError,
  PaymentSendStatus,
  PaymentStatus,
  RouteNotFoundError,
} from "@domain/bitcoin/lightning"
import { DisplayCurrency, toCents } from "@domain/fiat"
import { LedgerTransactionType } from "@domain/ledger"
import { NotificationType } from "@domain/notifications"
import {
  LnFees,
  LnPaymentRequestInTransitError,
  WalletPriceRatio,
} from "@domain/payments"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_SATS,
} from "@domain/shared"
import { PaymentInitiationMethod } from "@domain/wallets"
import { Account } from "@services/mongoose/schema"
import { toObjectId } from "@services/mongoose/utils"

import { DealerPriceService } from "@services/dealer-price"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { baseLogger } from "@services/logger"
import {
  LnPaymentsRepository,
  PaymentFlowStateRepository,
  WalletsRepository,
} from "@services/mongoose"
import { createPushNotificationContent } from "@services/notifications/create-push-notification-content"
import * as PushNotificationsServiceImpl from "@services/notifications/push-notifications"

import { sleep } from "@utils"

import { setupPaymentSubscribe } from "@servers/trigger"

import { setUsername } from "@app/accounts"

import {
  bitcoindClient,
  cancelHodlInvoice,
  checkIsBalanced,
  createHodlInvoice,
  createInvoice,
  createUserAndWalletFromPhone,
  fundWalletIdFromOnchain,
  getAccountByPhone,
  getAccountRecordByPhone,
  getBalanceHelper,
  getChannels,
  getDefaultWalletIdByPhone,
  getHash,
  getInvoice,
  getInvoiceAttempt,
  getTransactionsForWalletId,
  getUsdWalletIdByPhone,
  lnd1,
  lndOutside1,
  lndOutside3,
  markFailedTransactionAsPending,
  markSuccessfulTransactionAsPending,
  pay,
  randomPhone,
  settleHodlInvoice,
  subscribeToPayments,
  waitFor,
  waitUntilChannelBalanceSyncIntegration,
} from "test/helpers"

const dealerFns = DealerPriceService()
const calc = AmountCalculator()

jest.mock("@config", () => {
  return {
    ...jest.requireActual("@config"),
    getAccountLimits: jest.fn().mockReturnValue({
      intraLedgerLimit: 100_000 as UsdCents,
      withdrawalLimit: 100_000 as UsdCents,
      tradeIntraAccountLimit: 100_000 as UsdCents,
    }),
  }
})

const lndService = LndService()
const lndServiceCallCount: { [key: string]: number } = {}
if (lndService instanceof Error) throw lndService
for (const key of Object.keys(lndService)) {
  lndServiceCallCount[key] = 0
}

jest.mock("@services/lnd", () => {
  const module = jest.requireActual("@services/lnd")
  const { LndService } = module

  const LndServiceWithCounts = () => {
    const lndService = LndService()
    if (lndService instanceof Error) return lndService

    const newLndService = {} as ILightningService
    for (const key of Object.keys(lndService)) {
      const fn = lndService[key]
      newLndService[key] = (args) => {
        lndServiceCallCount[key]++
        return fn(args)
      }
    }
    return newLndService
  }

  return {
    ...module,
    LndService: LndServiceWithCounts,
  }
})

let initBalanceB: Satoshis, initBalanceUsdB: UsdCents
const amountInvoice = toSats(1000)

const phoneA = randomPhone()
const phoneB = randomPhone()
const phoneC = randomPhone()
const phoneH = randomPhone()

let accountA: Account
let accountB: Account
let accountC: Account
let accountH: Account

let walletIdA: WalletId
let walletIdB: WalletId
let walletIdC: WalletId
let walletIdH: WalletId
let walletIdUsdB: WalletId

let usernameA: Username
let usernameB: Username
let usernameC: Username

const locale = getLocale()

beforeAll(async () => {
  await bitcoindClient.loadWallet({ filename: "outside" })

  await createUserAndWalletFromPhone(phoneA)
  await createUserAndWalletFromPhone(phoneB)
  await createUserAndWalletFromPhone(phoneC)
  await createUserAndWalletFromPhone(phoneH)

  accountA = await getAccountByPhone(phoneA)
  accountB = await getAccountByPhone(phoneB)
  accountC = await getAccountByPhone(phoneC)
  accountH = await getAccountByPhone(phoneH)

  walletIdA = await getDefaultWalletIdByPhone(phoneA)
  walletIdB = await getDefaultWalletIdByPhone(phoneB)
  walletIdUsdB = await getUsdWalletIdByPhone(phoneB)
  walletIdC = await getDefaultWalletIdByPhone(phoneC)
  walletIdH = await getDefaultWalletIdByPhone(phoneH)

  await fundWalletIdFromOnchain({
    walletId: walletIdA,
    amountInBitcoin: 0.02,
    lnd: lnd1,
  })
  await fundWalletIdFromOnchain({
    walletId: walletIdB,
    amountInBitcoin: 0.02,
    lnd: lnd1,
  })
  await fundWalletIdFromOnchain({
    walletId: walletIdUsdB,
    amountInBitcoin: 0.02,
    lnd: lnd1,
  })

  usernameA = "sendLighningUserA" as Username
  usernameB = "sendLighningUserB" as Username
  usernameC = "sendLighningUserC" as Username

  await setUsername({ username: usernameA, id: accountA.id })
  await setUsername({ username: usernameB, id: accountB.id })
  await setUsername({ username: usernameC, id: accountC.id })
})

beforeEach(async () => {
  initBalanceB = toSats(await getBalanceHelper(walletIdB))
  initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

describe("UserWallet - Lightning Pay", () => {
  it("does not filter spam message for external send", async () => {
    const amount = toSats(1)
    const memoSpamBelowThreshold = "Memo BELOW spam threshold"
    const memoOnInvoice = `${memoSpamBelowThreshold} -- from payment request`
    const memoFromUser = `${memoSpamBelowThreshold} -- from user`

    const { request } = await createInvoice({
      lnd: lndOutside1,
      description: memoOnInvoice,
    })

    // Test probe + payment is successful
    const { result: fee, error } =
      await Payments.getNoAmountLightningFeeEstimationForBtcWallet({
        walletId: walletIdB,
        uncheckedPaymentRequest: request,
        amount,
      })
    if (error instanceof Error) throw error
    expect(fee).not.toBeNull()

    const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
      uncheckedPaymentRequest: request,
      memo: memoFromUser,
      amount,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    if (paymentResult instanceof Error) throw paymentResult
    expect(paymentResult).toBe(PaymentSendStatus.Success)

    // Check memo on txns
    const txResult = await getTransactionsForWalletId(walletIdB)
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const txns = txResult.result.slice
    expect(txns.length).toBeGreaterThan(0)
    const txn = txns[0]
    expect(txn.memo).toBe(memoFromUser)
  })

  it("sends balance amount accounting for fee", async () => {
    const res = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      recipientWalletId: walletIdH,
      memo: "",
      amount: toSats(1000),
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    expect(res).not.toBeInstanceOf(Error)
    if (res instanceof Error) return res

    const balanceBefore = await getBalanceHelper(walletIdH)
    const { request } = await createInvoice({ lnd: lndOutside1, tokens: balanceBefore })

    const { result: fee, error } = await Payments.getLightningFeeEstimationForBtcWallet({
      walletId: walletIdH,
      uncheckedPaymentRequest: request,
    })
    if (error instanceof Error) throw error
    expect(fee).not.toBeNull()
    if (fee === null) throw new InvalidFeeProbeStateError()
    expect(fee.amount).toBe(0n)

    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest: request,
      memo: null,
      senderWalletId: walletIdH,
      senderAccount: accountH,
    })
    if (paymentResult instanceof Error) return paymentResult
    expect(paymentResult).not.toBeInstanceOf(Error)
    expect(paymentResult).toStrictEqual(PaymentSendStatus.Success)

    const balanceAfter = await getBalanceHelper(walletIdH)
    expect(balanceAfter).toBe(0)
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
      applyMaxFee: false,
      fn: function fn({ walletId, account }: { walletId: WalletId; account: Account }) {
        return async (input): Promise<PaymentSendStatus | ApplicationError> => {
          const wallet = await WalletsRepository().findById(walletId)
          if (wallet instanceof Error) throw wallet

          const getLightningFeeFn =
            wallet.currency === WalletCurrency.Btc
              ? Payments.getLightningFeeEstimationForBtcWallet
              : Payments.getLightningFeeEstimationForUsdWallet

          const { result: feeFromProbe, error } = await getLightningFeeFn({
            walletId: walletId,
            uncheckedPaymentRequest: input.invoice,
          })
          if (error instanceof Error) throw error
          expect(feeFromProbe).not.toBeNull()
          if (feeFromProbe === null) throw new InvalidFeeProbeStateError()

          const paymentResult = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: input.invoice,
            memo: input.memo,
            senderWalletId: walletId,
            senderAccount: account,
          })
          return paymentResult
        }
      },
    },
    {
      name: "directPay",
      applyMaxFee: true,
      fn: function fn({ walletId, account }: { walletId: WalletId; account: Account }) {
        return async (input): Promise<PaymentSendStatus | ApplicationError> => {
          const paymentResult = await Payments.payInvoiceByWalletId({
            uncheckedPaymentRequest: input.invoice,
            senderAccount: account,
            memo: input.memo,
            senderWalletId: walletId,
          })
          return paymentResult
        }
      },
    },
  ]

  functionToTests.forEach(({ fn, name, applyMaxFee }) => {
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

        const finalBalance = await getBalanceHelper(walletIdB)
        expect(finalBalance).toBe(initBalanceB - amountInvoice)
      })

      it("pay invoice to another Galoy user", async () => {
        const memo = "my memo as a payer"
        const sendNotification = jest.fn()
        jest
          .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
          .mockImplementationOnce(() => ({ sendNotification }))

        const paymentOtherGaloyUser = async ({
          walletIdPayer,
          accountPayer,
          walletIdPayee,
        }: {
          walletIdPayer: WalletId
          accountPayer: Account
          walletIdPayee: WalletId
        }) => {
          const payerInitialBalance = await getBalanceHelper(walletIdPayer)
          const payeeInitialBalance = await getBalanceHelper(walletIdPayee)

          const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
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

          const payerFinalBalance = await getBalanceHelper(walletIdPayer)
          const payeeFinalBalance = await getBalanceHelper(walletIdPayee)

          expect(payerFinalBalance).toBe(payerInitialBalance - amountInvoice)
          expect(payeeFinalBalance).toBe(payeeInitialBalance + amountInvoice)

          const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
            currency: DisplayCurrency.Usd,
          })
          if (displayPriceRatio instanceof Error) throw displayPriceRatio

          const paymentAmount = {
            amount: BigInt(amountInvoice),
            currency: WalletCurrency.Btc,
          }
          const displayPaymentAmount = displayPriceRatio.convertFromWallet(paymentAmount)

          const { title, body } = createPushNotificationContent({
            type: NotificationType.LnInvoicePaid,
            userLanguage: locale as UserLanguage,
            amount: paymentAmount,
            displayAmount: displayPaymentAmount,
          })

          expect(sendNotification.mock.calls.length).toBe(1)
          expect(sendNotification.mock.calls[0][0].title).toBe(title)
          expect(sendNotification.mock.calls[0][0].body).toBe(body)

          const paymentHash = getHash(request)
          const matchTx = (tx) =>
            tx.settlementVia.type === PaymentInitiationMethod.IntraLedger &&
            tx.initiationVia.paymentHash === paymentHash

          let txResult = await getTransactionsForWalletId(walletIdPayee)
          if (txResult.error instanceof Error || txResult.result === null) {
            throw txResult.error
          }
          const userCTxn = txResult.result
          const userCOnUsTxn = userCTxn.slice.filter(matchTx)
          expect(userCOnUsTxn[0].settlementVia.type).toBe("intraledger")
          await checkIsBalanced()

          txResult = await getTransactionsForWalletId(walletIdPayer as WalletId)
          if (txResult.error instanceof Error || txResult.result === null) {
            throw txResult.error
          }
          const userBTxn = txResult.result
          const userBOnUsTxn = userBTxn.slice.filter(matchTx)
          expect(userBOnUsTxn[0].settlementVia.type).toBe("intraledger")

          // making request twice because there is a cancel state, and this should be re-entrant
          expect(
            await Wallets.updatePendingInvoiceByPaymentHash({
              paymentHash,
              logger: baseLogger,
            }),
          ).not.toBeInstanceOf(Error)
          expect(
            await Wallets.updatePendingInvoiceByPaymentHash({
              paymentHash,
              logger: baseLogger,
            }),
          ).not.toBeInstanceOf(Error)
        }
        await Account.updateMany(
          { _id: { $in: [accountA.id, accountB.id, accountC.id].map(toObjectId) } },
          { $set: { contacts: [] } },
        )
        let accountRecordA = await getAccountRecordByPhone(phoneA)
        let accountRecordB = await getAccountRecordByPhone(phoneB)
        let accountRecordC = await getAccountRecordByPhone(phoneC)
        expect(accountRecordA.contacts).not.toEqual(
          expect.arrayContaining([expect.objectContaining({ id: usernameB })]),
        )
        expect(accountRecordB.contacts).not.toEqual(
          expect.arrayContaining([expect.objectContaining({ id: usernameC })]),
        )
        expect(accountRecordC.contacts).not.toEqual(
          expect.arrayContaining([expect.objectContaining({ id: usernameB })]),
        )
        await paymentOtherGaloyUser({
          walletIdPayee: walletIdC,
          walletIdPayer: walletIdB,
          accountPayer: accountB,
        })
        await paymentOtherGaloyUser({
          walletIdPayee: walletIdB,
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

        accountRecordA = await getAccountRecordByPhone(phoneA)
        accountRecordB = await getAccountRecordByPhone(phoneB)
        accountRecordC = await getAccountRecordByPhone(phoneC)
        expect(accountRecordA.contacts).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: usernameB })]),
        )
        expect(accountRecordB.contacts).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: usernameC })]),
        )
        expect(accountRecordC.contacts).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: usernameB })]),
        )
      })

      it("pay hodl invoice & ln payments repo updates", async () => {
        const { id, secret } = createInvoiceHash()
        const paymentHash = id as PaymentHash

        const subPayments = subscribeToPayments({ lnd: lnd1 })
        setupPaymentSubscribe({ subPayments })

        const paymentFlowRepo = PaymentFlowStateRepository(defaultTimeToExpiryInSeconds)
        const paymentFlowIndex: PaymentFlowStateIndex = {
          paymentHash,
          walletId: walletIdB,
          inputAmount: BigInt(amountInvoice),
        }

        const { request } = await createHodlInvoice({
          id,
          lnd: lndOutside1,
          tokens: amountInvoice,
        })
        const result = await fn({ account: accountB, walletId: walletIdB })({
          invoice: request,
        })
        if (result instanceof Error) throw result

        // Payment method should return an error when there is a payment in transit (pending)
        const resultPendingPayment = await fn({ account: accountB, walletId: walletIdB })(
          {
            invoice: request,
          },
        )
        expect(resultPendingPayment).toBeInstanceOf(LnPaymentRequestInTransitError)

        const balanceBeforeSettlement = await getBalanceHelper(walletIdB)

        const feeAmount = LnFees().maxProtocolAndBankFee({
          amount: BigInt(amountInvoice),
          currency: WalletCurrency.Btc,
        })
        const amountInvoiceWithFee = applyMaxFee
          ? amountInvoice + Number(feeAmount.amount)
          : amountInvoice

        expect(balanceBeforeSettlement).toEqual(initBalanceB - amountInvoiceWithFee)

        const lnPaymentsRepo = LnPaymentsRepository()

        // Test 'lnpayment' is pending
        const lnPaymentOnPay = await lnPaymentsRepo.findByPaymentHash(paymentHash)
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
        const lnPaymentOnPending = await lnPaymentsRepo.findByPaymentHash(paymentHash)
        expect(lnPaymentOnPending).not.toBeInstanceOf(Error)
        if (lnPaymentOnPending instanceof Error) throw lnPaymentOnPending

        expect(lnPaymentOnPending.paymentHash).toBe(id)
        expect(lnPaymentOnPending.paymentRequest).toBe(request)
        expect(lnPaymentOnPending.isCompleteRecord).toBeFalsy()
        expect(lnPaymentOnPending.createdAt).toBeInstanceOf(Date)
        expect(lnPaymentOnPending.status).toBeUndefined()

        const paymentFlowPending = await paymentFlowRepo.findLightningPaymentFlow(
          paymentFlowIndex,
        )
        if (paymentFlowPending instanceof Error) throw paymentFlowPending
        expect(paymentFlowPending.paymentSentAndPending).toBeTruthy()

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
          const count = await LedgerService().getPendingPaymentsCount(walletIdB)
          if (count instanceof Error) throw count

          const { is_confirmed } = await getInvoice({ lnd: lndOutside1, id })
          return is_confirmed && count === 0
        })

        await waitUntilChannelBalanceSyncIntegration()

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

        const lnPaymentOnSettled = await lnPaymentsRepo.findByPaymentHash(paymentHash)
        expect(lnPaymentOnSettled).not.toBeInstanceOf(Error)
        if (lnPaymentOnSettled instanceof Error) throw lnPaymentOnSettled

        expect(lnPaymentOnSettled.createdAt).toStrictEqual(payment.createdAt)
        expect(lnPaymentOnSettled.status).toBe(PaymentStatus.Settled)
        expect(lnPaymentOnSettled.milliSatsAmount).toBe(payment.milliSatsAmount)
        expect(lnPaymentOnSettled.roundedUpAmount).toBe(payment.roundedUpAmount)
        expect(lnPaymentOnSettled.confirmedDetails).not.toBeUndefined()
        expect(lnPaymentOnSettled.attempts).not.toBeUndefined()
        expect(lnPaymentOnSettled.attempts?.length).toBeGreaterThanOrEqual(1)

        const preImage = payment.confirmedDetails?.revealedPreImage
        expect(preImage).toHaveLength(64)
        expect(lnPaymentOnSettled.confirmedDetails?.revealedPreImage).toBe(preImage)

        expect(lnPaymentOnSettled.paymentRequest).toBe(request)
        expect(lnPaymentOnSettled.sentFromPubkey).toBe(lnPaymentOnPay.sentFromPubkey)
        expect(lnPaymentOnSettled.isCompleteRecord).toBeTruthy()

        const paymentFlowSettled = await paymentFlowRepo.findLightningPaymentFlow(
          paymentFlowIndex,
        )
        if (paymentFlowSettled instanceof Error) throw paymentFlowSettled
        expect(paymentFlowSettled.paymentSentAndPending).toBeFalsy()

        const finalBalance = await getBalanceHelper(walletIdB)
        expect(finalBalance).toBe(initBalanceB - amountInvoice)

        subPayments.removeAllListeners()
      }, 60000)

      it("don't settle hodl invoice", async () => {
        const { id } = createInvoiceHash()
        const paymentHash = id as PaymentHash

        const subPayments = subscribeToPayments({ lnd: lnd1 })
        setupPaymentSubscribe({ subPayments })

        const { request } = await createHodlInvoice({
          id,
          lnd: lndOutside1,
          tokens: amountInvoice,
        })
        const result = await fn({
          account: accountB,
          walletId: walletIdB,
        })({
          invoice: request,
        })
        if (result instanceof Error) throw result

        const paymentWhilePending = await fn({
          account: accountB,
          walletId: walletIdB,
        })({
          invoice: request,
        })
        expect(paymentWhilePending).toBeInstanceOf(LnPaymentRequestInTransitError)

        expect(result).toBe(PaymentSendStatus.Pending)
        baseLogger.info("payment has timeout. status is pending.")
        const intermediateBalance = await getBalanceHelper(walletIdB)

        const feeAmount = LnFees().maxProtocolAndBankFee({
          amount: BigInt(amountInvoice),
          currency: WalletCurrency.Btc,
        })
        const amountInvoiceWithFee = applyMaxFee
          ? amountInvoice + Number(feeAmount.amount)
          : amountInvoice

        expect(intermediateBalance).toBe(initBalanceB - amountInvoiceWithFee)

        await cancelHodlInvoice({ id, lnd: lndOutside1 })

        await waitFor(async () => {
          const count = await LedgerService().getPendingPaymentsCount(walletIdB)
          if (count instanceof Error) throw count

          return count === 0
        })

        // Test 'lnpayment' is failed
        const lnPaymentUpdateOnSettled = await Lightning.updateLnPayments()
        if (lnPaymentUpdateOnSettled instanceof Error) throw lnPaymentUpdateOnSettled

        const lnPaymentOnSettled = await LnPaymentsRepository().findByPaymentHash(
          paymentHash,
        )
        expect(lnPaymentOnSettled).not.toBeInstanceOf(Error)
        if (lnPaymentOnSettled instanceof Error) throw lnPaymentOnSettled

        const lndService = LndService()
        if (lndService instanceof Error) throw lndService
        const payments = await lndService.listFailedPayments({
          pubkey: lnPaymentOnSettled.sentFromPubkey,
          after: undefined,
        })
        if (payments instanceof Error) throw payments
        const payment = payments.lnPayments.find((p) => p.paymentHash === id)
        expect(payment).not.toBeUndefined()
        if (payment === undefined) throw new Error("Could not find payment in lnd")

        expect(lnPaymentOnSettled.status).toBe(PaymentStatus.Failed)

        // Test repayment after fail
        const paymentAfterFailed = await fn({
          account: accountB,
          walletId: walletIdB,
        })({
          invoice: request,
        })
        expect(
          paymentAfterFailed instanceof InvoiceExpiredOrBadPaymentHashError ||
            paymentAfterFailed instanceof PaymentRejectedByDestinationError,
        ).toBe(true)

        // Check for invoice
        const invoice = await getInvoiceAttempt({ lnd: lndOutside1, id })
        expect(invoice).toBeNull()

        // wait for balance updates because invoice event
        // arrives before wallet balances updates in lnd
        await waitUntilChannelBalanceSyncIntegration()

        const finalBalance = await getBalanceHelper(walletIdB)
        expect(finalBalance).toBe(initBalanceB)

        subPayments.removeAllListeners()
      }, 60000)

      it("reimburse failed USD payment", async () => {
        const { id } = createInvoiceHash()
        const paymentHash = id as PaymentHash

        const subPayments = subscribeToPayments({ lnd: lnd1 })
        setupPaymentSubscribe({ subPayments })

        const btcInvoiceAmount = paymentAmountFromNumber({
          amount: amountInvoice,
          currency: WalletCurrency.Btc,
        })
        if (btcInvoiceAmount instanceof Error) throw btcInvoiceAmount
        const usdInvoiceAmount = await dealerFns.getCentsFromSatsForImmediateSell(
          btcInvoiceAmount,
        )
        if (usdInvoiceAmount instanceof Error) throw usdInvoiceAmount

        const { request } = await createHodlInvoice({
          id,
          lnd: lndOutside1,
          tokens: amountInvoice,
        })
        const result = await fn({ account: accountB, walletId: walletIdUsdB })({
          invoice: request,
        })
        if (result instanceof Error) throw result

        expect(result).toBe(PaymentSendStatus.Pending)
        baseLogger.info("payment has timeout. status is pending.")
        const intermediateBalance = await getBalanceHelper(walletIdUsdB)

        const priceRatio = WalletPriceRatio({
          btc: btcInvoiceAmount,
          usd: usdInvoiceAmount,
        })
        if (priceRatio instanceof Error) return priceRatio
        const btcProtocolAndBankFee = applyMaxFee
          ? LnFees().maxProtocolAndBankFee({
              amount: btcInvoiceAmount.amount,
              currency: WalletCurrency.Btc,
            })
          : ZERO_SATS
        const usdProtocolAndBankFee = priceRatio.convertFromBtc(btcProtocolAndBankFee)

        const amountInvoiceWithFee = calc.add(usdInvoiceAmount, usdProtocolAndBankFee)

        expect(intermediateBalance).toBe(
          initBalanceUsdB - Number(amountInvoiceWithFee.amount),
        )

        await cancelHodlInvoice({ id, lnd: lndOutside1 })

        await waitFor(async () => {
          const count = await LedgerService().getPendingPaymentsCount(walletIdUsdB)
          if (count instanceof Error) throw count

          return count === 0
        })

        // Test 'lnpayment' is failed
        const lnPaymentUpdateOnSettled = await Lightning.updateLnPayments()
        if (lnPaymentUpdateOnSettled instanceof Error) throw lnPaymentUpdateOnSettled

        const lnPaymentOnSettled = await LnPaymentsRepository().findByPaymentHash(
          paymentHash,
        )
        expect(lnPaymentOnSettled).not.toBeInstanceOf(Error)
        if (lnPaymentOnSettled instanceof Error) throw lnPaymentOnSettled

        const lndService = LndService()
        if (lndService instanceof Error) throw lndService
        const payments = await lndService.listFailedPayments({
          pubkey: lnPaymentOnSettled.sentFromPubkey,
          after: undefined,
        })
        if (payments instanceof Error) throw payments

        const payment = payments.lnPayments.find((p) => p.paymentHash === id)
        expect(payment).not.toBeUndefined()
        if (payment === undefined) throw new Error("Could not find payment in lnd")

        expect(lnPaymentOnSettled.status).toBe(PaymentStatus.Failed)

        // Check for invoice
        const invoice = await getInvoiceAttempt({ lnd: lndOutside1, id })
        expect(invoice).toBeNull()

        // wait for balance updates because invoice event
        // arrives before wallet balances updates in lnd
        await waitUntilChannelBalanceSyncIntegration()

        // Check BTC wallet balance
        const btcAmountInvoiceWithFee = calc.add(btcInvoiceAmount, btcProtocolAndBankFee)
        const finalBalanceBtc = await getBalanceHelper(walletIdB)
        expect(finalBalanceBtc).toBe(
          initBalanceB + Number(btcAmountInvoiceWithFee.amount),
        )

        // Check USD wallet balance
        const finalBalanceUsd = await getBalanceHelper(walletIdUsdB)
        expect(finalBalanceUsd).toBe(
          initBalanceUsdB - Number(amountInvoiceWithFee.amount),
        )

        subPayments.removeAllListeners()
      }, 60000)
    })
  })
})

describe("Handle pending payments - Lightning Pay", () => {
  it("settle failed and then successful payment routed to lnd-outside-3", async () => {
    const ledger = LedgerService()
    const senderWalletId = walletIdB
    const senderAccount = accountB
    const memo = "pay a node with no route liquidity node"

    // Different amounts to bypass lnd mission control on 2nd send attempt
    const successAmountInvoice = 1000
    const rebalanceAmountInvoice = 1001

    // Fetch balances on lndOutside3 channel
    const { channels } = await getChannels({ lnd: lndOutside3 })
    expect(channels && channels.length).toBeGreaterThan(0)
    const { remote_balance: remoteBalance, remote_reserve: remoteReserve } = channels[0]

    // Pay lndOutside3 and fail
    const { request, id } = await createInvoice({
      lnd: lndOutside3,
    })
    const paymentHash = id as PaymentHash

    const failResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
      uncheckedPaymentRequest: request,
      amount: Math.max(rebalanceAmountInvoice, remoteBalance + 1),
      senderAccount,
      senderWalletId,
      memo,
    })
    expect(failResult).toBeInstanceOf(RouteNotFoundError)

    // Rebalance lndOutside3 route
    const { request: invoice } = await createInvoice({
      lnd: lndOutside1,
      tokens:
        remoteBalance < remoteReserve
          ? rebalanceAmountInvoice + remoteReserve
          : rebalanceAmountInvoice,
    })
    const rebalance = await pay({ lnd: lndOutside3, request: invoice })
    expect(rebalance.is_confirmed).toBe(true)
    await sleep(500) // rebalance can take some time to settle even after promise is resolved

    // Pay lndOutside3 and succeed
    // Note: probe first to avoid reimburse txn that would need to be manually deleted
    const successProbeResult =
      await Payments.getNoAmountLightningFeeEstimationForBtcWallet({
        uncheckedPaymentRequest: request,
        amount: successAmountInvoice,
        walletId: senderWalletId,
      })
    if (successProbeResult instanceof Error) throw successProbeResult

    const successResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
      uncheckedPaymentRequest: request,
      amount: successAmountInvoice,
      senderAccount,
      senderWalletId,
      memo,
    })
    if (successResult instanceof Error) throw successResult
    expect(successResult).toBe(PaymentSendStatus.Success)

    // Undo last successful payment to be pending
    const txns = await ledger.getTransactionsByWalletId(senderWalletId)
    if (txns instanceof Error) throw txns
    const txnsByHash = txns
      // filter on "LedgerTransactionType.Payment" because this is what updatePending counts
      .filter((tx) => tx.type === LedgerTransactionType.Payment)
      .filter((tx) => tx.paymentHash === paymentHash)
      .sort((txA, txB) => txA.timestamp.getTime() - txB.timestamp.getTime())
      .reverse()

    if (!(txnsByHash && txnsByHash.length > 0)) {
      throw new Error("Missing expected txn")
    }
    const originalTxn = txnsByHash[0]
    await markSuccessfulTransactionAsPending(originalTxn.journalId)

    // Check that last txn was successfully undone and is pending
    const originalTxnPending = await ledger.getTransactionById(originalTxn.id)
    if (originalTxnPending instanceof Error) throw originalTxnPending
    expect(originalTxnPending.pendingConfirmation).toBeTruthy()

    const isRecordedPending = await ledger.isLnTxRecorded(paymentHash)
    expect(isRecordedPending).toBeFalsy()

    // Run update pending payments
    await Payments.updatePendingPaymentByHash({
      paymentHash,
      logger: baseLogger,
    })

    // Check if last txn is successfully settled
    const originalTxnPaid = await ledger.getTransactionById(originalTxn.id)
    if (originalTxnPaid instanceof Error) throw originalTxnPaid
    expect(originalTxnPaid.pendingConfirmation).toBeFalsy()
    const txnsPaid = await ledger.getTransactionsByWalletId(senderWalletId)
    if (txnsPaid instanceof Error) throw txnsPaid
    expect(txnsPaid[0].lnMemo).not.toBe("Payment canceled")

    const isRecordedPaid = await ledger.isLnTxRecorded(paymentHash)
    expect(isRecordedPaid).toBeTruthy()

    // Accommodate 'bookingVersusRealWorldAssets' inconsistency
    // ===
    // If milliSatsFee is not evenly divisible then fee recorded is rounded up but lnd
    // balance checked changes by the rounded down amount. The proper fix for this is
    // to enforce that ppm 'rate' is set to '0' when setting  up channels.
    const lnPaymentLookup = await lndService.lookupPayment({
      pubkey: process.env.LND1_PUBKEY as Pubkey,
      paymentHash: paymentHash,
    })
    if (lnPaymentLookup instanceof Error) throw lnPaymentLookup
    if (lnPaymentLookup.status === PaymentStatus.Failed) {
      throw new Error("Unexpected failed payment detected")
    }
    const milliSatsFee = lnPaymentLookup.confirmedDetails?.milliSatsFee
    if (milliSatsFee !== undefined && milliSatsFee % 1000 > 0) {
      // Compensate for fee inconsistency by reimbursing 1 sat
      const paymentFlowIndex: PaymentFlowStateIndex = {
        paymentHash,
        walletId: senderWalletId,
        inputAmount: BigInt(successAmountInvoice),
      }
      const paymentFlow = await PaymentFlowStateRepository(
        defaultTimeToExpiryInSeconds,
      ).markLightningPaymentFlowNotPending(paymentFlowIndex)
      if (paymentFlow instanceof Error) throw paymentFlow

      const {
        displayAmount: senderDisplayAmount,
        displayCurrency: senderDisplayCurrency,
      } = originalTxn
      if (senderDisplayAmount === undefined || senderDisplayCurrency === undefined) {
        throw new Error("missing display-related values in transaction")
      }
      const reimbursed = await Payments.reimburseFee({
        paymentFlow,
        senderDisplayAmount,
        senderDisplayCurrency,
        journalId: originalTxn.journalId,
        actualFee: toSats(1),
        revealedPreImage: lnPaymentLookup.confirmedDetails?.revealedPreImage,
      })
      if (reimbursed instanceof Error) return reimbursed
    }
  })

  it("settle multiple failed payment routed to lnd-outside-3", async () => {
    const ledger = LedgerService()
    const senderWalletId = walletIdB
    const senderAccount = accountB
    const memo = "pay a node with no route liquidity node"

    // Fetch balances on lndOutside3 channel
    const { channels } = await getChannels({ lnd: lndOutside3 })
    expect(channels && channels.length).toBeGreaterThan(0)
    const remoteBalance = channels[0].remote_balance

    // Pay lndOutside3 twice and fail
    const amountInvoice = 1000
    const { request, id } = await createInvoice({
      lnd: lndOutside3,
      tokens: Math.max(amountInvoice, remoteBalance + 1),
    })
    const paymentHash = id as PaymentHash

    for (let i = 0; i < 2; i++) {
      const result = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: request,
        senderAccount,
        senderWalletId,
        memo,
      })
      expect(result).toBeInstanceOf(RouteNotFoundError)
    }

    // Undo last failed payment to be pending
    const txns = await ledger.getTransactionsByWalletId(senderWalletId)
    if (txns instanceof Error) throw txns
    const txnsByHash = txns
      // filter on "LedgerTransactionType.Payment" because this is what updatePending counts
      .filter((tx) => tx.type === LedgerTransactionType.Payment)
      .filter((tx) => tx.paymentHash === paymentHash)
      .sort((txA, txB) => txA.timestamp.getTime() - txB.timestamp.getTime())
      .reverse()

    const voidTxn = txnsByHash.find((txn) => txn.lnMemo === "Payment canceled")
    if (voidTxn === undefined) {
      throw new Error("Missing expected voiding txn")
    }
    const originalTxn = txnsByHash.find((txn) => txn.lnMemo !== "Payment canceled")
    if (originalTxn === undefined) {
      throw new Error("Missing expected txn")
    }
    await markFailedTransactionAsPending(originalTxn.journalId)

    // Check that last txn was successfully undone and is pending
    const originalTxnPending = await ledger.getTransactionById(originalTxn.id)
    if (originalTxnPending instanceof Error) throw originalTxnPending
    expect(originalTxnPending.pendingConfirmation).toBeTruthy()
    const txnsPending = await ledger.getTransactionsByWalletId(senderWalletId)
    if (txnsPending instanceof Error) throw txnsPending
    expect(txnsPending[0].lnMemo).not.toBe("Payment canceled")

    const isRecordedPending = await ledger.isLnTxRecorded(paymentHash)
    expect(isRecordedPending).toBeFalsy()

    // Run update pending payments
    await Payments.updatePendingPaymentByHash({
      paymentHash,
      logger: baseLogger,
    })

    // Check if last txn is successfully voided
    const originalTxnVoided = await ledger.getTransactionById(originalTxn.id)
    if (originalTxnVoided instanceof Error) throw originalTxnVoided
    expect(originalTxnVoided.pendingConfirmation).toBeFalsy()
    const txnsVoided = await ledger.getTransactionsByWalletId(senderWalletId)
    if (txnsVoided instanceof Error) throw txnsVoided
    expect(txnsVoided[0].lnMemo).toBe("Payment canceled")

    const isRecordedVoided = await ledger.isLnTxRecorded(paymentHash)
    expect(isRecordedVoided).toBeTruthy()
  })
})

describe("UserWalletLimit - handles 1 sat send with high btc outgoing volume", () => {
  const usdLimit = toCents(100_000)

  const accountLimits = {
    intraLedgerLimit: usdLimit,
    withdrawalLimit: usdLimit,
    tradeIntraAccountLimit: usdLimit,
  }

  const walletVolumes = [
    {
      outgoingBaseAmount: {
        amount: BigInt(usdLimit),
        currency: WalletCurrency.Btc,
      },
      incomingBaseAmount: { amount: 0n, currency: WalletCurrency.Btc },
    },
    {
      outgoingBaseAmount: { amount: 0n, currency: WalletCurrency.Usd },
      incomingBaseAmount: { amount: 0n, currency: WalletCurrency.Usd },
    },
  ]

  const mockedCheckWithdrawalLimits = ({
    amount,
    priceRatio,
  }: {
    amount: UsdPaymentAmount
    priceRatio: WalletPriceRatio
  }) => {
    return AccountLimitsChecker({
      accountLimits,
      priceRatio,
    }).checkWithdrawal({
      amount,
      walletVolumes,
    })
  }

  const mockedCheckIntraledgerLimits = ({
    amount,
    priceRatio,
  }: {
    amount: UsdPaymentAmount
    priceRatio: WalletPriceRatio
  }) => {
    return AccountLimitsChecker({
      accountLimits,
      priceRatio,
    }).checkIntraledger({
      amount,
      walletVolumes,
    })
  }

  it("estimate fee for zero amount invoice with 1 sat amount", async () => {
    jest
      .spyOn(PaymentsHelpers, "checkWithdrawalLimits")
      .mockImplementationOnce(mockedCheckWithdrawalLimits)
      .mockImplementationOnce(mockedCheckWithdrawalLimits)

    const senderWalletId = walletIdB
    const { request } = await createInvoice({ lnd: lndOutside1 })

    // Estimate fee with 2,000 sats
    const { error } = await Payments.getNoAmountLightningFeeEstimationForBtcWallet({
      walletId: senderWalletId,
      uncheckedPaymentRequest: request,
      amount: toSats(2_000),
    })
    expect(error).not.toBeInstanceOf(Error)

    // Estimate fee with 1 sat
    // This tests that a suitable WalletPriceRatio is passed into limits checker
    const { error: error1Sat } =
      await Payments.getNoAmountLightningFeeEstimationForBtcWallet({
        walletId: senderWalletId,
        uncheckedPaymentRequest: request,
        amount: toSats(1),
      })
    expect(error1Sat).not.toBeInstanceOf(Error)
  })

  it("pay zero amount invoice with 1 sat amount", async () => {
    jest
      .spyOn(PaymentsHelpers, "checkWithdrawalLimits")
      .mockImplementationOnce(mockedCheckWithdrawalLimits)

    const senderWalletId = walletIdB
    const senderAccount = accountB
    const { request } = await createInvoice({ lnd: lndOutside1 })

    const paid = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
      senderWalletId,
      senderAccount,
      uncheckedPaymentRequest: request,
      amount: toSats(1),
      memo: "",
    })
    expect(paid).not.toBeInstanceOf(Error)
  })

  it("pay other Galoy user with 1 sat amount", async () => {
    jest
      .spyOn(PaymentsHelpers, "checkIntraledgerLimits")
      .mockImplementationOnce(mockedCheckIntraledgerLimits)

    const senderWalletId = walletIdB
    const senderAccount = accountB
    const paidIntraledger = Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      senderWalletId,
      senderAccount,
      recipientWalletId: walletIdC,
      amount: toSats(1),
      memo: "",
    })
    expect(paidIntraledger).not.toBeInstanceOf(Error)
  })
})
