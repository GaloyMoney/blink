import { once } from "events"

import { Prices, Wallets } from "@app"
import {
  BTC_NETWORK,
  getAccountLimits,
  getFeesConfig,
  getLocale,
  getOnChainWalletConfig,
  ONE_DAY,
} from "@config"
import { toSats, toTargetConfs } from "@domain/bitcoin"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import {
  InsufficientBalanceError,
  LessThanDustThresholdError,
  LimitsExceededError,
  RebalanceNeededError,
  SelfPaymentError,
} from "@domain/errors"
import {
  InvalidBtcPaymentAmountError,
  InvalidZeroAmountPriceRatioInputError,
  WalletPriceRatio,
} from "@domain/payments"
import { NotificationType } from "@domain/notifications"
import { PaymentInitiationMethod, SettlementMethod, TxStatus } from "@domain/wallets"
import { onchainTransactionEventHandler } from "@servers/trigger"
import { LedgerService } from "@services/ledger"
import { sleep, timestampDaysAgo } from "@utils"

import {
  btcFromUsdMidPriceFn,
  getCurrentPriceAsDisplayPriceRatio,
  usdFromBtcMidPriceFn,
} from "@app/prices"

import { LedgerTransactionType } from "@domain/ledger"

import {
  add,
  DisplayCurrency,
  getCurrencyMajorExponent,
  displayAmountFromNumber,
  sub,
  toCents,
} from "@domain/fiat"

import { createPushNotificationContent } from "@services/notifications/create-push-notification-content"
import { WalletsRepository } from "@services/mongoose"
import * as PushNotificationsServiceImpl from "@services/notifications/push-notifications"

import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"

import {
  CPFPAncestorLimitReachedError,
  InsufficientOnChainFundsError,
  OnChainServiceUnavailableError,
  UnknownOnChainServiceError,
} from "@domain/bitcoin/onchain/errors"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { SettlementAmounts } from "@domain/wallets/settlement-amounts"

import * as OnChainServiceImpl from "@services/lnd/onchain-service"
import { DealerPriceService } from "@services/dealer-price"

import { getBalanceHelper, getTransactionsForWalletId } from "test/helpers/wallet"
import {
  bitcoindClient,
  bitcoindOutside,
  checkIsBalanced,
  createChainAddress,
  createMandatoryUsers,
  createUserAndWalletFromUserRef,
  getAccountByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  lndonchain,
  lndOutside1,
  mineBlockAndSync,
  mineBlockAndSyncAll,
  subscribeToTransactions,
  getUsdWalletIdByTestUserRef,
  amountByPriceAsMajor,
} from "test/helpers"

let accountA: Account
let accountB: Account
let accountE: Account
let accountG: Account

let walletIdA: WalletId
let walletIdUsdA: WalletId
let walletIdUsdB: WalletId
let walletIdD: WalletId
let walletIdG: WalletId

// using walletIdE and walletIdF to sendAll
let walletIdE: WalletId
let walletIdF: WalletId

const locale = getLocale()

const dealerFns = DealerPriceService()

beforeAll(async () => {
  await createMandatoryUsers()

  await createUserAndWalletFromUserRef("B")
  await createUserAndWalletFromUserRef("D")
  await createUserAndWalletFromUserRef("E")
  await createUserAndWalletFromUserRef("F")

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  walletIdUsdA = await getUsdWalletIdByTestUserRef("A")
  accountA = await getAccountByTestUserRef("A")

  walletIdUsdB = await getUsdWalletIdByTestUserRef("B")
  accountB = await getAccountByTestUserRef("B")

  walletIdD = await getDefaultWalletIdByTestUserRef("D")
  walletIdE = await getDefaultWalletIdByTestUserRef("E")
  walletIdF = await getDefaultWalletIdByTestUserRef("F")
  walletIdG = await getDefaultWalletIdByTestUserRef("G")
  accountE = await getAccountByTestUserRef("E")
  accountG = await getAccountByTestUserRef("G")

  await bitcoindClient.loadWallet({ filename: "outside" })
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

const amount = toSats(10040)
const usdAmount = toCents(105)
const amountBelowDustThreshold = getOnChainWalletConfig().dustThreshold - 1
const targetConfirmations = toTargetConfs(1)

const payOnChainForPromiseAll = async (
  args: { senderCurrency: WalletCurrency } & PayOnChainByWalletIdArgs,
) => {
  const { senderCurrency, ...payArgs } = args
  const res =
    senderCurrency === WalletCurrency.Btc
      ? await Wallets.payOnChainByWalletIdForBtcWallet(payArgs)
      : args.amountCurrency === WalletCurrency.Usd
      ? await Wallets.payOnChainByWalletIdForUsdWallet(payArgs)
      : await Wallets.payOnChainByWalletIdForUsdWalletAndBtcAmount(payArgs)
  if (res instanceof Error) throw res
  return res
}

const testExternalSend = async ({
  senderAccount,
  senderWalletId,
  amount,
  amountCurrency,
  sendAll,
}: {
  senderAccount: Account
  senderWalletId: WalletId
  amount: Satoshis | UsdCents
  amountCurrency: WalletCurrency
  sendAll: boolean
}) => {
  const onChainService = OnChainServiceImpl.OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const initialWalletBalance = await getBalanceHelper(senderWalletId)

  const sendNotification = jest.fn()
  jest
    .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
    .mockImplementation(() => ({ sendNotification }))
  const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })

  const sub = subscribeToTransactions({ lnd: lndonchain })
  sub.on("chain_transaction", onchainTransactionEventHandler)

  // For notification check at the end
  const amountToSend = sendAll
    ? await LedgerService().getWalletBalance(senderWalletId)
    : amount
  if (amountToSend instanceof Error) return amountToSend

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  let amountToSendSats: number = amountToSend
  let priceRatio: WalletPriceRatio | undefined = undefined
  if (
    senderWallet.currency === WalletCurrency.Usd &&
    senderWallet.currency === amountCurrency
  ) {
    const usdPaymentAmount = {
      amount: BigInt(amountToSend),
      currency: WalletCurrency.Usd,
    }
    const amountResult = await dealerFns.getSatsFromCentsForImmediateSell(
      usdPaymentAmount,
    )
    if (amountResult instanceof Error) return amountResult
    amountToSendSats = Number(amountResult.amount)

    if (amountToSend > 0) {
      const priceRatioRaw = WalletPriceRatio({ usd: usdPaymentAmount, btc: amountResult })
      if (priceRatioRaw instanceof Error) throw priceRatioRaw
      priceRatio = priceRatioRaw
    }
  }

  const minerFee =
    amountToSend > 0
      ? await onChainService.getOnChainFeeEstimate({
          amount: toSats(amountToSendSats),
          address: address as OnChainAddress,
          targetConfirmations,
        })
      : 0
  if (minerFee instanceof Error) return minerFee

  let results
  try {
    results = await Promise.all([
      once(sub, "chain_transaction"),
      payOnChainForPromiseAll({
        senderCurrency: senderWallet.currency,
        senderAccount,
        senderWalletId,
        address,
        amount,
        amountCurrency,
        targetConfirmations,
        memo: null,
        sendAll,
      }),
    ])
  } catch (err) {
    sub.removeAllListeners()
    return err as ApplicationError
  }

  expect(results[1]).toBe(PaymentSendStatus.Success)
  await onchainTransactionEventHandler(results[0][0])

  // we don't send a notification for send transaction for now
  // expect(sendNotification.mock.calls.length).toBe(1)
  // expect(sendNotification.mock.calls[0][0].data.type).toBe(NotificationType.OnchainPayment)
  // expect(sendNotification.mock.calls[0][0].data.title).toBe(`Your transaction has been sent. It may takes some time before it is confirmed`)

  let txnAmount = amount
  if (
    senderWallet.currency === WalletCurrency.Usd &&
    senderWallet.currency !== amountCurrency
  ) {
    const btcPaymentAmount = {
      amount: BigInt(amount),
      currency: WalletCurrency.Btc,
    }
    const usdPaymentAmount = await dealerFns.getCentsFromSatsForImmediateSell(
      btcPaymentAmount,
    )
    if (usdPaymentAmount instanceof Error) throw usdPaymentAmount
    txnAmount = toCents(usdPaymentAmount.amount)

    const priceRatioRaw = WalletPriceRatio({
      usd: usdPaymentAmount,
      btc: btcPaymentAmount,
    })
    if (priceRatioRaw instanceof Error) throw priceRatioRaw

    priceRatio = priceRatioRaw
  }

  let pendingTxHash: OnChainTxHash
  {
    const txResult = await getTransactionsForWalletId(senderWalletId)
    if (txResult.error instanceof Error || txResult.result === null) {
      return txResult.error
    }
    const pendingTxs = txResult.result.slice.filter(
      ({ status }) => status === TxStatus.Pending,
    )
    expect(pendingTxs.length).toBe(1)
    const pendingTx = pendingTxs[0]
    const interimBalance = await getBalanceHelper(senderWalletId)

    const pendingLedgerTx = await LedgerService().getTransactionById(
      pendingTx.id as LedgerTransactionId,
    )
    if (pendingLedgerTx instanceof Error) throw pendingLedgerTx
    const { settlementDisplayAmount, settlementDisplayFee } =
      SettlementAmounts().fromTxn(pendingLedgerTx)
    expect(pendingTx.settlementDisplayAmount).toBe(settlementDisplayAmount)
    expect(pendingTx.settlementDisplayFee).toBe(settlementDisplayFee)

    if (sendAll) {
      expect(pendingTx.settlementAmount).toBe(-initialWalletBalance)
      expect(interimBalance).toBe(0)
    } else {
      expect(pendingTx.settlementAmount).toBe(-txnAmount - pendingTx.settlementFee)
      expect(interimBalance).toBe(
        initialWalletBalance - txnAmount - pendingTx.settlementFee,
      )
    }

    pendingTxHash = pendingTx.id as OnChainTxHash

    await checkIsBalanced()
  }

  // const subSpend = subscribeToChainSpend({ lnd: lndonchain, bech32_address: address, min_height: 1 })

  await Promise.all([
    once(sub, "chain_transaction"),
    mineBlockAndSync({ lnds: [lndonchain] }),
  ])

  await sleep(1000)

  {
    const txResult = await getTransactionsForWalletId(senderWalletId)
    if (txResult.error instanceof Error || txResult.result === null) {
      return txResult.error
    }
    const pendingTxs = txResult.result.slice.filter(
      ({ status }) => status === TxStatus.Pending,
    )
    expect(pendingTxs.length).toBe(0)

    const settledTxs = txResult.result.slice.filter(
      ({ status, initiationVia, id }) =>
        status === TxStatus.Success &&
        initiationVia.type === PaymentInitiationMethod.OnChain &&
        id === pendingTxHash,
    )
    expect(settledTxs.length).toBe(1)
    const settledTx = settledTxs[0]

    const feeRates = getFeesConfig()
    const feeSats: number = feeRates.withdrawDefaultMin + minerFee

    let fee = feeSats
    if (senderWallet.currency === WalletCurrency.Usd) {
      if (priceRatio === undefined) throw new Error("Unexpected undefined priceRatio")
      const feeResult = await priceRatio.convertFromBtcToCeil({
        amount: BigInt(fee),
        currency: WalletCurrency.Btc,
      })
      fee = Number(feeResult.amount)
    }

    expect(settledTx.settlementFee).toBe(fee)
    expect(settledTx.settlementDisplayPrice.base).toBeGreaterThan(0n)

    const settledLedgerTx = await LedgerService().getTransactionById(
      settledTx.id as LedgerTransactionId,
    )
    if (settledLedgerTx instanceof Error) throw settledLedgerTx
    const { settlementDisplayAmount, settlementDisplayFee } =
      SettlementAmounts().fromTxn(settledLedgerTx)
    expect(settledTx.settlementDisplayAmount).toBe(settlementDisplayAmount)
    expect(settledTx.settlementDisplayFee).toBe(settlementDisplayFee)

    const finalBalance = await getBalanceHelper(senderWalletId)

    if (sendAll) {
      expect(settledTx.settlementAmount).toBe(-initialWalletBalance)
      expect(finalBalance).toBe(0)
    } else {
      expect(settledTx.settlementAmount).toBe(-txnAmount - fee)
      expect(finalBalance).toBe(initialWalletBalance - txnAmount - fee)
    }

    // Check ledger transaction metadata for USD & BTC 'LedgerTransactionType.OnchainPayment'
    // ===
    const txHash = (settledTx.settlementVia as SettlementViaOnChain).transactionHash
    const txns = await LedgerService().getTransactionsByHash(txHash)
    if (txns instanceof Error) throw txns
    const txnPayment = txns.find(
      (tx) =>
        tx.walletId === senderWalletId &&
        tx.type === LedgerTransactionType.OnchainPayment &&
        tx.debit,
    )
    expect(txnPayment).not.toBeUndefined()

    let debit, satsAmount, centsAmount, satsFee, centsFee
    if (amountCurrency === WalletCurrency.Btc) {
      satsAmount = sendAll ? amountToSend - fee : amountToSend
      const btcPaymentAmount = {
        amount: BigInt(satsAmount),
        currency: WalletCurrency.Btc,
      }
      if (senderWallet.currency === WalletCurrency.Btc) {
        const centsPaymentAmount = await usdFromBtcMidPriceFn(btcPaymentAmount)
        if (centsPaymentAmount instanceof Error) throw centsPaymentAmount
        centsAmount = toCents(centsPaymentAmount.amount)

        satsFee = fee

        const priceRatio = WalletPriceRatio({
          usd: { amount: BigInt(centsAmount), currency: WalletCurrency.Usd },
          btc: { amount: BigInt(satsAmount), currency: WalletCurrency.Btc },
        })
        if (priceRatio instanceof Error) throw priceRatio
        const centsFeeAmount = priceRatio.convertFromBtcToCeil({
          amount: BigInt(satsFee),
          currency: WalletCurrency.Btc,
        })
        centsFee = toCents(centsFeeAmount.amount)

        debit = satsAmount + satsFee
      } else {
        const centsPaymentAmount = await dealerFns.getCentsFromSatsForImmediateSell(
          btcPaymentAmount,
        )
        if (centsPaymentAmount instanceof Error) throw centsPaymentAmount
        centsAmount = toCents(centsPaymentAmount.amount)

        centsFee = fee
        satsFee = feeSats

        debit = centsAmount + centsFee
      }
    }

    if (amountCurrency === WalletCurrency.Usd) {
      centsAmount = sendAll ? amountToSend - fee : amountToSend

      const btcAmount = await dealerFns.getSatsFromCentsForImmediateSell({
        amount: BigInt(centsAmount),
        currency: WalletCurrency.Usd,
      })
      if (btcAmount instanceof Error) throw btcAmount
      satsAmount = Number(btcAmount.amount)

      centsFee = fee
      satsFee = toSats(feeRates.withdrawDefaultMin + minerFee)

      debit = centsAmount + centsFee
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
    const displayFee = Number(
      displayPriceRatio.convertFromWallet({
        amount: BigInt(satsFee),
        currency: WalletCurrency.Btc,
      }).amountInMinor,
    )

    expect(txnPayment).toEqual(
      expect.objectContaining({
        type: LedgerTransactionType.OnchainPayment,

        debit,
        credit: 0,

        satsAmount,
        satsFee,
        centsAmount,
        centsFee,
        displayAmount:
          senderAccount.displayCurrency === DisplayCurrency.Usd
            ? centsAmount
            : displayAmount,
        displayFee:
          senderAccount.displayCurrency === DisplayCurrency.Usd ? centsFee : displayFee,

        displayCurrency: senderAccount.displayCurrency,
      }),
    )

    // Check notification sent
    // ===
    const amountForNotification =
      senderWallet.currency === WalletCurrency.Btc ? satsAmount : centsAmount

    const paymentAmount = {
      amount: BigInt(amountForNotification),
      currency: senderWallet.currency,
    }
    const paymentAsDisplayAmount = displayAmountFromNumber({
      amount: amountForNotification,
      currency: senderWallet.currency,
    })
    if (paymentAsDisplayAmount instanceof Error) throw paymentAsDisplayAmount

    const displayPaymentAmount =
      paymentAmount.currency === WalletCurrency.Btc
        ? displayPriceRatio.convertFromWallet(paymentAmount as BtcPaymentAmount)
        : paymentAsDisplayAmount

    const { title, body } = createPushNotificationContent({
      type: NotificationType.OnchainPayment,
      userLanguage: locale as UserLanguage,
      amount: paymentAmount,
      displayAmount: displayPaymentAmount,
    })

    expect(sendNotification.mock.calls.length).toBe(1)
    expect(sendNotification.mock.calls[0][0].title).toBe(title)
    expect(sendNotification.mock.calls[0][0].body).toBe(body)
  }

  sub.removeAllListeners()
}

const testInternalSend = async ({
  senderAccount,
  senderWalletId,
  recipientWalletId,
  senderAmount,
  amountCurrency,
}: {
  senderAccount: Account
  senderWalletId: WalletId
  recipientWalletId: WalletId
  senderAmount: Satoshis | UsdCents
  amountCurrency: WalletCurrency
}) => {
  const sendAll = false
  const fee = 0
  const feeSats = 0

  const memo = "this is my onchain memo #" + (Math.random() * 1_000_000).toFixed()

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet
  const { currency: senderCurrency } = senderWallet

  const recipientWallet = await WalletsRepository().findById(recipientWalletId)
  if (recipientWallet instanceof Error) return recipientWallet
  const { currency: recipientCurrency } = recipientWallet

  let amountResult: PaymentAmount<WalletCurrency> | DealerPriceServiceError
  let recipientAmount: number
  let senderAmountRecorded = senderAmount
  switch (true) {
    case senderCurrency === recipientCurrency:
      if (senderCurrency === WalletCurrency.Usd && senderCurrency !== amountCurrency) {
        // USD sender, BTC amount
        const btcPaymentAmount = {
          amount: BigInt(senderAmount),
          currency: WalletCurrency.Btc,
        }
        const amountResult = await usdFromBtcMidPriceFn(btcPaymentAmount)
        if (amountResult instanceof Error) throw amountResult

        senderAmountRecorded = toCents(amountResult.amount)
        recipientAmount = senderAmountRecorded
        break
      }

      recipientAmount = senderAmount
      break

    case senderCurrency === WalletCurrency.Usd &&
      recipientCurrency === WalletCurrency.Btc:
      if (senderCurrency !== amountCurrency) {
        // USD sender, BTC amount
        const btcPaymentAmount = {
          amount: BigInt(senderAmount),
          currency: WalletCurrency.Btc,
        }
        const amountResult = await dealerFns.getCentsFromSatsForImmediateSell(
          btcPaymentAmount,
        )
        if (amountResult instanceof Error) throw amountResult

        senderAmountRecorded = toCents(amountResult.amount)
        recipientAmount = senderAmount
        break
      }

      amountResult = await dealerFns.getSatsFromCentsForImmediateSell({
        amount: BigInt(senderAmount),
        currency: WalletCurrency.Usd,
      })
      if (amountResult instanceof Error) return amountResult
      recipientAmount = Number(amountResult.amount)
      break

    case senderCurrency === WalletCurrency.Btc &&
      recipientCurrency === WalletCurrency.Usd:
      amountResult = await dealerFns.getCentsFromSatsForImmediateBuy({
        amount: BigInt(senderAmount),
        currency: WalletCurrency.Btc,
      })
      if (amountResult instanceof Error) return amountResult
      recipientAmount = Number(amountResult.amount)
      break

    default:
      return new Error("Not possible")
  }

  const initialSenderBalance = await getBalanceHelper(senderWalletId)
  const initialRecipientBalance = await getBalanceHelper(recipientWalletId)

  const createAddressFn =
    recipientCurrency === WalletCurrency.Btc
      ? Wallets.createOnChainAddressForBtcWallet
      : Wallets.createOnChainAddressForUsdWallet
  const address = await createAddressFn(recipientWalletId)
  if (address instanceof Error) return address

  const sendArgs = {
    senderAccount: senderAccount,
    senderWalletId: senderWalletId,
    address,
    amount: senderAmount,
    targetConfirmations,
    memo,
    sendAll,
  }
  const paid =
    senderCurrency === WalletCurrency.Btc
      ? await Wallets.payOnChainByWalletIdForBtcWallet(sendArgs)
      : amountCurrency === WalletCurrency.Usd
      ? await Wallets.payOnChainByWalletIdForUsdWallet(sendArgs)
      : await Wallets.payOnChainByWalletIdForUsdWalletAndBtcAmount(sendArgs)
  if (paid instanceof Error) return paid

  // Check balances for both wallets
  // ===
  const finalSenderBalance = await getBalanceHelper(senderWalletId)
  const finalRecipient = await getBalanceHelper(recipientWalletId)

  expect(paid).toBe(PaymentSendStatus.Success)
  expect(finalSenderBalance).toBe(initialSenderBalance - senderAmountRecorded)
  expect(finalRecipient).toBe(initialRecipientBalance + recipientAmount)

  // Check txn details for sent wallet
  // ===
  const { result: txsSender, error } = await getTransactionsForWalletId(senderWalletId)
  if (error instanceof Error || txsSender === null) {
    return error
  }
  const pendingTxsSender = txsSender.slice.filter(
    ({ status }) => status === TxStatus.Pending,
  )
  expect(pendingTxsSender.length).toBe(0)

  const settledTxsSender = txsSender.slice.filter(
    ({ status, initiationVia, settlementVia, memo: txMemo }) =>
      status === TxStatus.Success &&
      initiationVia.type === PaymentInitiationMethod.OnChain &&
      settlementVia.type === SettlementMethod.IntraLedger &&
      txMemo === memo,
  )
  expect(settledTxsSender.length).toBe(1)
  const senderSettledTx = settledTxsSender[0]

  expect(senderSettledTx.settlementFee).toBe(0)
  expect(senderSettledTx.settlementAmount).toBe(-senderAmountRecorded)
  expect(senderSettledTx.settlementDisplayPrice.base).toBeGreaterThan(0n)

  const senderSettledLedgerTx = await LedgerService().getTransactionById(
    senderSettledTx.id as LedgerTransactionId,
  )
  if (senderSettledLedgerTx instanceof Error) throw senderSettledLedgerTx
  const { settlementDisplayAmount, settlementDisplayFee } =
    SettlementAmounts().fromTxn(senderSettledLedgerTx)
  expect(senderSettledTx.settlementDisplayAmount).toBe(settlementDisplayAmount)
  expect(senderSettledTx.settlementDisplayFee).toBe(settlementDisplayFee)

  // Check txn details for received wallet
  // ===
  const { result: txsRecipient, error: errorUserA } = await getTransactionsForWalletId(
    recipientWalletId,
  )
  if (errorUserA instanceof Error || txsRecipient === null) {
    return errorUserA
  }
  const pendingTxsRecipient = txsRecipient.slice.filter(
    ({ status }) => status === TxStatus.Pending,
  )
  expect(pendingTxsRecipient.length).toBe(0)

  const settledTxsRecipient = txsRecipient.slice.filter(
    ({ status, initiationVia, settlementVia }) =>
      status === TxStatus.Success &&
      initiationVia.type === PaymentInitiationMethod.OnChain &&
      settlementVia.type === SettlementMethod.IntraLedger,
  )
  const recipientSettledTx = settledTxsRecipient[0]

  expect(recipientSettledTx.settlementFee).toBe(0)
  expect(recipientSettledTx.settlementAmount).toBe(recipientAmount)
  expect(recipientSettledTx.settlementDisplayPrice.base).toBeGreaterThan(0n)

  const exponent = getCurrencyMajorExponent(
    recipientSettledTx.settlementDisplayPrice.displayCurrency,
  )

  expect(recipientSettledTx.settlementDisplayAmount).toBe(
    amountByPriceAsMajor({
      amount: recipientSettledTx.settlementAmount,
      price: recipientSettledTx.settlementDisplayPrice,
      walletCurrency: recipientSettledTx.settlementCurrency,
      displayCurrency: recipientSettledTx.settlementDisplayPrice.displayCurrency,
    }).toFixed(exponent),
  )
  expect(recipientSettledTx.settlementDisplayFee).toBe(
    amountByPriceAsMajor({
      amount: recipientSettledTx.settlementFee,
      price: recipientSettledTx.settlementDisplayPrice,
      walletCurrency: recipientSettledTx.settlementCurrency,
      displayCurrency: recipientSettledTx.settlementDisplayPrice.displayCurrency,
    }).toFixed(exponent),
  )

  // Check memos
  // ===
  const matchTx = (tx: WalletTransaction) =>
    tx.initiationVia.type === PaymentInitiationMethod.OnChain &&
    tx.initiationVia.address === address

  // sender should know memo
  const filteredTxs = txsSender.slice.filter(matchTx)
  expect(filteredTxs.length).toBe(1)
  expect(filteredTxs[0].memo).toBe(memo)

  // receiver should not know memo from sender
  const filteredTxsUserD = txsRecipient.slice.filter(matchTx)
  expect(filteredTxsUserD.length).toBe(1)
  expect(filteredTxsUserD[0].memo).not.toBe(memo)

  // Check ledger transaction metadata for USD & BTC 'LedgerTransactionType.OnchainIntraLedger'
  // ===
  const txns = await LedgerService().getTransactionsByWalletId(senderWalletId)
  if (txns instanceof Error) throw txns

  const txnPayment = txns.find(
    (tx) =>
      tx.type === LedgerTransactionType.OnchainIntraLedger &&
      tx.memoFromPayer === memo &&
      tx.debit,
  )
  expect(txnPayment).not.toBeUndefined()

  const amountToSend = senderAmount

  let debit, satsAmount, centsAmount, satsFee, centsFee
  if (amountCurrency === WalletCurrency.Btc) {
    satsAmount = sendAll ? amountToSend - fee : amountToSend
    const btcPaymentAmount = {
      amount: BigInt(satsAmount),
      currency: WalletCurrency.Btc,
    }
    if (senderWallet.currency === WalletCurrency.Btc) {
      const centsPaymentAmount =
        senderCurrency === recipientCurrency
          ? await usdFromBtcMidPriceFn(btcPaymentAmount)
          : await dealerFns.getCentsFromSatsForImmediateBuy(btcPaymentAmount)

      if (centsPaymentAmount instanceof Error) throw centsPaymentAmount
      centsAmount = toCents(centsPaymentAmount.amount)

      satsFee = fee

      const priceRatio = WalletPriceRatio({
        usd: { amount: BigInt(centsAmount), currency: WalletCurrency.Usd },
        btc: { amount: BigInt(satsAmount), currency: WalletCurrency.Btc },
      })
      if (priceRatio instanceof Error) throw priceRatio
      const centsFeeAmount = priceRatio.convertFromBtcToCeil({
        amount: BigInt(satsFee),
        currency: WalletCurrency.Btc,
      })
      centsFee = toCents(centsFeeAmount.amount)

      debit = satsAmount + satsFee
    } else {
      const centsPaymentAmount =
        senderCurrency === recipientCurrency
          ? await usdFromBtcMidPriceFn(btcPaymentAmount)
          : await dealerFns.getCentsFromSatsForImmediateSell(btcPaymentAmount)
      if (centsPaymentAmount instanceof Error) throw centsPaymentAmount
      centsAmount = toCents(centsPaymentAmount.amount)

      centsFee = fee
      satsFee = feeSats

      debit = centsAmount + centsFee
    }
  }

  if (amountCurrency === WalletCurrency.Usd) {
    centsAmount = sendAll ? amountToSend - fee : amountToSend
    const usdPaymentAmount = {
      amount: BigInt(centsAmount),
      currency: WalletCurrency.Usd,
    }
    const satsPaymentAmount =
      senderCurrency === recipientCurrency
        ? await btcFromUsdMidPriceFn(usdPaymentAmount)
        : await dealerFns.getSatsFromCentsForImmediateSell(usdPaymentAmount)
    if (satsPaymentAmount instanceof Error) throw satsPaymentAmount
    satsAmount = toSats(satsPaymentAmount.amount)

    centsFee = fee
    satsFee = 0

    debit = centsAmount + centsFee
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
  const displayFee = Number(
    displayPriceRatio.convertFromWallet({
      amount: BigInt(satsFee),
      currency: WalletCurrency.Btc,
    }).amountInMinor,
  )

  const expectedFields = {
    type: LedgerTransactionType.OnchainIntraLedger,

    debit,
    credit: 0,

    satsAmount,
    satsFee,
    centsAmount,
    centsFee,
    displayAmount:
      senderAccount.displayCurrency === DisplayCurrency.Usd ? centsAmount : displayAmount,
    displayFee:
      senderAccount.displayCurrency === DisplayCurrency.Usd ? centsFee : displayFee,

    displayCurrency: DisplayCurrency.Usd,
  }
  expect(txnPayment).toEqual(expect.objectContaining(expectedFields))
}

describe("BtcWallet - onChainPay", () => {
  it("sends a successful payment", async () => {
    const res = await testExternalSend({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      amount,
      amountCurrency: WalletCurrency.Btc,
      sendAll: false,
    })
    expect(res).not.toBeInstanceOf(Error)
  })

  it("sends all in a successful payment", async () => {
    const res = await testExternalSend({
      senderAccount: accountE,
      senderWalletId: walletIdE,
      amount,
      amountCurrency: WalletCurrency.Btc,
      sendAll: true,
    })
    expect(res).not.toBeInstanceOf(Error)
  })

  it("fails to send all from empty wallet", async () => {
    const res = await testExternalSend({
      senderAccount: accountE,
      senderWalletId: walletIdE,
      amount,
      amountCurrency: WalletCurrency.Btc,
      sendAll: true,
    })

    expect(res).toBeInstanceOf(InsufficientBalanceError)
    expect(res && res.message).toEqual(`No balance left to send.`)
  })

  it("sends a successful payment with memo", async () => {
    const memo = "this is my onchain memo"
    const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })
    const paymentResult = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address,
      amount,
      targetConfirmations,
      memo,
      sendAll: false,
    })
    expect(paymentResult).toBe(PaymentSendStatus.Success)
    const { result: txs, error } = await getTransactionsForWalletId(walletIdA)
    if (error instanceof Error || txs === null) {
      throw error
    }
    if (txs.slice.length === 0) {
      throw Error("No transactions found")
    }

    const firstTxs = txs.slice[0]
    expect(firstTxs.memo).toBe(memo)
    const pendingTxHash = firstTxs.id

    const sub = subscribeToTransactions({ lnd: lndonchain })
    sub.on("chain_transaction", onchainTransactionEventHandler)

    const results = await Promise.all([
      once(sub, "chain_transaction"),
      mineBlockAndSync({ lnds: [lndonchain] }),
    ])

    await sleep(1000)
    await onchainTransactionEventHandler(results[0][0])

    {
      const txResult = await getTransactionsForWalletId(walletIdA)
      if (txResult.error instanceof Error || txResult.result === null) {
        throw txResult.error
      }
      const pendingTxs = txResult.result.slice.filter(
        ({ status }) => status === TxStatus.Pending,
      )
      expect(pendingTxs.length).toBe(0)

      const settledTxs = txResult.result.slice.filter(
        ({ status, initiationVia, id }) =>
          status === TxStatus.Success &&
          initiationVia.type === PaymentInitiationMethod.OnChain &&
          id === pendingTxHash,
      )
      expect(settledTxs.length).toBe(1)
      const settledTx = settledTxs[0] as WalletTransaction

      expect(settledTx.memo).toBe(memo)
    }

    // Delay as workaround for occasional core-dump error
    await new Promise((resolve) => setImmediate(resolve))
    sub.removeAllListeners()
  })

  it("sends an on us transaction", async () => {
    const res = await testInternalSend({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      recipientWalletId: walletIdD,
      senderAmount: amount,
      amountCurrency: WalletCurrency.Btc,
    })
    expect(res).not.toBeInstanceOf(Error)
  })

  it("sends an on us transaction below dust limit", async () => {
    const res = await testInternalSend({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      recipientWalletId: walletIdD,
      senderAmount: toSats(amountBelowDustThreshold),
      amountCurrency: WalletCurrency.Btc,
    })
    expect(res).not.toBeInstanceOf(Error)
  })

  it("sends all with an on us transaction", async () => {
    const initialBalanceUserF = await getBalanceHelper(walletIdF)

    const address = await Wallets.createOnChainAddressForBtcWallet(walletIdD)
    if (address instanceof Error) throw address

    const initialBalanceUserD = await getBalanceHelper(walletIdD)
    const senderAccount = await getAccountByTestUserRef("F")

    const paid = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderAccount,
      senderWalletId: walletIdF,
      address,
      amount: 0,
      targetConfirmations,
      memo: null,
      sendAll: true,
    })

    const finalBalanceUserF = await getBalanceHelper(walletIdF)
    const finalBalanceUserD = await getBalanceHelper(walletIdD)

    expect(paid).toBe(PaymentSendStatus.Success)
    expect(finalBalanceUserF).toBe(0)
    expect(finalBalanceUserD).toBe(initialBalanceUserD + initialBalanceUserF)

    {
      const txResult = await getTransactionsForWalletId(walletIdF)
      if (txResult.error instanceof Error || txResult.result === null) {
        throw txResult.error
      }
      const pendingTxs = txResult.result.slice.filter(
        ({ status }) => status === TxStatus.Pending,
      )
      expect(pendingTxs.length).toBe(0)

      const settledTxs = txResult.result.slice.filter(
        ({ status, initiationVia, settlementVia }) =>
          status === TxStatus.Success &&
          initiationVia.type === PaymentInitiationMethod.OnChain &&
          settlementVia.type === SettlementMethod.IntraLedger,
      )
      expect(settledTxs.length).toBe(1)
      const settledTx = settledTxs[0] as WalletTransaction

      expect(settledTx.settlementFee).toBe(0)
      expect(settledTx.settlementAmount).toBe(-initialBalanceUserF)
      expect(settledTx.settlementDisplayPrice.base).toBeGreaterThan(0n)

      const finalBalance = await getBalanceHelper(walletIdF)
      expect(finalBalance).toBe(0)
    }
  })

  const lndVoidErrors = [
    { name: "insufficient funds", error: InsufficientOnChainFundsError },
    { name: "CPFP limit", error: CPFPAncestorLimitReachedError },
  ]
  test.each(lndVoidErrors)(
    "void transaction if lnd service returns $name error",
    async ({ error }) => {
      const onChainService = OnChainServiceImpl.OnChainService(TxDecoder(BTC_NETWORK))

      jest.spyOn(OnChainServiceImpl, "OnChainService").mockImplementationOnce(() => ({
        ...onChainService,
        payToAddress: () => Promise.resolve(new error()),
      }))

      const initialBalanceUserA = await getBalanceHelper(walletIdA)
      const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })

      const result = await Wallets.payOnChainByWalletIdForBtcWallet({
        senderAccount: accountA,
        senderWalletId: walletIdA,
        address,
        amount,
        targetConfirmations,
        memo: null,
        sendAll: false,
      })

      expect(result).toBeInstanceOf(error)

      const finalBalanceUserA = await getBalanceHelper(walletIdA)
      expect(finalBalanceUserA).toBe(initialBalanceUserA)

      const txResult = await getTransactionsForWalletId(walletIdA)
      if (txResult.error instanceof Error || txResult.result === null) {
        throw txResult.error
      }
      const pendingTxs = txResult.result.slice.filter(
        ({ status }) => status === TxStatus.Pending,
      )
      expect(pendingTxs.length).toBe(0)
    },
  )

  const lndKeepPendingErrors = [
    { name: "service unavailable", error: OnChainServiceUnavailableError },
    { name: "unknown", error: UnknownOnChainServiceError },
  ]
  test.each(lndKeepPendingErrors)(
    "keep pending transaction if lnd service returns $name error",
    async ({ error }) => {
      const onChainService = OnChainServiceImpl.OnChainService(TxDecoder(BTC_NETWORK))
      if (onChainService instanceof Error) throw onChainService

      jest.spyOn(OnChainServiceImpl, "OnChainService").mockImplementationOnce(() => ({
        ...onChainService,
        payToAddress: () => Promise.resolve(new error()),
      }))

      const initialBalanceUserA = await getBalanceHelper(walletIdA)
      const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })

      const result = await Wallets.payOnChainByWalletIdForBtcWallet({
        senderAccount: accountA,
        senderWalletId: walletIdA,
        address,
        amount,
        targetConfirmations,
        memo: null,
        sendAll: false,
      })

      expect(result).toBeInstanceOf(error)

      const txResult = await getTransactionsForWalletId(walletIdA)
      if (txResult.error instanceof Error || txResult.result === null) {
        throw txResult.error
      }
      const pendingTxs = txResult.result.slice.filter(
        ({ status }) => status === TxStatus.Pending,
      )
      expect(pendingTxs.length).toBe(1)

      const pendingTx = pendingTxs[0] as WalletOnChainSettledTransaction
      const finalBalanceUserA = await getBalanceHelper(walletIdA)
      expect(finalBalanceUserA).toBe(
        initialBalanceUserA - amount - pendingTx.settlementFee,
      )

      // clean pending tx to avoid collisions with other tests
      await onChainService.payToAddress({
        address: address as OnChainAddress,
        amount,
        targetConfirmations,
      })
      await mineBlockAndSyncAll()
      await LedgerService().settlePendingOnChainPayment(
        pendingTx.settlementVia.transactionHash,
      )
    },
  )

  it("fails if try to send a transaction to self", async () => {
    const res = await testInternalSend({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      recipientWalletId: walletIdA,
      senderAmount: amount,
      amountCurrency: WalletCurrency.Btc,
    })
    expect(res).toBeInstanceOf(SelfPaymentError)
  })

  it("fails if an on us payment has insufficient balance", async () => {
    const res = await testInternalSend({
      senderAccount: accountE,
      senderWalletId: walletIdE,
      recipientWalletId: walletIdD,
      senderAmount: amount,
      amountCurrency: WalletCurrency.Btc,
    })
    expect(res).toBeInstanceOf(InsufficientBalanceError)
  })

  it("fails if has insufficient balance", async () => {
    const { address } = await createChainAddress({
      lnd: lndOutside1,
      format: "p2wpkh",
    })
    const initialBalanceUserG = await getBalanceHelper(walletIdG)

    const status = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderAccount: accountG,
      senderWalletId: walletIdG,
      address,
      amount: initialBalanceUserG,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })
    //should fail because user does not have balance to pay for on-chain fee
    expect(status).toBeInstanceOf(InsufficientBalanceError)
  })

  it("fails if onchain service has insufficient balance", async () => {
    const { address } = await createChainAddress({
      lnd: lndOutside1,
      format: "p2wpkh",
    })
    const initialBalanceUserG = await getBalanceHelper(walletIdG)

    const onChainService = OnChainServiceImpl.OnChainService(TxDecoder(BTC_NETWORK))
    if (onChainService instanceof Error) throw onChainService
    jest.spyOn(OnChainServiceImpl, "OnChainService").mockImplementationOnce(() => ({
      ...onChainService,
      getBalanceAmount: () =>
        Promise.resolve(
          paymentAmountFromNumber({
            amount: initialBalanceUserG,
            currency: WalletCurrency.Btc,
          }),
        ),
    }))

    const status = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderAccount: accountG,
      senderWalletId: walletIdG,
      address,
      amount: initialBalanceUserG,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })

    //should fail because onchain does not have balance to pay for on-chain fee
    expect(status).toBeInstanceOf(RebalanceNeededError)
  })

  it("fails if has negative amount", async () => {
    const amount = -1000
    const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })

    const status = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address,
      amount,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })
    expect(status).toBeInstanceOf(InvalidBtcPaymentAmountError)
  })

  it("fails if withdrawal limit hit", async () => {
    const { address } = await createChainAddress({
      lnd: lndOutside1,
      format: "p2wpkh",
    })

    const ledgerService = LedgerService()
    const timestamp1DayAgo = timestampDaysAgo(ONE_DAY)
    if (timestamp1DayAgo instanceof Error) return timestamp1DayAgo

    const walletVolume = await ledgerService.externalPaymentVolumeSince({
      walletId: walletIdA,
      timestamp: timestamp1DayAgo,
    })
    if (walletVolume instanceof Error) return walletVolume

    const { outgoingBaseAmount } = walletVolume

    const withdrawalLimit = getAccountLimits({ level: accountA.level }).withdrawalLimit

    const walletPriceRatio = await Prices.getCurrentPriceAsWalletPriceRatio({
      currency: WalletCurrency.Usd,
    })
    if (walletPriceRatio instanceof Error) throw walletPriceRatio
    const satsAmount = walletPriceRatio.convertFromUsd({
      amount: BigInt(withdrawalLimit),
      currency: WalletCurrency.Usd,
    })

    const subResult = sub(toSats(satsAmount.amount), outgoingBaseAmount)
    if (subResult instanceof Error) throw subResult

    const amount = add(subResult, toSats(100))

    const status = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address,
      amount,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })

    expect(status).toBeInstanceOf(LimitsExceededError)
  })

  it("fails if the amount is less than on chain dust amount", async () => {
    const address = await bitcoindOutside.getNewAddress()

    const status = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address,
      amount: amountBelowDustThreshold,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })
    expect(status).toBeInstanceOf(LessThanDustThresholdError)
  })

  it("fails if the amount is less than lnd on-chain dust amount", async () => {
    const address = await bitcoindOutside.getNewAddress()

    const status = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address,
      amount: 1,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })
    expect(status).toBeInstanceOf(LessThanDustThresholdError)
  })
})

describe("UsdWallet - onChainPay", () => {
  describe("to an internal address", () => {
    const amountCases = [
      { amountCurrency: WalletCurrency.Usd, senderAmount: usdAmount },
      { amountCurrency: WalletCurrency.Btc, senderAmount: amount },
    ]

    it("sends from btc wallet to usd wallet", async () => {
      const res = await testInternalSend({
        senderAccount: accountA,
        senderWalletId: walletIdA,
        recipientWalletId: walletIdUsdB,
        senderAmount: amount,
        amountCurrency: WalletCurrency.Btc,
      })
      expect(res).not.toBeInstanceOf(Error)
    })

    it("fails to send with less-than-1-cent amount from btc wallet to usd wallet", async () => {
      const btcSendAmount = toSats(10)

      const usdAmount = await dealerFns.getCentsFromSatsForImmediateBuy({
        amount: BigInt(btcSendAmount),
        currency: WalletCurrency.Btc,
      })
      if (usdAmount instanceof Error) return usdAmount
      const btcSendAmountInUsd = Number(usdAmount.amount)

      expect(btcSendAmountInUsd).toBe(0)

      const res = await testInternalSend({
        senderAccount: accountA,
        senderWalletId: walletIdA,
        recipientWalletId: walletIdUsdB,
        senderAmount: btcSendAmount,
        amountCurrency: WalletCurrency.Btc,
      })
      expect(res).toBeInstanceOf(InvalidZeroAmountPriceRatioInputError)
    })

    amountCases.forEach(({ amountCurrency, senderAmount }) => {
      describe(`with ${amountCurrency} amount currency`, () => {
        it("sends from usd wallet to usd wallet", async () => {
          const res = await testInternalSend({
            senderAccount: accountB,
            senderWalletId: walletIdUsdB,
            recipientWalletId: walletIdUsdA,
            senderAmount,
            amountCurrency,
          })
          expect(res).not.toBeInstanceOf(Error)
        })

        it("sends from usd wallet to btc wallet", async () => {
          const res = await testInternalSend({
            senderAccount: accountB,
            senderWalletId: walletIdUsdB,
            recipientWalletId: walletIdA,
            senderAmount,
            amountCurrency,
          })
          expect(res).not.toBeInstanceOf(Error)
        })
      })
    })
  })

  describe("to an external address", () => {
    it("send from usd wallet", async () => {
      const res = await testExternalSend({
        senderAccount: accountB,
        senderWalletId: walletIdUsdB,
        amount: usdAmount,
        amountCurrency: WalletCurrency.Usd,
        sendAll: false,
      })
      expect(res).not.toBeInstanceOf(Error)
    })

    it("send sats from usd wallet", async () => {
      const res = await testExternalSend({
        senderAccount: accountB,
        senderWalletId: walletIdUsdB,
        amount,
        amountCurrency: WalletCurrency.Btc,
        sendAll: false,
      })
      expect(res).not.toBeInstanceOf(Error)
    })

    it("send all from usd wallet", async () => {
      const res = await testExternalSend({
        senderAccount: accountB,
        senderWalletId: walletIdUsdB,
        amount: usdAmount,
        amountCurrency: WalletCurrency.Usd,
        sendAll: true,
      })
      expect(res).not.toBeInstanceOf(Error)
    })

    it("fails to send all from empty usd wallet", async () => {
      const res = await testExternalSend({
        senderAccount: accountB,
        senderWalletId: walletIdUsdB,
        amount: usdAmount,
        amountCurrency: WalletCurrency.Usd,
        sendAll: true,
      })

      expect(res).toBeInstanceOf(InsufficientBalanceError)
      expect(res && res.message).toEqual(`No balance left to send.`)
    })
  })
})
