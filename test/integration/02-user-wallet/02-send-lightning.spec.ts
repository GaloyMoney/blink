import { createHash, randomBytes } from "crypto"

import { Lightning, Payments, Prices, Wallets } from "@app"

import { getDisplayCurrencyConfig, getLocale, ONE_DAY } from "@config"

import { toSats } from "@domain/bitcoin"
import {
  decodeInvoice,
  defaultTimeToExpiryInSeconds,
  InvalidFeeProbeStateError,
  LightningServiceError,
  PaymentNotFoundError,
  PaymentSendStatus,
  PaymentStatus,
} from "@domain/bitcoin/lightning"
import {
  InsufficientBalanceError as DomainInsufficientBalanceError,
  SelfPaymentError as DomainSelfPaymentError,
} from "@domain/errors"
import { LedgerTransactionType } from "@domain/ledger"
import {
  LnFees,
  LnPaymentRequestInTransitError,
  PriceRatio,
  ZeroAmountForUsdRecipientError,
} from "@domain/payments"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  ValidationError,
  WalletCurrency,
  ZERO_SATS,
} from "@domain/shared"
import { PaymentInitiationMethod, WithdrawalFeePriceMethod } from "@domain/wallets"
import { toCents } from "@domain/fiat"
import { ImbalanceCalculator } from "@domain/ledger/imbalance-calculator"

import { LedgerService } from "@services/ledger"
import { getDealerUsdWalletId } from "@services/ledger/caching"
import { TransactionsMetadataRepository } from "@services/ledger/services"
import { LndService } from "@services/lnd"
import { getActiveLnd } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import {
  LnPaymentsRepository,
  WalletInvoicesRepository,
  WalletsRepository,
  PaymentFlowStateRepository,
  AccountsRepository,
} from "@services/mongoose"
import { WalletInvoice } from "@services/mongoose/schema"
import { DealerPriceService, NewDealerPriceService } from "@services/dealer-price"

import { sleep } from "@utils"

import { NotificationType } from "@domain/notifications"

import { createPushNotificationContent } from "@services/notifications/create-push-notification-content"
import * as PushNotificationsServiceImpl from "@services/notifications/push-notifications"

import {
  cancelHodlInvoice,
  cancelOkexPricePublish,
  checkIsBalanced,
  createHodlInvoice,
  createInvoice,
  createUserAndWalletFromUserRef,
  decodePaymentRequest,
  getAccountByTestUserRef,
  getBalanceHelper,
  getDefaultWalletIdByTestUserRef,
  getHash,
  getInvoice,
  getInvoiceAttempt,
  getUsdWalletIdByTestUserRef,
  getUserRecordByTestUserRef,
  lndOutside1,
  lndOutside2,
  publishOkexPrice,
  settleHodlInvoice,
  waitFor,
  waitUntilChannelBalanceSyncAll,
} from "test/helpers"

const dealerFns = DealerPriceService()
const newDealerFns = NewDealerPriceService()
const calc = AmountCalculator()

jest.mock("@app/prices/get-current-price", () => require("test/mocks/get-current-price"))

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

let initBalanceA: Satoshis, initBalanceB: Satoshis, initBalanceUsdB: UsdCents
const amountInvoice = toSats(1000)

const invoicesRepo = WalletInvoicesRepository()
let userRecordA: UserRecord

let accountA: Account
let accountB: Account
let accountC: Account
let accountH: Account

let walletIdA: WalletId
let walletIdB: WalletId
let walletIdH: WalletId
let walletIdUsdB: WalletId
let walletIdUsdA: WalletId
let walletIdC: WalletId

let usernameA: Username
let usernameB: Username
let usernameC: Username

const locale = getLocale()
const { code: DefaultDisplayCurrency } = getDisplayCurrencyConfig()

beforeAll(async () => {
  await publishOkexPrice()
  await createUserAndWalletFromUserRef("A")
  await createUserAndWalletFromUserRef("B")
  await createUserAndWalletFromUserRef("C")
  await createUserAndWalletFromUserRef("H")

  accountA = await getAccountByTestUserRef("A")
  accountB = await getAccountByTestUserRef("B")
  accountC = await getAccountByTestUserRef("C")
  accountH = await getAccountByTestUserRef("H")

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  walletIdUsdA = await getUsdWalletIdByTestUserRef("A")
  walletIdB = await getDefaultWalletIdByTestUserRef("B")
  walletIdUsdB = await getUsdWalletIdByTestUserRef("B")
  walletIdC = await getDefaultWalletIdByTestUserRef("C")
  walletIdH = await getDefaultWalletIdByTestUserRef("H")

  userRecordA = await getUserRecordByTestUserRef("A")
  usernameA = userRecordA.username as Username

  const userRecord1 = await getUserRecordByTestUserRef("B")
  usernameB = userRecord1.username as Username

  const userRecordC = await getUserRecordByTestUserRef("C")
  usernameC = userRecordC.username as Username
})

beforeEach(async () => {
  initBalanceA = toSats(await getBalanceHelper(walletIdA))
  initBalanceB = toSats(await getBalanceHelper(walletIdB))
  initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(() => {
  cancelOkexPricePublish()
  jest.restoreAllMocks()
})

describe("UserWallet - Lightning Pay", () => {
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

    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest: invoice,
      memo: null,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    if (paymentResult instanceof Error) throw paymentResult

    walletInvoice = await invoicesRepo.findByPaymentHash(lnInvoice.paymentHash)
    expect(walletInvoice).not.toBeInstanceOf(Error)
    if (walletInvoice instanceof Error) throw walletInvoice
    expect(walletInvoice.paid).toBeTruthy()

    const matchTx = (tx) =>
      tx.settlementVia.type === PaymentInitiationMethod.IntraLedger &&
      tx.initiationVia.paymentHash === getHash(invoice)

    const txResultB = await Wallets.getTransactionsForWalletId({
      walletId: walletIdB,
    })
    if (txResultB.error instanceof Error || txResultB.result === null) {
      throw txResultB.error
    }
    const userBTxn = txResultB.result.filter(matchTx)[0]
    expect(userBTxn.memo).toBe(memo)
    expect(userBTxn.displayCurrencyPerSettlementCurrencyUnit).toBe(0.0005)
    expect(userBTxn.settlementVia.type).toBe("intraledger")
    // expect(userBTxn.recipientUsername).toBe("lily")

    const txResultC = await Wallets.getTransactionsForWalletId({
      walletId: walletIdB,
    })
    if (txResultC.error instanceof Error || txResultC.result === null) {
      throw txResultC.error
    }
    const userCTxn = txResultC.result.filter(matchTx)[0]
    expect(userCTxn.memo).toBe(memo)
    expect(userCTxn.displayCurrencyPerSettlementCurrencyUnit).toBe(0.0005)
    expect(userCTxn.settlementVia.type).toBe("intraledger")
  })

  it("sends to another Galoy user an amount less than 1 cent", async () => {
    const lnInvoice = await Wallets.addInvoiceForSelf({
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

    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest: request,
      memo: memoPayer,
      senderWalletId: walletIdB,
      senderAccount: accountB,
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
    const sendNotification = jest.fn()
    jest
      .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
      .mockImplementationOnce(() => ({ sendNotification }))

    const res = await Payments.intraledgerPaymentSendWalletId({
      recipientWalletId: walletIdA,
      memo: "",
      amount: amountInvoice,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    if (res instanceof Error) throw res

    const finalBalanceA = await getBalanceHelper(walletIdA)
    const { result: txWalletA, error } = await Wallets.getTransactionsForWalletId({
      walletId: walletIdA,
    })
    if (error instanceof Error || txWalletA === null) {
      throw error
    }

    const finalBalanceB = await getBalanceHelper(walletIdB)
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

    expect(txWalletA[0].initiationVia).toHaveProperty(
      "type",
      PaymentInitiationMethod.IntraLedger,
    )
    expect(txWalletA[0].initiationVia).toHaveProperty("counterPartyUsername", usernameB)
    expect(userBTransaction[0].initiationVia).toHaveProperty(
      "counterPartyUsername",
      usernameA,
    )
    expect(userBTransaction[0].initiationVia).toHaveProperty(
      "type",
      PaymentInitiationMethod.IntraLedger,
    )

    await sleep(1000)

    const satsPrice = await Prices.getCurrentPrice()
    if (satsPrice instanceof Error) throw satsPrice

    const paymentAmount = { amount: BigInt(amountInvoice), currency: WalletCurrency.Btc }
    const displayPaymentAmount = {
      amount: amountInvoice * satsPrice,
      currency: DefaultDisplayCurrency,
    }

    const { title: titleReceipt, body: bodyReceipt } = createPushNotificationContent({
      type: NotificationType.IntraLedgerReceipt,
      userLanguage: locale as UserLanguage,
      amount: paymentAmount,
      displayAmount: displayPaymentAmount,
    })

    expect(sendNotification.mock.calls.length).toBe(1)
    expect(sendNotification.mock.calls[0][0].title).toBe(titleReceipt)
    expect(sendNotification.mock.calls[0][0].body).toBe(bodyReceipt)

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

    const res2 = await Payments.intraledgerPaymentSendWalletId({
      recipientWalletId: walletIdA,
      memo: "",
      amount: amountInvoice,
      senderWalletId: walletIdB,
      senderAccount: accountB,
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
    const imbalanceCalc = ImbalanceCalculator({
      method: WithdrawalFeePriceMethod.proportionalOnImbalance,
      sinceDaysAgo: ONE_DAY,
      volumeLightningFn: LedgerService().lightningTxBaseVolumeSince,
      volumeOnChainFn: LedgerService().onChainTxBaseVolumeSince,
    })

    const imbalanceInit = await imbalanceCalc.getSwapOutImbalance(walletIdB)
    if (imbalanceInit instanceof Error) throw imbalanceInit

    const { request, secret, id } = await createInvoice({ lnd: lndOutside1 })
    const paymentHash = id as PaymentHash
    const revealedPreImage = secret as RevealedPreImage

    // Test payment is successful
    const paymentResult = await Payments.payNoAmountInvoiceByWalletId({
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

    // Test fee reimbursement amounts
    const txnPayment = txns.find((tx) => tx.type === LedgerTransactionType.Payment)
    expect(txnPayment).not.toBeUndefined()
    if (!txnPayment?.centsAmount) throw new Error("centsAmount missing from payment")
    if (!txnPayment?.satsAmount) throw new Error("satsAmount missing from payment")

    const usdPaymentAmount = paymentAmountFromNumber({
      amount: txnPayment.centsAmount,
      currency: WalletCurrency.Usd,
    })
    if (usdPaymentAmount instanceof Error) return usdPaymentAmount
    const btcPaymentAmount = paymentAmountFromNumber({
      amount: txnPayment.satsAmount,
      currency: WalletCurrency.Btc,
    })
    if (btcPaymentAmount instanceof Error) return btcPaymentAmount
    const paymentAmounts = {
      usd: usdPaymentAmount,
      btc: btcPaymentAmount,
    }
    const priceRatio = PriceRatio(paymentAmounts)
    if (priceRatio instanceof Error) throw priceRatio

    const feeAmountSats = LnFees().maxProtocolFee({
      amount: BigInt(amountInvoice),
      currency: WalletCurrency.Btc,
    })
    const feeAmountCents = priceRatio.convertFromBtc(feeAmountSats)
    const feeCents = toCents(feeAmountCents.amount)

    const txnFeeReimburse = txns.find(
      (tx) => tx.type === LedgerTransactionType.LnFeeReimbursement,
    )
    expect(txnFeeReimburse).not.toBeUndefined()
    expect(txnFeeReimburse).toEqual(
      expect.objectContaining({
        debit: 0,
        credit: toSats(feeAmountSats.amount),

        fee: 0,
        feeUsd: 0,
        usd: feeCents / 100,

        satsAmount: toSats(feeAmountSats.amount),
        satsFee: 0,
        centsAmount: feeCents,
        centsFee: 0,
        displayAmount: feeCents,
        displayFee: 0,
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

    const imbalanceFinal = await imbalanceCalc.getSwapOutImbalance(walletIdB)
    if (imbalanceFinal instanceof Error) throw imbalanceFinal

    // imbalance is reduced with lightning payment
    expect(imbalanceFinal).toBe(imbalanceInit - amountInvoice)
  })

  it("pay zero amount invoice with amount less than 1 cent", async () => {
    const imbalanceCalc = ImbalanceCalculator({
      method: WithdrawalFeePriceMethod.proportionalOnImbalance,
      sinceDaysAgo: ONE_DAY,
      volumeLightningFn: LedgerService().lightningTxBaseVolumeSince,
      volumeOnChainFn: LedgerService().onChainTxBaseVolumeSince,
    })

    const imbalanceInit = await imbalanceCalc.getSwapOutImbalance(walletIdB)
    if (imbalanceInit instanceof Error) throw imbalanceInit

    const { request } = await createInvoice({ lnd: lndOutside1 })

    // Test payment is successful
    const paymentResult = await Payments.payNoAmountInvoiceByWalletId({
      uncheckedPaymentRequest: request,
      memo: null,
      amount: toSats(1),
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    if (paymentResult instanceof Error) throw paymentResult
    expect(paymentResult).toBe(PaymentSendStatus.Success)
  })

  it("filters spam from send to another Galoy user as push payment", async () => {
    // TODO: good candidate for a unit test?

    const satsBelow = 100
    const memoSpamBelowThreshold = "Spam BELOW threshold"
    const resBelowThreshold = await Payments.intraledgerPaymentSendWalletId({
      recipientWalletId: walletIdA,
      memo: memoSpamBelowThreshold,
      amount: toSats(satsBelow),
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    if (resBelowThreshold instanceof Error) throw resBelowThreshold

    const satsAbove = 1100
    const memoSpamAboveThreshold = "Spam ABOVE threshold"
    const resAboveThreshold = await Payments.intraledgerPaymentSendWalletId({
      recipientWalletId: walletIdA,
      memo: memoSpamAboveThreshold,
      amount: toSats(satsAbove),
      senderWalletId: walletIdB,
      senderAccount: accountB,
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

    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest: invoice,
      memo: null,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    expect(paymentResult).toBeInstanceOf(DomainSelfPaymentError)
  })

  it("fails if sends to self an on us push payment", async () => {
    const paymentResult = await Payments.intraledgerPaymentSendWalletId({
      recipientWalletId: walletIdB,
      memo: "",
      amount: amountInvoice,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })
    expect(paymentResult).toBeInstanceOf(DomainSelfPaymentError)
  })

  it("fails when user has insufficient balance", async () => {
    const { request: invoice } = await createInvoice({
      lnd: lndOutside1,
      tokens: initBalanceB + 1000000,
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
    const res = await Payments.intraledgerPaymentSendWalletId({
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
    const res = await Payments.intraledgerPaymentSendWalletId({
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

    const { result: fee, error } = await Payments.getLightningFeeEstimation({
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
    const { result: fee, error } = await Payments.getLightningFeeEstimation({
      walletId: walletIdH,
      uncheckedPaymentRequest: request,
    })
    expect(feeProbeCallCount()).toEqual(feeProbeCallsBefore + 1)
    expect(error).not.toBeInstanceOf(Error)
    expect(fee).toStrictEqual({ amount: 0n, currency: WalletCurrency.Btc })

    // Test that flagged destination skips feeProbe lightning service method
    const muunRequest =
      "lnbc10u1p3w0mf7pp5v9xg3eksnsyrsa3vk5uv00rvye4wf9n0744xgtx0kcrafeanvx7sdqqcqzzgxqyz5vqrzjqwnvuc0u4txn35cafc7w94gxvq5p3cu9dd95f7hlrh0fvs46wpvhddrwgrqy63w5eyqqqqryqqqqthqqpyrzjqw8c7yfutqqy3kz8662fxutjvef7q2ujsxtt45csu0k688lkzu3lddrwgrqy63w5eyqqqqryqqqqthqqpysp53n0sc9hvqgdkrv4ppwrm2pa0gcysa8r2swjkrkjnxkcyrsjmxu4s9qypqsq5zvh7glzpas4l9ptxkdhgefyffkn8humq6amkrhrh2gq02gv8emxrynkwke3uwgf4cfevek89g4020lgldxgusmse79h4caqg30qq2cqmyrc7d" as EncodedPaymentRequest
    const muunInvoice = decodeInvoice(muunRequest)
    if (muunInvoice instanceof Error) throw muunInvoice
    if (!muunInvoice.paymentAmount) throw new Error("No-amount Invoice")
    expect(muunInvoice.paymentAmount.amount).toEqual(BigInt(sats))

    feeProbeCallsBefore = feeProbeCallCount()
    const { result: feeMuun, error: errorMuun } =
      await Payments.getLightningFeeEstimation({
        walletId: walletIdH,
        uncheckedPaymentRequest: muunRequest,
      })
    expect(feeProbeCallCount()).toEqual(feeProbeCallsBefore)
    expect(errorMuun).toBeUndefined()
    expect(feeMuun).toStrictEqual(LnFees().maxProtocolFee(muunInvoice.paymentAmount))
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

          const { result: feeFromProbe, error } =
            await Payments.getLightningFeeEstimation({
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

          const payerFinalBalance = await getBalanceHelper(walletIdPayer)
          const payeeFinalBalance = await getBalanceHelper(walletIdPayee)

          expect(payerFinalBalance).toBe(payerInitialBalance - amountInvoice)
          expect(payeeFinalBalance).toBe(payeeInitialBalance + amountInvoice)

          const satsPrice = await Prices.getCurrentPrice()
          if (satsPrice instanceof Error) throw satsPrice

          const paymentAmount = {
            amount: BigInt(amountInvoice),
            currency: WalletCurrency.Btc,
          }
          const displayPaymentAmount = {
            amount: amountInvoice * satsPrice,
            currency: DefaultDisplayCurrency,
          }

          const { title, body } = createPushNotificationContent({
            type: NotificationType.LnInvoicePaid,
            userLanguage: locale as UserLanguage,
            amount: paymentAmount,
            displayAmount: displayPaymentAmount,
          })

          expect(sendNotification.mock.calls.length).toBe(1)
          expect(sendNotification.mock.calls[0][0].title).toBe(title)
          expect(sendNotification.mock.calls[0][0].body).toBe(body)

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

        const userRecordA = await getUserRecordByTestUserRef("A")
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

        const initialBalance = await getBalanceHelper(walletIdB)

        const result = await fn({ account: accountB, walletId: walletIdB })({
          invoice: request,
          memo: "pay an unconnected node",
        })
        if (result instanceof Error) throw result

        // wait for balance updates because invoice event
        // arrives before wallet balances updates in lnd
        await waitUntilChannelBalanceSyncAll()

        expect(result).toBe(PaymentSendStatus.Success)
        const finalBalance = await getBalanceHelper(walletIdB)

        // TODO: have a way to do this more programmatically?
        // base rate: 1, fee Rate: 1
        const fee = 0

        expect(finalBalance).toBe(initialBalance - amountInvoice - fee)
      })

      it("pay hodl invoice & ln payments repo updates", async () => {
        const { id, secret } = createInvoiceHash()

        const paymentFlowRepo = PaymentFlowStateRepository(defaultTimeToExpiryInSeconds)
        const paymentFlowIndex: PaymentFlowStateIndex = {
          paymentHash: id as PaymentHash,
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

        const feeAmount = LnFees().maxProtocolFee({
          amount: BigInt(amountInvoice),
          currency: WalletCurrency.Btc,
        })
        const amountInvoiceWithFee = applyMaxFee
          ? amountInvoice + Number(feeAmount.amount)
          : amountInvoice

        expect(balanceBeforeSettlement).toEqual(initBalanceB - amountInvoiceWithFee)

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
          const updatedPayments = await Payments.updatePendingPaymentsByWalletId({
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
        const intermediateBalance = await getBalanceHelper(walletIdB)

        const feeAmount = LnFees().maxProtocolFee({
          amount: BigInt(amountInvoice),
          currency: WalletCurrency.Btc,
        })
        const amountInvoiceWithFee = applyMaxFee
          ? amountInvoice + Number(feeAmount.amount)
          : amountInvoice

        expect(intermediateBalance).toBe(initBalanceB - amountInvoiceWithFee)

        await cancelHodlInvoice({ id, lnd: lndOutside1 })

        await waitFor(async () => {
          const updatedPayments = await Payments.updatePendingPaymentsByWalletId({
            walletId: walletIdB,
            logger: baseLogger,
          })
          if (updatedPayments instanceof Error) throw updatedPayments

          const count = await LedgerService().getPendingPaymentsCount(walletIdB)
          if (count instanceof Error) throw count

          return count === 0
        })

        // Test 'lnpayment' is failed
        const lnPaymentUpdateOnSettled = await Lightning.updateLnPayments()
        if (lnPaymentUpdateOnSettled instanceof Error) throw lnPaymentUpdateOnSettled

        const lnPaymentOnSettled = await LnPaymentsRepository().findByPaymentHash(
          id as PaymentHash,
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
        await waitUntilChannelBalanceSyncAll()

        const finalBalance = await getBalanceHelper(walletIdB)
        expect(finalBalance).toBe(initBalanceB)
      }, 60000)

      it("reimburse failed USD payment", async () => {
        const { id } = createInvoiceHash()

        const btcInvoiceAmount = paymentAmountFromNumber({
          amount: amountInvoice,
          currency: WalletCurrency.Btc,
        })
        if (btcInvoiceAmount instanceof Error) throw btcInvoiceAmount
        const usdInvoiceAmount = await newDealerFns.getCentsFromSatsForImmediateSell(
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

        const priceRatio = PriceRatio({
          btc: btcInvoiceAmount,
          usd: usdInvoiceAmount,
        })
        if (priceRatio instanceof Error) return priceRatio
        const btcProtocolFee = applyMaxFee
          ? LnFees().maxProtocolFee({
              amount: btcInvoiceAmount.amount,
              currency: WalletCurrency.Btc,
            })
          : ZERO_SATS
        const usdProtocolFee = priceRatio.convertFromBtc(btcProtocolFee)

        const amountInvoiceWithFee = calc.add(usdInvoiceAmount, usdProtocolFee)

        expect(intermediateBalance).toBe(
          initBalanceUsdB - Number(amountInvoiceWithFee.amount),
        )

        await cancelHodlInvoice({ id, lnd: lndOutside1 })

        await waitFor(async () => {
          const updatedPayments = await Payments.updatePendingPaymentsByWalletId({
            walletId: walletIdUsdB,
            logger: baseLogger,
          })
          if (updatedPayments instanceof Error) throw updatedPayments

          const count = await LedgerService().getPendingPaymentsCount(walletIdUsdB)
          if (count instanceof Error) throw count

          return count === 0
        })

        // Test 'lnpayment' is failed
        const lnPaymentUpdateOnSettled = await Lightning.updateLnPayments()
        if (lnPaymentUpdateOnSettled instanceof Error) throw lnPaymentUpdateOnSettled

        const lnPaymentOnSettled = await LnPaymentsRepository().findByPaymentHash(
          id as PaymentHash,
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
        await waitUntilChannelBalanceSyncAll()

        // Check BTC wallet balance
        const btcAmountInvoiceWithFee = calc.add(btcInvoiceAmount, btcProtocolFee)
        const finalBalanceBtc = await getBalanceHelper(walletIdB)
        expect(finalBalanceBtc).toBe(
          initBalanceB + Number(btcAmountInvoiceWithFee.amount),
        )

        // Check USD wallet balance
        const finalBalanceUsd = await getBalanceHelper(walletIdUsdB)
        expect(finalBalanceUsd).toBe(
          initBalanceUsdB - Number(amountInvoiceWithFee.amount),
        )
      }, 60000)
    })
  })
})

describe("USD Wallets - Lightning Pay", () => {
  // TODO: add probing scenarios
  describe("Lightning invoices with amounts", () => {
    it("pay external invoice from usd wallet", async () => {
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))

      const amountPayment = toSats(100)

      const { request } = await createInvoice({ lnd: lndOutside1, tokens: amountPayment })

      const paymentResult = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: request,
        memo: null,
        senderWalletId: walletIdUsdB,
        senderAccount: accountB,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      const cents = await dealerFns.getCentsFromSatsForImmediateSell(amountPayment)
      if (cents instanceof Error) throw cents

      const finalBalance = await getBalanceHelper(walletIdUsdB)
      expect(finalBalance).toBe(initBalanceUsdB - cents)
    })

    it("pay internal invoice from usd wallet to usd wallet", async () => {
      const initBalanceUsdA = toCents(await getBalanceHelper(walletIdUsdA))
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))

      const amountPayment = toCents(6)

      const request = await Wallets.addInvoiceForSelf({
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

      const request = await Wallets.addInvoiceForSelf({
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

      const dealerFns = DealerPriceService()
      const cents = await dealerFns.getCentsFromSatsForImmediateSell(amountPayment)
      if (cents instanceof Error) throw cents

      const finalBalanceB = await getBalanceHelper(walletIdUsdB)
      const finalBalanceA = await getBalanceHelper(walletIdA)

      expect(finalBalanceB).toBe(initBalanceUsdB - cents)
      expect(finalBalanceA).toBe(initBalanceA + amountPayment)
    })

    it("pay internal invoice from btc wallet to usd wallet", async () => {
      const initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))
      const initBalanceA = toSats(await getBalanceHelper(walletIdA))

      const amountPayment = toCents(3)

      const request = await Wallets.addInvoiceForSelf({
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

      const dealerFns = DealerPriceService()
      const sats = await dealerFns.getSatsFromCentsForFutureBuy(
        amountPayment,
        defaultTimeToExpiryInSeconds,
      )
      if (sats instanceof Error) throw sats

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

      const paymentResult = await Payments.payNoAmountInvoiceByWalletId({
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

      const paymentResult = await Payments.payNoAmountInvoiceByWalletId({
        uncheckedPaymentRequest: request,
        memo: null,
        amount: amountPayment,
        senderWalletId: walletIdUsdB,
        senderAccount: accountB,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      const dealerFns = DealerPriceService()
      const sats = await dealerFns.getSatsFromCentsForImmediateSell(amountPayment)
      if (sats instanceof Error) throw sats

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

      const paymentResult = await Payments.payNoAmountInvoiceByWalletId({
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

      const paymentResult = await Payments.payNoAmountInvoiceByWalletId({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: walletIdUsdB,
        senderAccount: accountB,
        amount: amountPayment,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      const dealerFns = DealerPriceService()
      const sats = await dealerFns.getSatsFromCentsForImmediateSell(amountPayment)
      if (sats instanceof Error) throw sats

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
      const usdPaymentAmount = await newDealerFns.getCentsFromSatsForImmediateBuy({
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

      const paymentResult = await Payments.payNoAmountInvoiceByWalletId({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: walletIdA,
        senderAccount: accountA,
        amount: amountPayment,
      })
      expect(paymentResult).not.toBeInstanceOf(Error)
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toBe(PaymentSendStatus.Success)

      const dealerFns = DealerPriceService()
      const cents = await dealerFns.getCentsFromSatsForImmediateBuy(amountPayment)
      if (cents instanceof Error) throw cents

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

      const paymentResult = await Payments.payNoAmountInvoiceByWalletId({
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
      const dealerFns = DealerPriceService()
      const sats = await dealerFns.getSatsFromCentsForImmediateSell(amountPayment)
      if (sats instanceof Error) throw sats

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
      const usdPaymentAmount = await newDealerFns.getCentsFromSatsForImmediateBuy({
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

      const paymentResult = await Payments.payNoAmountInvoiceByWalletId({
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
      const dealerFns = DealerPriceService()
      const cents = await dealerFns.getCentsFromSatsForImmediateBuy(amountPayment)
      if (cents instanceof Error) throw cents

      const finalBalanceB = await getBalanceHelper(walletIdUsdA)
      const finalBalanceA = await getBalanceHelper(walletIdA)

      expect(finalBalanceB).toBe(initBalanceUsdB + cents)
      expect(finalBalanceA).toBe(initBalanceA - amountPayment)
    })
  })
  describe("Intraledger payments", () => {
    const btcSendAmount = 50_000
    const btcPromise = () =>
      dealerFns.getCentsFromSatsForImmediateBuy(toSats(btcSendAmount))

    const usdSendAmount = 100
    const usdPromise = () =>
      dealerFns.getSatsFromCentsForImmediateSell(toCents(usdSendAmount))

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
      const senderInitBalance = toSats(await getBalanceHelper(senderWalletId))
      const recipientInitBalance = toSats(await getBalanceHelper(recipientWalletId))

      const res = await Payments.intraledgerPaymentSendWalletId({
        recipientWalletId: recipientWalletId,
        memo: "",
        amount: senderAmountInvoice,
        senderWalletId: senderWalletId,
        senderAccount,
      })
      if (res instanceof Error) return res
      expect(res).toBe(PaymentSendStatus.Success)

      const { result: txWalletA, error } = await Wallets.getTransactionsForWalletId({
        walletId: recipientWalletId,
      })
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

      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: senderWalletId,
      })
      if (txResult.error instanceof Error || txResult.result === null) {
        return txResult.error
      }

      await checkContactLogic({ senderAccountId: senderAccount.id, recipientWalletId })

      const senderTxns = await LedgerService().getTransactionsByWalletId(senderWalletId)
      if (senderTxns instanceof Error) throw senderTxns
      expect(senderTxns[0].type).toEqual(txType)

      const senderFinalBalance = await getBalanceHelper(senderWalletId)
      expect(senderFinalBalance).toBe(senderInitBalance - senderAmountInvoice)
    }

    it("sends to self, conversion from BTC wallet to USD wallet", async () => {
      const btcSendAmountInUsd = await Promise.resolve(btcPromise())
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
      const usdSendAmountInBtc = await Promise.resolve(usdPromise())
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

    it("fails to self, from BTC wallet to same BTC wallet", async () => {
      const walletId = walletIdA
      const res = await testIntraledgerSend({
        senderWalletId: walletId,
        senderAccount: accountA,
        recipientWalletId: walletId,
        senderAmountInvoice: btcSendAmount,
        recipientAmountInvoice: btcSendAmount,
      })
      expect(res).toBeInstanceOf(DomainSelfPaymentError)
    })

    it("fails to self, from USD wallet to same USD wallet", async () => {
      const walletId = walletIdUsdA
      const res = await testIntraledgerSend({
        senderWalletId: walletId,
        senderAccount: accountA,
        recipientWalletId: walletId,
        senderAmountInvoice: usdSendAmount,
        recipientAmountInvoice: usdSendAmount,
      })
      expect(res).toBeInstanceOf(DomainSelfPaymentError)
    })

    it("sends from BTC wallet to another Galoy user's USD wallet", async () => {
      const btcSendAmountInUsd = await Promise.resolve(btcPromise())
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
      const usdSendAmountInBtc = await Promise.resolve(usdPromise())
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
      const btcSendAmountInUsd = await dealerFns.getCentsFromSatsForImmediateBuy(
        toSats(btcSendAmount),
      )
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
    const paymentResult = await Payments.payNoAmountInvoiceByWalletId({
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

  const activeNode = getActiveLnd()
  if (activeNode instanceof Error) throw activeNode

  const lnd = activeNode.lnd

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
