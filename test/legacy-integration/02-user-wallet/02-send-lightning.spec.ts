import { createHash, randomBytes } from "crypto"

import { getLocale, ONE_DAY } from "@config"

import { Lightning, Payments, Prices, Wallets } from "@app"
import * as PaymentsHelpers from "@app/payments/helpers"
import {
  btcFromUsdMidPriceFn,
  getCurrentPriceAsDisplayPriceRatio,
  usdFromBtcMidPriceFn,
} from "@app/prices"

import { AccountLimitsChecker } from "@domain/accounts"
import { toSats } from "@domain/bitcoin"
import {
  decodeInvoice,
  defaultTimeToExpiryInSeconds,
  InvalidFeeProbeStateError,
  InvoiceExpiredOrBadPaymentHashError,
  LightningServiceError,
  MaxFeeTooLargeForRoutelessPaymentError,
  PaymentNotFoundError,
  PaymentSendStatus,
  PaymentStatus,
  RouteNotFoundError,
} from "@domain/bitcoin/lightning"
import { InsufficientBalanceError as DomainInsufficientBalanceError } from "@domain/errors"
import { DisplayCurrency, toCents } from "@domain/fiat"
import { LedgerTransactionType } from "@domain/ledger"
import { ImbalanceCalculator } from "@domain/ledger/imbalance-calculator"
import { NotificationType } from "@domain/notifications"
import {
  LnFees,
  LnPaymentRequestInTransitError,
  WalletPriceRatio,
  ZeroAmountForUsdRecipientError,
} from "@domain/payments"
import * as LnFeesImpl from "@domain/payments/ln-fees"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  ValidationError,
  WalletCurrency,
  ZERO_SATS,
} from "@domain/shared"
import { PaymentInitiationMethod, WithdrawalFeePriceMethod } from "@domain/wallets"
import { Account, WalletInvoice } from "@services/mongoose/schema"
import { toObjectId } from "@services/mongoose/utils"

import { DealerPriceService } from "@services/dealer-price"
import { LedgerService } from "@services/ledger"
import { getDealerUsdWalletId } from "@services/ledger/caching"
import { TransactionsMetadataRepository } from "@services/ledger/services"
import { LndService } from "@services/lnd"
import { getActiveLnd } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import {
  AccountsRepository,
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
  decodePaymentRequest,
  fundWalletIdFromOnchain,
  getAccountByPhone,
  getAccountRecordByPhone,
  getBalanceHelper,
  getChannel,
  getChannels,
  getDefaultWalletIdByPhone,
  getHash,
  getInvoice,
  getInvoiceAttempt,
  getTransactionsForWalletId,
  getUsdWalletIdByPhone,
  lnd1,
  lndOutside1,
  lndOutside2,
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
    getValuesToSkipProbe: jest.fn().mockReturnValue({
      pubkey: ["038f8f113c580048d847d6949371726653e02b928196bad310e3eda39ff61723f6"],
      chanId: ["1x0x0"],
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

let initBalanceA: Satoshis, initBalanceB: Satoshis, initBalanceUsdB: UsdCents
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
let walletIdUsdA: WalletId

let walletDescriptorB: WalletDescriptor<WalletCurrency>

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
  walletIdUsdA = await getUsdWalletIdByPhone(phoneA)
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

  walletDescriptorB = {
    id: walletIdB,
    currency: WalletCurrency.Btc,
    accountId: accountB.id,
  }
})

beforeEach(async () => {
  initBalanceA = toSats(await getBalanceHelper(walletIdA))
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
  it("sends to another Galoy user an amount less than 1 cent", async () => {
    const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
      walletId: walletIdC as WalletId,
      amount: toSats(1),
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: invoice } = lnInvoice

    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest: invoice,
      memo: null,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    expect(paymentResult).not.toBeInstanceOf(Error)
    if (paymentResult instanceof Error) throw paymentResult

    expect(paymentResult).toBe(PaymentSendStatus.Success)
  })

  it.skip("sends to another Galoy user a push payment", async () => {
    const sendNotification = jest.fn()
    jest
      .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
      .mockImplementationOnce(() => ({ sendNotification }))

    const res = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      recipientWalletId: walletIdA,
      memo: "",
      amount: amountInvoice,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    if (res instanceof Error) throw res

    const finalBalanceA = await getBalanceHelper(walletIdA)
    const { result: txWalletA, error } = await getTransactionsForWalletId(walletIdA)
    if (error instanceof Error || txWalletA === null) {
      throw error
    }

    const finalBalanceB = await getBalanceHelper(walletIdB)
    const txResult = await getTransactionsForWalletId(walletIdB)
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const userBTransaction = txResult.result.slice
    expect(res).toBe(PaymentSendStatus.Success)
    expect(finalBalanceA).toBe(initBalanceA + amountInvoice)
    expect(finalBalanceB).toBe(initBalanceB - amountInvoice)

    expect(txWalletA.slice[0].initiationVia).toHaveProperty(
      "type",
      PaymentInitiationMethod.IntraLedger,
    )
    expect(txWalletA.slice[0].initiationVia).toHaveProperty(
      "counterPartyUsername",
      usernameB,
    )
    expect(userBTransaction[0].initiationVia).toHaveProperty(
      "counterPartyUsername",
      usernameA,
    )
    expect(userBTransaction[0].initiationVia).toHaveProperty(
      "type",
      PaymentInitiationMethod.IntraLedger,
    )

    await sleep(1000)

    const satsPrice = await Prices.getCurrentSatPrice({ currency: DisplayCurrency.Usd })
    if (satsPrice instanceof Error) throw satsPrice

    const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
      currency: DisplayCurrency.Usd,
    })
    if (displayPriceRatio instanceof Error) throw displayPriceRatio

    const paymentAmount = { amount: BigInt(amountInvoice), currency: WalletCurrency.Btc }
    const displayPaymentAmount = displayPriceRatio.convertFromWallet(paymentAmount)

    const { title: titleReceipt, body: bodyReceipt } = createPushNotificationContent({
      type: NotificationType.IntraLedgerReceipt,
      userLanguage: locale as UserLanguage,
      amount: paymentAmount,
      displayAmount: displayPaymentAmount,
    })

    expect(sendNotification.mock.calls.length).toBe(1)
    expect(sendNotification.mock.calls[0][0].title).toBe(titleReceipt)
    expect(sendNotification.mock.calls[0][0].body).toBe(bodyReceipt)

    let accountRecordA = await getAccountRecordByPhone(phoneA)
    let accountRecordB = await getAccountRecordByPhone(phoneB)

    expect(accountRecordA.contacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: usernameB })]),
    )
    const contactA = accountRecordA.contacts.find(
      (userContact) => userContact.id === usernameB,
    )
    const txnCountA = contactA?.transactionsCount || 0

    expect(accountRecordB.contacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: usernameA })]),
    )
    const contact1 = accountRecordB.contacts.find(
      (userContact) => userContact.id === usernameA,
    )
    const txnCount1 = contact1?.transactionsCount || 0

    const res2 = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      recipientWalletId: walletIdA,
      memo: "",
      amount: amountInvoice,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    if (res2 instanceof Error) throw res2
    expect(res2).toBe(PaymentSendStatus.Success)

    accountRecordA = await getAccountRecordByPhone(phoneA)
    expect(accountRecordA.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: usernameB,
          transactionsCount: txnCountA + 1,
        }),
      ]),
    )
    accountRecordB = await getAccountRecordByPhone(phoneB)
    expect(accountRecordB.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: usernameA,
          transactionsCount: txnCount1 + 1,
        }),
      ]),
    )
  })

  it("pay zero amount invoice", async () => {
    const imbalanceCalc = ImbalanceCalculator({
      method: WithdrawalFeePriceMethod.proportionalOnImbalance,
      sinceDaysAgo: ONE_DAY,
      volumeLightningFn: LedgerService().lightningTxBaseVolumeSince,
      volumeOnChainFn: LedgerService().onChainTxBaseVolumeSince,
    })

    const imbalanceInit = await imbalanceCalc.getSwapOutImbalanceAmount(walletDescriptorB)
    if (imbalanceInit instanceof Error) throw imbalanceInit

    const { request, secret, id } = await createInvoice({ lnd: lndOutside1 })
    const paymentHash = id as PaymentHash
    const revealedPreImage = secret as RevealedPreImage

    // Test payment is successful
    const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
      uncheckedPaymentRequest: request,
      memo: null,
      amount: amountInvoice,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    if (paymentResult instanceof Error) throw paymentResult
    expect(paymentResult).toBe(PaymentSendStatus.Success)

    const txns = await LedgerService().getTransactionsByHash(paymentHash)
    if (txns instanceof Error) throw txns

    const btcPaymentAmount = paymentAmountFromNumber({
      amount: amountInvoice,
      currency: WalletCurrency.Btc,
    })
    if (btcPaymentAmount instanceof Error) return btcPaymentAmount

    const usdPaymentAmount = await usdFromBtcMidPriceFn(btcPaymentAmount)
    if (usdPaymentAmount instanceof Error) throw usdPaymentAmount
    const cents = Number(usdPaymentAmount.amount)

    // Check transaction metadata for BTC 'LedgerTransactionType.Payment'
    // ===
    const txnPayment = txns.find((tx) => tx.type === LedgerTransactionType.Payment)
    expect(txnPayment).not.toBeUndefined()
    if (!txnPayment?.centsAmount) throw new Error("centsAmount missing from payment")
    if (!txnPayment?.satsAmount) throw new Error("satsAmount missing from payment")
    if (!txnPayment?.centsFee) throw new Error("centsFee missing from payment")
    if (!txnPayment?.satsFee) throw new Error("satsFee missing from payment")
    expect(amountInvoice).toEqual(txnPayment.satsAmount)
    expect(Number(usdPaymentAmount.amount)).toEqual(txnPayment.centsAmount)

    const priceRatio = WalletPriceRatio({
      usd: usdPaymentAmount,
      btc: btcPaymentAmount,
    })
    if (priceRatio instanceof Error) throw priceRatio

    const feeAmountSats = LnFees().maxProtocolAndBankFee({
      amount: BigInt(amountInvoice),
      currency: WalletCurrency.Btc,
    })
    const satsFee = toSats(feeAmountSats.amount)

    const feeAmountCents = priceRatio.convertFromBtc(feeAmountSats)
    const centsFee = toCents(feeAmountCents.amount)

    const expectedFields = {
      type: LedgerTransactionType.Payment,

      debit: amountInvoice + satsFee,
      credit: 0,

      satsAmount: amountInvoice,
      satsFee,
      centsAmount: cents,
      centsFee,
      displayAmount: cents,
      displayFee: centsFee,

      displayCurrency: DisplayCurrency.Usd,
    }
    expect(txnPayment).toEqual(expect.objectContaining(expectedFields))

    // Test fee reimbursement amounts
    const txnFeeReimburse = txns.find(
      (tx) => tx.type === LedgerTransactionType.LnFeeReimbursement,
    )

    expect(txnFeeReimburse).not.toBeUndefined()
    expect(txnFeeReimburse).toEqual(
      expect.objectContaining({
        debit: 0,
        credit: toSats(feeAmountSats.amount),

        satsAmount: toSats(feeAmountSats.amount),
        satsFee: 0,
        centsAmount: centsFee,
        centsFee: 0,
        displayAmount: centsFee,
        displayFee: 0,

        displayCurrency: DisplayCurrency.Usd,
      }),
    )

    // Test metadata is correctly persisted
    const txns_metadata = await Promise.all(
      txns.map(async (txn) => TransactionsMetadataRepository().findById(txn.id)),
    )
    expect(txns_metadata).toHaveLength(txns.length)

    const metadataCheck = txns_metadata.every((txn) => !(txn instanceof Error))
    expect(metadataCheck).toBeTruthy()
    if (!metadataCheck) throw txns_metadata.find((txn) => txn instanceof Error)

    const revealedPreImages = new Set(
      txns_metadata.map((txn) =>
        txn instanceof Error
          ? txn
          : "revealedPreImage" in txn
          ? txn.revealedPreImage
          : undefined,
      ),
    )
    expect(revealedPreImages.size).toEqual(1)
    expect(revealedPreImages.has(revealedPreImage)).toBeTruthy()

    const paymentHashes = new Set(
      txns_metadata.map((txn) =>
        txn instanceof Error ? txn : "hash" in txn ? txn.hash : undefined,
      ),
    )
    expect(paymentHashes.size).toEqual(1)
    expect(paymentHashes.has(paymentHash)).toBeTruthy()

    const finalBalance = await getBalanceHelper(walletIdB)
    expect(finalBalance).toBe(initBalanceB - amountInvoice)

    const imbalanceFinal = await imbalanceCalc.getSwapOutImbalanceAmount(
      walletDescriptorB,
    )
    if (imbalanceFinal instanceof Error) throw imbalanceFinal

    // imbalance is reduced with lightning payment
    expect(Number(imbalanceFinal.amount)).toBe(
      Number(imbalanceInit.amount) - amountInvoice,
    )
  })

  it("pay zero amount invoice & revert txn when verifyMaxFee fails", async () => {
    const { LnFees: LnFeesOrig } = jest.requireActual("@domain/payments/ln-fees")
    jest
      .spyOn(LnFeesImpl, "LnFees")
      // 1st call is in PaymentFlow
      .mockReturnValueOnce({
        ...LnFeesOrig(),
      })
      // 2nd call is in use-case at verifyMaxFee
      .mockReturnValueOnce({
        ...LnFeesOrig(),
        verifyMaxFee: () => new MaxFeeTooLargeForRoutelessPaymentError(),
      })

    const { request, id } = await createInvoice({ lnd: lndOutside1 })
    const paymentHash = id as PaymentHash

    const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
      uncheckedPaymentRequest: request,
      memo: null,
      amount: amountInvoice,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    expect(paymentResult).toBeInstanceOf(MaxFeeTooLargeForRoutelessPaymentError)

    const txns = await LedgerService().getTransactionsByHash(paymentHash)
    if (txns instanceof Error) throw txns

    const { satsAmount, satsFee } = txns[0]
    expect(txns.length).toEqual(2)
    expect(txns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lnMemo: "Payment canceled",
          credit: (satsAmount || 0) + (satsFee || 0),
          debit: 0,
          pendingConfirmation: false,
        }),
        expect.objectContaining({
          lnMemo: "",
          debit: (satsAmount || 0) + (satsFee || 0),
          credit: 0,
          pendingConfirmation: false,
        }),
      ]),
    )
  })

  it("pay zero amount invoice with amount less than 1 cent", async () => {
    const { request } = await createInvoice({ lnd: lndOutside1 })

    // Test payment is successful
    const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
      uncheckedPaymentRequest: request,
      memo: null,
      amount: toSats(1),
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    if (paymentResult instanceof Error) throw paymentResult
    expect(paymentResult).toBe(PaymentSendStatus.Success)
  })

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

  it.skip("filters spam from send to another Galoy user as push payment", async () => {
    // TODO: good candidate for a unit test?

    const satsBelow = 100
    const memoSpamBelowThreshold = "Spam BELOW threshold"
    const resBelowThreshold = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      recipientWalletId: walletIdA,
      memo: memoSpamBelowThreshold,
      amount: toSats(satsBelow),
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    if (resBelowThreshold instanceof Error) throw resBelowThreshold

    const satsAbove = 1100
    const memoSpamAboveThreshold = "Spam ABOVE threshold"
    const resAboveThreshold = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      recipientWalletId: walletIdA,
      memo: memoSpamAboveThreshold,
      amount: toSats(satsAbove),
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    if (resAboveThreshold instanceof Error) throw resAboveThreshold

    let txResult = await getTransactionsForWalletId(walletIdA)
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const userTransaction0 = txResult.result.slice
    const transaction0Above = userTransaction0[0]
    const transaction0Below = userTransaction0[1]

    txResult = await getTransactionsForWalletId(walletIdB)
    if (txResult.error instanceof Error || txResult.result === null) {
      throw txResult.error
    }
    const userBTransaction = txResult.result.slice
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
    const accountRecordA = await getAccountRecordByPhone(phoneA)
    const accountRecordB = await getAccountRecordByPhone(phoneB)

    expect(accountRecordA.contacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: usernameB })]),
    )

    expect(accountRecordB.contacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: usernameA })]),
    )
  })

  it("fails when user has insufficient balance", async () => {
    const { request: invoice } = await createInvoice({
      lnd: lndOutside1,
      tokens: initBalanceB + 100,
    })
    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest: invoice,
      memo: null,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    expect(paymentResult).toBeInstanceOf(DomainInsufficientBalanceError)
  })

  it("fails to pay when channel capacity exceeded", async () => {
    const { request } = await createInvoice({ lnd: lndOutside1, tokens: 1500000 })
    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest: request,
      memo: null,
      senderWalletId: walletIdA,
      senderAccount: accountA,
    })
    expect(paymentResult).toBeInstanceOf(LightningServiceError)
  })

  it("fails to pay zero amount invoice without separate amount", async () => {
    const { request } = await createInvoice({ lnd: lndOutside1 })
    // TODO: use custom ValidationError not apollo error
    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest: request,
      memo: null,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    expect(paymentResult).toBeInstanceOf(ValidationError)
  })

  it("fails if user sends balance amount without accounting for fee", async () => {
    const res = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      recipientWalletId: walletIdH,
      memo: "",
      amount: toSats(1000),
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    expect(res).not.toBeInstanceOf(Error)
    if (res instanceof Error) return res

    const balance = await getBalanceHelper(walletIdH)
    const { request } = await createInvoice({ lnd: lndOutside1, tokens: balance })

    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest: request,
      memo: null,
      senderWalletId: walletIdH,
      senderAccount: accountH,
    })
    expect(paymentResult).toBeInstanceOf(DomainInsufficientBalanceError)
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

  it("skips fee probe for flagged pubkeys", async () => {
    const sats = toSats(1000)
    const feeProbeCallCount = () => lndServiceCallCount.findRouteForInvoice

    // Test that non-flagged destination calls feeProbe lightning service method
    const { request } = await createInvoice({ lnd: lndOutside1, tokens: sats })
    let feeProbeCallsBefore = feeProbeCallCount()
    const { result: fee, error } = await Payments.getLightningFeeEstimationForBtcWallet({
      walletId: walletIdH,
      uncheckedPaymentRequest: request,
    })
    expect(feeProbeCallCount()).toEqual(feeProbeCallsBefore + 1)
    expect(error).not.toBeInstanceOf(Error)
    expect(fee).toStrictEqual({ amount: 0n, currency: WalletCurrency.Btc })

    // Test that flagged destination skips feeProbe lightning service method
    const skippedPubkeyRequest =
      "lnbc10u1p3w0mf7pp5v9xg3eksnsyrsa3vk5uv00rvye4wf9n0744xgtx0kcrafeanvx7sdqqcqzzgxqyz5vqrzjqwnvuc0u4txn35cafc7w94gxvq5p3cu9dd95f7hlrh0fvs46wpvhddrwgrqy63w5eyqqqqryqqqqthqqpyrzjqw8c7yfutqqy3kz8662fxutjvef7q2ujsxtt45csu0k688lkzu3lddrwgrqy63w5eyqqqqryqqqqthqqpysp53n0sc9hvqgdkrv4ppwrm2pa0gcysa8r2swjkrkjnxkcyrsjmxu4s9qypqsq5zvh7glzpas4l9ptxkdhgefyffkn8humq6amkrhrh2gq02gv8emxrynkwke3uwgf4cfevek89g4020lgldxgusmse79h4caqg30qq2cqmyrc7d" as EncodedPaymentRequest
    const skippedPubkeyInvoice = decodeInvoice(skippedPubkeyRequest)
    if (skippedPubkeyInvoice instanceof Error) throw skippedPubkeyInvoice
    if (!skippedPubkeyInvoice.paymentAmount) throw new Error("No-amount Invoice")
    expect(skippedPubkeyInvoice.paymentAmount.amount).toEqual(BigInt(sats))

    feeProbeCallsBefore = feeProbeCallCount()
    const { result: feeSkippedPubkey, error: errorSkippedPubkey } =
      await Payments.getLightningFeeEstimationForBtcWallet({
        walletId: walletIdH,
        uncheckedPaymentRequest: skippedPubkeyRequest,
      })
    expect(feeProbeCallCount()).toEqual(feeProbeCallsBefore)
    expect(errorSkippedPubkey).toBeUndefined()
    expect(feeSkippedPubkey).toStrictEqual(
      LnFees().maxProtocolAndBankFee(skippedPubkeyInvoice.paymentAmount),
    )
  })

  it("skips fee probe for flagged chanIds", async () => {
    const sats = toSats(100_000)
    const feeProbeCallCount = () => lndServiceCallCount.findRouteForInvoice

    // Test that non-flagged destination calls feeProbe lightning service method
    const { request } = await createInvoice({ lnd: lndOutside1, tokens: sats })
    let feeProbeCallsBefore = feeProbeCallCount()
    const { result: fee, error } = await Payments.getLightningFeeEstimationForBtcWallet({
      walletId: walletIdH,
      uncheckedPaymentRequest: request,
    })
    expect(feeProbeCallCount()).toEqual(feeProbeCallsBefore + 1)
    expect(error).not.toBeInstanceOf(Error)
    expect(fee).toStrictEqual({ amount: 0n, currency: WalletCurrency.Btc })

    // Test that flagged destination skips feeProbe lightning service method
    const skippedChanIdRequest =
      "lnbc1m1pjz2963pp5eeed387k90rxz9ggkarh3qzf42tw5epay0v3adv79aldgjf2a0nqdqqcqzpgxqrrssrzjqvgptfurj3528snx6e3dtwepafxw5fpzdymw9pj20jj09sunnqmwqqqqqyqqqqqqqqqqqqlgqqqqqqgqjqnp4qdruvn0zq9wqqhtryvch753zm6hqq4kyt48dsstkemjjc3njvggnqsp5s4pla42w34ekurw8ywfwjpwcakz5h3ynn8hx5znfckda8udmn5sq9qyyssq4sll8vh2n6kds0ht7l942jqa33nrrrhd9fhfdrdfec6mwtms05ppdrnztn2zg87cm4q7lye39f0gmt9tpjwy26hafrkqza4esjmctuqpxchx3a" as EncodedPaymentRequest
    const skippedChanIdInvoice = decodeInvoice(skippedChanIdRequest)
    if (skippedChanIdInvoice instanceof Error) throw skippedChanIdInvoice
    if (!skippedChanIdInvoice.paymentAmount) throw new Error("No-amount Invoice")
    expect(skippedChanIdInvoice.paymentAmount.amount).toEqual(BigInt(sats))

    feeProbeCallsBefore = feeProbeCallCount()
    const { result: feeSkippedChanId, error: errorSkippedChanId } =
      await Payments.getLightningFeeEstimationForBtcWallet({
        walletId: walletIdH,
        uncheckedPaymentRequest: skippedChanIdRequest,
      })
    expect(feeProbeCallCount()).toEqual(feeProbeCallsBefore)
    expect(errorSkippedChanId).toBeUndefined()
    expect(feeSkippedChanId).toStrictEqual(
      LnFees().maxProtocolAndBankFee(skippedChanIdInvoice.paymentAmount),
    )
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

      it("pay msats invoice", async () => {
        const milliSatsAmount = amountInvoice * 1000 + 1
        const { request } = await createInvoice({
          lnd: lndOutside1,
          mtokens: milliSatsAmount + "",
        })
        const result = await fn({ account: accountB, walletId: walletIdB })({
          invoice: request,
        })
        if (result instanceof Error) throw result
        expect(result).toBe(PaymentSendStatus.Success)

        const finalBalance = await getBalanceHelper(walletIdB)
        expect(finalBalance).toBe(initBalanceB - Math.ceil(milliSatsAmount / 1000))
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
        const intermediateBalanceSats = await getBalanceHelper(walletIdB)

        const result = await fn({ account: accountB, walletId: walletIdB })({
          invoice: request,
        })
        if (result instanceof Error) throw result
        expect(result).toBe(PaymentSendStatus.AlreadyPaid)

        const finalBalanceSats = await getBalanceHelper(walletIdB)
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

      it("pay invoice routed to lnd outside2", async () => {
        const amountInvoice = 199
        const { request } = await createInvoice({
          lnd: lndOutside2,
          tokens: amountInvoice,
          is_including_private_channels: true,
        })

        const initialBalance = await getBalanceHelper(walletIdB)

        const result = await fn({ account: accountB, walletId: walletIdB })({
          invoice: request,
          memo: "pay an unconnected node",
        })
        if (result instanceof Error) throw result

        // wait for balance updates because invoice event
        // arrives before wallet balances updates in lnd
        await waitUntilChannelBalanceSyncIntegration()

        expect(result).toBe(PaymentSendStatus.Success)
        const finalBalance = await getBalanceHelper(walletIdB)

        // Calculate fee from routed payment
        const { channels } = await getChannels({ lnd: lndOutside2 })
        expect(channels && channels.length).toEqual(1)
        const { id } = channels[0]
        const { policies } = await getChannel({ id, lnd: lndOutside2 })

        const partnerPolicy = policies.find(
          (pol) => pol.public_key !== (process.env.LND_OUTSIDE_2_PUBKEY as Pubkey),
        )
        if (partnerPolicy === undefined) throw new Error("Undefined 'partnerPolicy'")
        expect(partnerPolicy.base_fee_mtokens).toBe("0")
        expect(partnerPolicy.fee_rate).toEqual(5000)

        const { base_fee_mtokens: baseMilliSats, fee_rate: feeRatePpm } = partnerPolicy
        if (baseMilliSats === undefined || feeRatePpm === undefined) {
          throw new Error("Undefined baseMilliSats or feeRatePpm")
        }
        const baseFee = parseInt(baseMilliSats, 10) / 1000
        const feeRate = (amountInvoice * feeRatePpm) / 1_000_000
        const fee = Math.ceil(baseFee + feeRate)

        expect(finalBalance).toBe(initialBalance - amountInvoice - fee)
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
        expect(paymentAfterFailed).toBeInstanceOf(InvoiceExpiredOrBadPaymentHashError)

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

describe("USD Wallets - Lightning Pay", () => {
  // TODO: add probing scenarios
  describe("Lightning invoices with amounts", () => {
    it("pay external invoice from usd wallet", async () => {
      const senderAccount = accountB
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))

      const amountPayment = toSats(100)

      const { id: rawPaymentHash, request } = await createInvoice({
        lnd: lndOutside1,
        tokens: amountPayment,
      })

      const paymentResult = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: request,
        memo: null,
        senderWalletId: walletIdUsdB,
        senderAccount,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      const usdAmount = await dealerFns.getCentsFromSatsForImmediateSell({
        amount: BigInt(amountPayment),
        currency: WalletCurrency.Btc,
      })
      if (usdAmount instanceof Error) throw usdAmount
      const cents = Number(usdAmount.amount)

      const feeAmountSats = LnFees().maxProtocolAndBankFee({
        amount: BigInt(amountPayment),
        currency: WalletCurrency.Btc,
      })

      // Check transaction metadata for USD 'LedgerTransactionType.Payment'
      // ===
      const txns = await LedgerService().getTransactionsByHash(
        rawPaymentHash as PaymentHash,
      )
      if (txns instanceof Error) throw txns

      const txnPayment = txns.find((tx) => tx.type === LedgerTransactionType.Payment)
      expect(txnPayment).not.toBeUndefined()
      if (!txnPayment?.centsAmount) throw new Error("centsAmount missing from payment")
      if (!txnPayment?.satsAmount) throw new Error("satsAmount missing from payment")
      if (!txnPayment?.centsFee) throw new Error("centsFee missing from payment")
      if (!txnPayment?.satsFee) throw new Error("satsFee missing from payment")
      expect(amountPayment).toEqual(txnPayment.satsAmount)
      expect(cents).toEqual(txnPayment.centsAmount)

      const btcPaymentAmount = {
        amount: BigInt(amountPayment),
        currency: WalletCurrency.Btc,
      }
      const usdPaymentAmount = { amount: BigInt(cents), currency: WalletCurrency.Usd }
      const priceRatio = WalletPriceRatio({
        usd: usdPaymentAmount,
        btc: btcPaymentAmount,
      })
      if (priceRatio instanceof Error) throw priceRatio
      const feeAmountCents = priceRatio.convertFromBtcToCeil(feeAmountSats)

      const satsFee = Number(feeAmountSats.amount)
      const centsFee = Number(feeAmountCents.amount)

      const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
        currency: senderAccount.displayCurrency,
      })
      if (displayPriceRatio instanceof Error) throw displayPriceRatio
      const displayAmount = Number(
        displayPriceRatio.convertFromWallet(btcPaymentAmount).amountInMinor,
      )
      const displayFee = Number(
        displayPriceRatio.convertFromWallet(feeAmountSats).amountInMinor,
      )

      const expectedFields = {
        type: LedgerTransactionType.Payment,

        debit: cents + centsFee,
        credit: 0,

        satsAmount: amountPayment,
        satsFee,
        centsAmount: cents,
        centsFee,
        displayAmount:
          senderAccount.displayCurrency === DisplayCurrency.Usd ? cents : displayAmount,
        displayFee:
          senderAccount.displayCurrency === DisplayCurrency.Usd ? centsFee : displayFee,

        displayCurrency: DisplayCurrency.Usd,
      }
      expect(txnPayment).toEqual(expect.objectContaining(expectedFields))

      // Check final balances
      // ===
      const finalBalance = await getBalanceHelper(walletIdUsdB)
      expect(finalBalance).toBe(initBalanceUsdB - cents)
    })

    it("pay internal invoice from usd wallet to usd wallet", async () => {
      const initBalanceUsdA = toCents(await getBalanceHelper(walletIdUsdA))
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))

      const amountPayment = toCents(6)

      const request = await Wallets.addInvoiceForSelfForUsdWallet({
        walletId: walletIdUsdA,
        amount: amountPayment,
      })
      if (request instanceof Error) throw request
      const { paymentRequest: uncheckedPaymentRequest } = request

      const paymentResult = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: walletIdUsdB,
        senderAccount: accountB,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      const finalBalanceB = await getBalanceHelper(walletIdUsdB)
      const finalBalanceA = await getBalanceHelper(walletIdUsdA)

      expect(finalBalanceB).toBe(initBalanceUsdB - amountPayment)
      expect(finalBalanceA).toBe(initBalanceUsdA + amountPayment)
    })

    it("pay internal invoice from usd wallet to btc wallet", async () => {
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))
      const initBalanceA = toSats(await getBalanceHelper(walletIdA))

      const amountPayment = toSats(60)

      const request = await Wallets.addInvoiceForSelfForBtcWallet({
        walletId: walletIdA,
        amount: amountPayment,
      })
      if (request instanceof Error) throw request
      const { paymentRequest: uncheckedPaymentRequest } = request

      const paymentResult = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: walletIdUsdB,
        senderAccount: accountB,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      const usdAmount = await dealerFns.getCentsFromSatsForImmediateSell({
        amount: BigInt(amountPayment),
        currency: WalletCurrency.Btc,
      })
      if (usdAmount instanceof Error) throw usdAmount
      const cents = Number(usdAmount.amount)

      const finalBalanceB = await getBalanceHelper(walletIdUsdB)
      const finalBalanceA = await getBalanceHelper(walletIdA)

      expect(finalBalanceB).toBe(initBalanceUsdB - cents)
      expect(finalBalanceA).toBe(initBalanceA + amountPayment)
    })

    it("pay internal invoice from btc wallet to usd wallet", async () => {
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))
      const initBalanceA = toSats(await getBalanceHelper(walletIdA))

      const amountPayment = toCents(3)

      const request = await Wallets.addInvoiceForSelfForUsdWallet({
        walletId: walletIdUsdB,
        amount: amountPayment,
      })
      if (request instanceof Error) throw request
      const { paymentRequest: uncheckedPaymentRequest } = request

      const paymentResult = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: walletIdA,
        senderAccount: accountA,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      const btcAmount = await dealerFns.getSatsFromCentsForFutureBuy({
        amount: BigInt(amountPayment),
        currency: WalletCurrency.Usd,
      })
      if (btcAmount instanceof Error) throw btcAmount
      const sats = Number(btcAmount.amount)

      const finalBalanceB = await getBalanceHelper(walletIdUsdB)
      const finalBalanceA = await getBalanceHelper(walletIdA)

      expect(finalBalanceB).toBe(initBalanceUsdB + amountPayment)
      expect(finalBalanceA).toBe(initBalanceA - sats)
    })

    it("fails to pay internal invoice with less-than-1-cent amount from btc wallet to usd wallet", async () => {
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))
      const initBalanceA = toSats(await getBalanceHelper(walletIdA))

      const amountPayment = toSats(1)

      const request = await Wallets.addInvoiceNoAmountForSelf({
        walletId: walletIdUsdB,
      })
      if (request instanceof Error) throw request
      const { paymentRequest: uncheckedPaymentRequest } = request

      const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: walletIdA,
        senderAccount: accountA,
        amount: amountPayment,
      })
      expect(paymentResult).toBeInstanceOf(ZeroAmountForUsdRecipientError)

      const finalBalanceB = await getBalanceHelper(walletIdUsdB)
      const finalBalanceA = await getBalanceHelper(walletIdA)

      expect(finalBalanceB).toBe(initBalanceUsdB)
      expect(finalBalanceA).toBe(initBalanceA)
    })
  })

  describe("No amount lightning invoices", () => {
    it("pay external amountless invoice from usd wallet", async () => {
      const dealerUsdWalletId = await getDealerUsdWalletId()
      const dealerInitialUsdB = await getBalanceHelper(dealerUsdWalletId)
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))

      const { request } = await createInvoice({ lnd: lndOutside1 })

      const amountPayment = toCents(100)

      const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForUsdWallet({
        uncheckedPaymentRequest: request,
        memo: null,
        amount: amountPayment,
        senderWalletId: walletIdUsdB,
        senderAccount: accountB,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      const finalBalance = await getBalanceHelper(walletIdUsdB)
      expect(finalBalance).toBe(initBalanceUsdB - amountPayment)
      const dealerFinalBalance = await getBalanceHelper(dealerUsdWalletId)
      expect(dealerFinalBalance).toBe(dealerInitialUsdB + amountPayment)
    })

    it("pay internal amountless invoice from usd wallet to usd wallet", async () => {
      const initBalanceUsdA = toCents(await getBalanceHelper(walletIdUsdA))
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))

      const amountPayment = toCents(7)

      const request = await Wallets.addInvoiceNoAmountForSelf({
        walletId: walletIdUsdA,
      })
      if (request instanceof Error) throw request
      const { paymentRequest: uncheckedPaymentRequest } = request

      const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForUsdWallet({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: walletIdUsdB,
        senderAccount: accountB,
        amount: amountPayment,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      const finalBalanceB = await getBalanceHelper(walletIdUsdB)
      const finalBalanceA = await getBalanceHelper(walletIdUsdA)

      expect(finalBalanceB).toBe(initBalanceUsdB - amountPayment)
      expect(finalBalanceA).toBe(initBalanceUsdA + amountPayment)
    })

    it("pay internal amountless invoice from usd wallet to btc wallet", async () => {
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))
      const initBalanceA = toSats(await getBalanceHelper(walletIdA))

      const amountPayment = toCents(4)

      const request = await Wallets.addInvoiceNoAmountForSelf({
        walletId: walletIdA,
      })
      if (request instanceof Error) throw request
      const { paymentRequest: uncheckedPaymentRequest } = request

      const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForUsdWallet({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: walletIdUsdB,
        senderAccount: accountB,
        amount: amountPayment,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      const btcAmount = await dealerFns.getSatsFromCentsForImmediateSell({
        amount: BigInt(amountPayment),
        currency: WalletCurrency.Usd,
      })
      if (btcAmount instanceof Error) throw btcAmount
      const sats = Number(btcAmount.amount)

      const finalBalanceB = await getBalanceHelper(walletIdUsdB)
      const finalBalanceA = await getBalanceHelper(walletIdA)

      expect(finalBalanceB).toBe(initBalanceUsdB - amountPayment)
      expect(finalBalanceA).toBe(initBalanceA + sats)
    })

    it("pay internal amountless invoice from btc wallet to usd wallet", async () => {
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))
      const initBalanceA = toSats(await getBalanceHelper(walletIdA))

      const amountPayment = toSats(100)

      // Validate btc amount to pay
      const usdPaymentAmount = await dealerFns.getCentsFromSatsForImmediateBuy({
        amount: BigInt(amountPayment),
        currency: WalletCurrency.Btc,
      })
      expect(usdPaymentAmount).not.toBeInstanceOf(Error)
      if (usdPaymentAmount instanceof Error) throw usdPaymentAmount
      expect(usdPaymentAmount.amount).toBeGreaterThan(0n)

      // Generate invoice for btc amount and pay
      const request = await Wallets.addInvoiceNoAmountForSelf({
        walletId: walletIdUsdB,
      })
      expect(request).not.toBeInstanceOf(Error)
      if (request instanceof Error) throw request
      const { paymentRequest: uncheckedPaymentRequest } = request

      const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: walletIdA,
        senderAccount: accountA,
        amount: amountPayment,
      })
      expect(paymentResult).not.toBeInstanceOf(Error)
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      const usdAmount = await dealerFns.getCentsFromSatsForImmediateBuy({
        amount: BigInt(amountPayment),
        currency: WalletCurrency.Btc,
      })
      if (usdAmount instanceof Error) throw usdAmount
      const cents = Number(usdAmount.amount)

      const finalBalanceB = await getBalanceHelper(walletIdUsdB)
      const finalBalanceA = await getBalanceHelper(walletIdA)

      expect(finalBalanceB).toBe(initBalanceUsdB + cents)
      expect(finalBalanceA).toBe(initBalanceA - amountPayment)
    })

    it("pay self amountless invoice from usd wallet to btc wallet", async () => {
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdA))
      const initBalanceA = toSats(await getBalanceHelper(walletIdA))

      const amountPayment = toCents(4)

      const request = await Wallets.addInvoiceNoAmountForSelf({
        walletId: walletIdA,
      })
      if (request instanceof Error) throw request
      const { paymentRequest: uncheckedPaymentRequest, paymentHash } = request

      const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForUsdWallet({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: walletIdUsdA,
        senderAccount: accountA,
        amount: amountPayment,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      // Check tx type
      const txns = await LedgerService().getTransactionsByHash(paymentHash)
      if (txns instanceof Error) throw txns
      const txTypeSet = new Set(txns.map((txn) => txn.type))
      expect(txTypeSet.size).toEqual(1)
      expect(txTypeSet.has(LedgerTransactionType.LnTradeIntraAccount)).toBeTruthy()

      // Check amounts
      const btcAmount = await dealerFns.getSatsFromCentsForImmediateSell({
        amount: BigInt(amountPayment),
        currency: WalletCurrency.Usd,
      })
      if (btcAmount instanceof Error) throw btcAmount
      const sats = Number(btcAmount.amount)

      const finalBalanceB = await getBalanceHelper(walletIdUsdA)
      const finalBalanceA = await getBalanceHelper(walletIdA)

      expect(finalBalanceB).toBe(initBalanceUsdB - amountPayment)
      expect(finalBalanceA).toBe(initBalanceA + sats)
    })

    it("pay self amountless invoice from btc wallet to usd wallet", async () => {
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdA))
      const initBalanceA = toSats(await getBalanceHelper(walletIdA))

      const amountPayment = toSats(100)

      // Validate btc amount to pay
      const usdPaymentAmount = await dealerFns.getCentsFromSatsForImmediateBuy({
        amount: BigInt(amountPayment),
        currency: WalletCurrency.Btc,
      })
      expect(usdPaymentAmount).not.toBeInstanceOf(Error)
      if (usdPaymentAmount instanceof Error) throw usdPaymentAmount
      expect(usdPaymentAmount.amount).toBeGreaterThan(0n)

      // Generate invoice for and pay
      const request = await Wallets.addInvoiceNoAmountForSelf({
        walletId: walletIdUsdA,
      })
      if (request instanceof Error) throw request
      const { paymentRequest: uncheckedPaymentRequest, paymentHash } = request

      const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: walletIdA,
        senderAccount: accountA,
        amount: amountPayment,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      // Check tx type
      const txns = await LedgerService().getTransactionsByHash(paymentHash)
      if (txns instanceof Error) throw txns
      const txTypeSet = new Set(txns.map((txn) => txn.type))
      expect(txTypeSet.size).toEqual(1)
      expect(txTypeSet.has(LedgerTransactionType.LnTradeIntraAccount)).toBeTruthy()

      // Check amounts
      const usdAmount = await dealerFns.getCentsFromSatsForImmediateBuy({
        amount: BigInt(amountPayment),
        currency: WalletCurrency.Btc,
      })
      if (usdAmount instanceof Error) throw usdAmount
      const cents = Number(usdAmount.amount)

      const finalBalanceB = await getBalanceHelper(walletIdUsdA)
      const finalBalanceA = await getBalanceHelper(walletIdA)

      expect(finalBalanceB).toBe(initBalanceUsdB + cents)
      expect(finalBalanceA).toBe(initBalanceA - amountPayment)
    })
  })

  describe("Intraledger payments", () => {
    const btcSendAmount = 50_000
    const btcPromise = async () => {
      const usdAmount = await dealerFns.getCentsFromSatsForImmediateBuy({
        amount: BigInt(btcSendAmount),
        currency: WalletCurrency.Btc,
      })
      if (usdAmount instanceof Error) return usdAmount
      return Number(usdAmount.amount)
    }

    const usdSendAmount = 100
    const usdPromise = async () => {
      const btcAmount = await dealerFns.getSatsFromCentsForImmediateSell({
        amount: BigInt(usdSendAmount),
        currency: WalletCurrency.Usd,
      })
      if (btcAmount instanceof Error) return btcAmount
      return Number(btcAmount.amount)
    }

    const checkContactLogic = async ({ senderAccountId, recipientWalletId }) => {
      const senderAccount = await AccountsRepository().findById(senderAccountId)
      if (senderAccount instanceof Error) return senderAccount
      const { username: senderUsername } = senderAccount
      expect(senderUsername).not.toBeUndefined()

      const recipientWallet = await WalletsRepository().findById(recipientWalletId)
      if (recipientWallet instanceof Error) return recipientWallet
      const { accountId: recipientAccountId } = recipientWallet

      const recipientAccount = await AccountsRepository().findById(recipientAccountId)
      if (recipientAccount instanceof Error) return recipientAccount
      const { username: recipientUsername } = recipientAccount
      expect(recipientUsername).not.toBeUndefined()

      if (senderAccount.id === recipientAccount.id) {
        const senderContactInRecipientAccount = recipientAccount.contacts.find(
          (contact) => contact.id === senderUsername,
        )
        expect(senderContactInRecipientAccount).toBeUndefined()
      } else {
        const senderContactInRecipientAccount = recipientAccount.contacts.find(
          (contact) => contact.id === senderUsername,
        )
        senderUsername
          ? expect(
              senderContactInRecipientAccount && senderContactInRecipientAccount.id,
            ).toBe(senderUsername)
          : expect(senderContactInRecipientAccount).toBeUndefined()

        const recipientContactInSenderAccount = senderAccount.contacts.find(
          (contact) => contact.id === recipientUsername,
        )
        recipientUsername
          ? expect(
              recipientContactInSenderAccount && recipientContactInSenderAccount.id,
            ).toBe(recipientUsername)
          : expect(recipientContactInSenderAccount).toBeUndefined()
      }
    }

    const testIntraledgerSend = async ({
      senderWalletId,
      senderAccount,
      recipientWalletId,
      senderAmountInvoice,
      recipientAmountInvoice,
      txType = LedgerTransactionType.IntraLedger,
    }: {
      senderWalletId
      senderAccount
      recipientWalletId
      senderAmountInvoice
      recipientAmountInvoice
      txType?: LedgerTransactionType
    }) => {
      const memo = "Intraledger Memo #" + (Math.random() * 1_000_000).toFixed()

      const senderInitBalance = toSats(await getBalanceHelper(senderWalletId))
      const recipientInitBalance = toSats(await getBalanceHelper(recipientWalletId))

      const senderWallet = await WalletsRepository().findById(senderWalletId)
      if (senderWallet instanceof Error) throw senderWallet

      const recipientWallet = await WalletsRepository().findById(recipientWalletId)
      if (recipientWallet instanceof Error) throw recipientWallet

      const intraledgerPaymentSendFn =
        senderWallet.currency === WalletCurrency.Btc
          ? Payments.intraledgerPaymentSendWalletIdForBtcWallet
          : Payments.intraledgerPaymentSendWalletIdForUsdWallet
      const res = await intraledgerPaymentSendFn({
        recipientWalletId,
        memo,
        amount: senderAmountInvoice,
        senderWalletId: senderWalletId,
        senderAccount,
      })
      if (res instanceof Error) return res
      expect(res).toBe(PaymentSendStatus.Success)

      const { result: txWalletA, error } = await getTransactionsForWalletId(
        recipientWalletId,
      )
      if (error instanceof Error || txWalletA === null) {
        return error
      }
      const recipientTxns = await LedgerService().getTransactionsByWalletId(
        recipientWalletId,
      )
      if (recipientTxns instanceof Error) throw recipientTxns
      expect(recipientTxns[0].type).toEqual(txType)

      const recipientFinalBalance = await getBalanceHelper(recipientWalletId)
      expect(recipientFinalBalance).toBe(recipientInitBalance + recipientAmountInvoice)

      const txResult = await getTransactionsForWalletId(senderWalletId)
      if (txResult.error instanceof Error || txResult.result === null) {
        return txResult.error
      }

      await checkContactLogic({ senderAccountId: senderAccount.id, recipientWalletId })

      const senderTxns = await LedgerService().getTransactionsByWalletId(senderWalletId)
      if (senderTxns instanceof Error) throw senderTxns
      expect(senderTxns[0].type).toEqual(txType)

      const senderFinalBalance = await getBalanceHelper(senderWalletId)
      expect(senderFinalBalance).toBe(senderInitBalance - senderAmountInvoice)

      // Check ledger transaction metadata for USD & BTC 'LedgerTransactionType.[IntraLedger,WalletIdTradeIntraAccount]'
      // ===
      const txns = await LedgerService().getTransactionsByWalletId(senderWalletId)
      if (txns instanceof Error) throw txns

      const txnPayment = txns.find((tx) => tx.lnMemo === memo)
      expect(txnPayment).not.toBeUndefined()

      let debit, satsAmount, centsAmount
      if (senderWallet.currency === WalletCurrency.Btc) {
        satsAmount = senderAmountInvoice
        const btcPaymentAmount = {
          amount: BigInt(satsAmount),
          currency: WalletCurrency.Btc,
        }
        const centsPaymentAmount =
          senderWallet.currency === recipientWallet.currency
            ? await usdFromBtcMidPriceFn(btcPaymentAmount)
            : await dealerFns.getCentsFromSatsForImmediateBuy(btcPaymentAmount)

        if (centsPaymentAmount instanceof Error) throw centsPaymentAmount
        centsAmount = toCents(centsPaymentAmount.amount)

        debit = satsAmount
      } else {
        centsAmount = senderAmountInvoice
        const usdPaymentAmount = {
          amount: BigInt(centsAmount),
          currency: WalletCurrency.Usd,
        }
        const satsPaymentAmount =
          senderWallet.currency === recipientWallet.currency
            ? await btcFromUsdMidPriceFn(usdPaymentAmount)
            : await dealerFns.getSatsFromCentsForImmediateSell(usdPaymentAmount)
        if (satsPaymentAmount instanceof Error) throw satsPaymentAmount
        satsAmount = toSats(satsPaymentAmount.amount)

        debit = centsAmount
      }

      const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
        currency: senderAccount.displayCurrency,
      })
      if (displayPriceRatio instanceof Error) throw displayPriceRatio
      const displayAmount = Number(
        displayPriceRatio.convertFromWallet({
          amount: BigInt(satsAmount),
          currency: WalletCurrency.Btc,
        }).amountInMinor,
      )

      const expectedFields = {
        type:
          senderWallet.accountId === recipientWallet.accountId
            ? LedgerTransactionType.WalletIdTradeIntraAccount
            : LedgerTransactionType.IntraLedger,

        debit,
        credit: 0,

        satsAmount,
        satsFee: 0,
        centsAmount,
        centsFee: 0,
        displayAmount:
          senderAccount.displayCurrency === DisplayCurrency.Usd
            ? centsAmount
            : displayAmount,
        displayFee: 0,

        displayCurrency: DisplayCurrency.Usd,
      }
      expect(txnPayment).toEqual(expect.objectContaining(expectedFields))
    }

    it("sends to self, conversion from BTC wallet to USD wallet", async () => {
      const btcSendAmountInUsd = await btcPromise()
      if (btcSendAmountInUsd instanceof Error) throw btcSendAmountInUsd

      const res = await testIntraledgerSend({
        senderWalletId: walletIdA,
        senderAccount: accountA,
        recipientWalletId: walletIdUsdA,
        senderAmountInvoice: btcSendAmount,
        recipientAmountInvoice: btcSendAmountInUsd,
        txType: LedgerTransactionType.WalletIdTradeIntraAccount,
      })
      expect(res).not.toBeInstanceOf(Error)
    })

    it("sends to self, conversion from USD wallet to BTC wallet", async () => {
      const usdSendAmountInBtc = await usdPromise()
      if (usdSendAmountInBtc instanceof Error) throw usdSendAmountInBtc

      const res = await testIntraledgerSend({
        senderWalletId: walletIdUsdA,
        senderAccount: accountA,
        recipientWalletId: walletIdA,
        senderAmountInvoice: usdSendAmount,
        recipientAmountInvoice: usdSendAmountInBtc,
        txType: LedgerTransactionType.WalletIdTradeIntraAccount,
      })
      expect(res).not.toBeInstanceOf(Error)
    })

    it("sends from BTC wallet to another Galoy user's USD wallet", async () => {
      const btcSendAmountInUsd = await btcPromise()
      if (btcSendAmountInUsd instanceof Error) throw btcSendAmountInUsd

      const res = await testIntraledgerSend({
        senderWalletId: walletIdA,
        senderAccount: accountA,
        recipientWalletId: walletIdUsdB,
        senderAmountInvoice: btcSendAmount,
        recipientAmountInvoice: btcSendAmountInUsd,
      })
      expect(res).not.toBeInstanceOf(Error)
    })

    it("sends from USD wallet to another Galoy user's BTC wallet", async () => {
      const usdSendAmountInBtc = await usdPromise()
      if (usdSendAmountInBtc instanceof Error) throw usdSendAmountInBtc

      const res = await testIntraledgerSend({
        senderWalletId: walletIdUsdA,
        senderAccount: accountA,
        recipientWalletId: walletIdB,
        senderAmountInvoice: usdSendAmount,
        recipientAmountInvoice: usdSendAmountInBtc,
      })
      expect(res).not.toBeInstanceOf(Error)
    })

    it("sends from USD wallet to another Galoy user's USD wallet", async () => {
      const res = await testIntraledgerSend({
        senderWalletId: walletIdUsdB,
        senderAccount: accountB,
        recipientWalletId: walletIdUsdA,
        senderAmountInvoice: usdSendAmount,
        recipientAmountInvoice: usdSendAmount,
      })
      expect(res).not.toBeInstanceOf(Error)
    })

    it("fails to send less-than-1-cent amount from BTC wallet to USD wallet", async () => {
      const btcSendAmount = 10
      const usdAmount = await dealerFns.getCentsFromSatsForImmediateBuy({
        amount: BigInt(btcSendAmount),
        currency: WalletCurrency.Btc,
      })
      if (usdAmount instanceof Error) throw usdAmount
      const btcSendAmountInUsd = Number(usdAmount.amount)

      expect(btcSendAmountInUsd).toBe(0)

      const res = await testIntraledgerSend({
        senderWalletId: walletIdA,
        senderAccount: accountA,
        recipientWalletId: walletIdUsdB,
        senderAmountInvoice: btcSendAmount,
        recipientAmountInvoice: btcSendAmountInUsd,
      })
      expect(res).toBeInstanceOf(ZeroAmountForUsdRecipientError)
    })
  })
})

describe("Delete payments from Lnd - Lightning Pay", () => {
  it("deletes payment", async () => {
    const { request, secret, id } = await createInvoice({ lnd: lndOutside1 })
    const paymentHash = id as PaymentHash
    const revealedPreImage = secret as RevealedPreImage

    // Test payment is successful
    const paymentResult = await Payments.payNoAmountInvoiceByWalletIdForBtcWallet({
      uncheckedPaymentRequest: request,
      memo: null,
      amount: amountInvoice,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    if (paymentResult instanceof Error) throw paymentResult
    expect(paymentResult).toBe(PaymentSendStatus.Success)

    const lndService = LndService()
    if (lndService instanceof Error) return lndService

    // Confirm payment exists in lnd
    const retrievedPayment = await lndService.lookupPayment({ paymentHash })
    expect(retrievedPayment).not.toBeInstanceOf(Error)
    if (retrievedPayment instanceof Error) return retrievedPayment
    expect(retrievedPayment.status).toBe(PaymentStatus.Settled)
    if (retrievedPayment.status !== PaymentStatus.Settled) return
    expect(retrievedPayment.confirmedDetails?.revealedPreImage).toBe(revealedPreImage)

    // Delete payment
    const deleted = await lndService.deletePaymentByHash({ paymentHash })
    expect(deleted).not.toBeInstanceOf(Error)

    // Check that payment no longer exists
    const retrievedDeletedPayment = await lndService.lookupPayment({ paymentHash })
    expect(retrievedDeletedPayment).toBeInstanceOf(PaymentNotFoundError)

    // Check that deleting missing payment doesn't return error
    const deletedAttempt = await lndService.deletePaymentByHash({ paymentHash })
    expect(deletedAttempt).not.toBeInstanceOf(Error)
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

it.skip("expired payment", async () => {
  const memo = "payment that should expire"

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Lightning = require("src/Lightning")
  jest.spyOn(Lightning, "delay").mockImplementation(() => ({
    value: 1,
    unit: "seconds",
    additional_delay_value: 0,
  }))

  const activeNode = getActiveLnd()
  if (activeNode instanceof Error) throw activeNode

  const lnd = activeNode.lnd

  const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
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

  // await getBalanceHelper(walletB)

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
