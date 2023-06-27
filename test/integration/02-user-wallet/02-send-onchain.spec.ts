import { Prices, Wallets } from "@app"
import { getAccountLimits, getOnChainWalletConfig, ONE_DAY } from "@config"
import { toSats } from "@domain/bitcoin"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import {
  InsufficientBalanceError,
  LessThanDustThresholdError,
  LimitsExceededError,
  SelfPaymentError,
} from "@domain/errors"
import { InvalidZeroAmountPriceRatioInputError, WalletPriceRatio } from "@domain/payments"
import { PaymentInitiationMethod, SettlementMethod, TxStatus } from "@domain/wallets"

import { LedgerService } from "@services/ledger"
import * as BriaImpl from "@services/bria"
import * as LedgerFacadeOnChainSendImpl from "@services/ledger/facade/onchain-send"
import * as LedgerFacadeTxMetadataImpl from "@services/ledger/facade/tx-metadata"

import { timestampDaysAgo } from "@utils"

import {
  btcFromUsdMidPriceFn,
  getCurrentPriceAsDisplayPriceRatio,
  usdFromBtcMidPriceFn,
} from "@app/prices"

import { LedgerTransactionType } from "@domain/ledger"

import { DisplayCurrency, getCurrencyMajorExponent, toCents } from "@domain/fiat"

import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { Transaction } from "@services/ledger/schema"

import {
  AmountCalculator,
  WalletCurrency,
  InvalidBtcPaymentAmountError,
} from "@domain/shared"

import { PayoutSpeed } from "@domain/bitcoin/onchain"
import { SettlementAmounts } from "@domain/wallets/settlement-amounts"

import { DealerPriceService } from "@services/dealer-price"

import {
  bitcoindClient,
  bitcoindOutside,
  checkIsBalanced,
  createMandatoryUsers,
  createUserAndWalletFromUserRef,
  getAccountByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  getUsdWalletIdByTestUserRef,
  amountByPriceAsMajor,
  getBtcWalletDescriptorByTestUserRef,
  getUsdWalletDescriptorByTestUserRef,
  createRandomUserAndWallet,
  createRandomUserAndUsdWallet,
} from "test/helpers"
import { recordReceiveLnPayment } from "test/helpers/ledger"
import { getBalanceHelper, getTransactionsForWalletId } from "test/helpers/wallet"

let accountA: Account
let accountB: Account
let accountE: Account
let accountG: Account

let walletIdA: WalletId
let walletDescriptorA: WalletDescriptor<"BTC">
let walletIdUsdA: WalletId
let walletUsdDescriptorA: WalletDescriptor<"USD">
let walletIdUsdB: WalletId
let walletIdD: WalletId
let walletIdG: WalletId

// using walletIdE and walletIdF to sendAll
let walletIdE: WalletId
let walletIdF: WalletId

let outsideAddress: OnChainAddress

const dealerFns = DealerPriceService()

const calc = AmountCalculator()

beforeAll(async () => {
  await createMandatoryUsers()

  await createUserAndWalletFromUserRef("B")
  await createUserAndWalletFromUserRef("D")
  await createUserAndWalletFromUserRef("E")
  await createUserAndWalletFromUserRef("F")

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  walletDescriptorA = await getBtcWalletDescriptorByTestUserRef("A")

  walletIdUsdA = await getUsdWalletIdByTestUserRef("A")
  walletUsdDescriptorA = await getUsdWalletDescriptorByTestUserRef("A")

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
  outsideAddress = (await bitcoindOutside.getNewAddress()) as OnChainAddress
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

const amount = toSats(10040)
const btcPaymentAmount: BtcPaymentAmount = {
  amount: BigInt(amount),
  currency: WalletCurrency.Btc,
}

const usdAmount = toCents(210)
const usdPaymentAmount: UsdPaymentAmount = {
  amount: BigInt(usdAmount),
  currency: WalletCurrency.Usd,
}

const receiveAmounts = {
  btc: calc.mul(btcPaymentAmount, 3n),
  usd: calc.mul(usdPaymentAmount, 3n),
}

const receiveBankFee = {
  btc: { amount: 100n, currency: WalletCurrency.Btc },
  usd: { amount: 1n, currency: WalletCurrency.Usd },
}

const receiveDisplayAmounts = {
  amountDisplayCurrency: Number(receiveAmounts.usd.amount) as DisplayCurrencyBaseAmount,
  feeDisplayCurrency: Number(receiveBankFee.usd.amount) as DisplayCurrencyBaseAmount,
  displayCurrency: DisplayCurrency.Usd,
}

const amountBelowDustThreshold = getOnChainWalletConfig().dustThreshold - 1

const randomOnChainMemo = () =>
  "this is my onchain memo #" + (Math.random() * 1_000_000).toFixed()

const randomPayoutId = () => crypto.randomUUID() as PayoutId

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
  const address = await createAddressFn({ walletId: recipientWalletId })
  if (address instanceof Error) return address

  const sendArgs = {
    senderAccount: senderAccount,
    senderWalletId: senderWalletId,
    address,
    amount: senderAmount,
    speed: PayoutSpeed.Fast,
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

  expect(paid.status).toBe(PaymentSendStatus.Success)
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
    const payoutId = randomPayoutId()
    const memo = randomOnChainMemo()

    // Setup system state
    const receive = await recordReceiveLnPayment({
      walletDescriptor: walletDescriptorA,
      paymentAmount: receiveAmounts,
      bankFee: receiveBankFee,
      displayAmounts: receiveDisplayAmounts,
      memo,
    })
    if (receive instanceof Error) throw receive

    // Setup spies and mocks
    const { NewOnChainService: NewOnChainServiceOrig } =
      jest.requireActual("@services/bria")
    const briaSpy = jest.spyOn(BriaImpl, "NewOnChainService").mockReturnValue({
      ...NewOnChainServiceOrig(),
      queuePayoutToAddress: async () => payoutId,
    })

    const onChainSendLedgerMetadataSpy = jest.spyOn(
      LedgerFacadeTxMetadataImpl,
      "OnChainSendLedgerMetadata",
    )

    const recordSendOnChainSpy = jest.spyOn(
      LedgerFacadeOnChainSendImpl,
      "recordSendOnChain",
    )

    // Execute use-case
    const res = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderWalletId: walletIdA,
      senderAccount: accountA,
      amount,
      address: outsideAddress,

      speed: PayoutSpeed.Fast,
      memo,
    })
    if (res instanceof Error) throw res
    expect(res.payoutId).toBe(payoutId)

    // Inspect spies
    expect(onChainSendLedgerMetadataSpy).toHaveBeenCalledTimes(1)

    const callParams = onChainSendLedgerMetadataSpy.mock.calls[0][0]
    expect(callParams).toEqual(
      expect.objectContaining({
        paymentAmounts: expect.objectContaining({
          btcPaymentAmount: { amount: BigInt(amount), currency: WalletCurrency.Btc },
        }),
        payeeAddresses: expect.arrayContaining([outsideAddress]),
      }),
    )

    expect(recordSendOnChainSpy).toHaveBeenCalledTimes(1)
    const recordCallParams = recordSendOnChainSpy.mock.calls[0][0]
    expect(recordCallParams).toEqual(
      expect.objectContaining({
        senderWalletDescriptor: expect.objectContaining({
          currency: WalletCurrency.Btc,
        }),
      }),
    )

    // Restore system state
    await Transaction.deleteMany({ memo })
    briaSpy.mockRestore()
    onChainSendLedgerMetadataSpy.mockClear()
    recordSendOnChainSpy.mockClear()
  })

  it("sends all in a successful payment", async () => {
    const newWalletDescriptor = await createRandomUserAndWallet()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    const payoutId = randomPayoutId()
    const memo = randomOnChainMemo()

    // Setup system state
    const receive = await recordReceiveLnPayment({
      walletDescriptor: newWalletDescriptor,
      paymentAmount: receiveAmounts,
      bankFee: receiveBankFee,
      displayAmounts: receiveDisplayAmounts,
      memo,
    })
    if (receive instanceof Error) throw receive

    // Read required system state
    const sendAllAmount = await LedgerService().getWalletBalanceAmount(
      newWalletDescriptor,
    )
    if (sendAllAmount instanceof Error) throw sendAllAmount

    // Setup spies and mocks
    const { NewOnChainService: NewOnChainServiceOrig } =
      jest.requireActual("@services/bria")
    const briaSpy = jest.spyOn(BriaImpl, "NewOnChainService").mockReturnValue({
      ...NewOnChainServiceOrig(),
      queuePayoutToAddress: async () => payoutId,
    })

    const onChainSendLedgerMetadataSpy = jest.spyOn(
      LedgerFacadeTxMetadataImpl,
      "OnChainSendLedgerMetadata",
    )

    const recordSendOnChainSpy = jest.spyOn(
      LedgerFacadeOnChainSendImpl,
      "recordSendOnChain",
    )

    // Execute use-case
    const res = await Wallets.payAllOnChainByWalletId({
      senderWalletId: newWalletDescriptor.id,
      senderAccount: newAccount,
      address: outsideAddress,
      amount: 0,

      speed: PayoutSpeed.Fast,
      memo,
    })
    if (res instanceof Error) throw res
    expect(res.payoutId).toBe(payoutId)

    // Inspect spies
    expect(onChainSendLedgerMetadataSpy).toHaveBeenCalledTimes(1)

    const metadataCallParams = onChainSendLedgerMetadataSpy.mock.calls[0][0]
    const {
      paymentAmounts: { btcPaymentAmount, btcProtocolAndBankFee },
    } = metadataCallParams
    expect(sendAllAmount).toStrictEqual(calc.add(btcPaymentAmount, btcProtocolAndBankFee))

    const recordCallParams = recordSendOnChainSpy.mock.calls[0][0]
    expect(recordCallParams).toEqual(
      expect.objectContaining({
        senderWalletDescriptor: expect.objectContaining({
          currency: WalletCurrency.Btc,
        }),
      }),
    )

    // Restore system state
    await Transaction.deleteMany({ memo })
    briaSpy.mockRestore()
    onChainSendLedgerMetadataSpy.mockClear()
    recordSendOnChainSpy.mockClear()
  })

  it("fails to send all from empty wallet", async () => {
    const newWalletDescriptor = await createRandomUserAndWallet()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    const memo = randomOnChainMemo()

    // Execute use-case
    const res = await Wallets.payAllOnChainByWalletId({
      senderWalletId: newWalletDescriptor.id,
      senderAccount: newAccount,
      address: outsideAddress,
      amount: 0,

      speed: PayoutSpeed.Fast,
      memo,
    })
    expect(res).toBeInstanceOf(InsufficientBalanceError)
    expect(res instanceof Error && res.message).toEqual(`No balance left to send.`)

    // Restore system state
    Transaction.deleteMany({ memo })
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

    const address = await Wallets.createOnChainAddressForBtcWallet({
      walletId: walletIdD,
    })
    if (address instanceof Error) throw address

    const initialBalanceUserD = await getBalanceHelper(walletIdD)
    const senderAccount = await getAccountByTestUserRef("F")

    const paid = await Wallets.payAllOnChainByWalletId({
      senderAccount,
      senderWalletId: walletIdF,
      address,
      amount: 0,
      speed: PayoutSpeed.Fast,
      memo: null,
    })
    if (paid instanceof Error) throw paid

    const finalBalanceUserF = await getBalanceHelper(walletIdF)
    const finalBalanceUserD = await getBalanceHelper(walletIdD)

    expect(paid.status).toBe(PaymentSendStatus.Success)
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

  it("fails if try to send a transaction to self", async () => {
    const walletIdAAddress = await Wallets.createOnChainAddressForBtcWallet({
      walletId: walletIdA,
    })
    if (walletIdAAddress instanceof Error) throw walletIdAAddress

    const res = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderWalletId: walletIdA,
      senderAccount: accountA,
      amount,
      address: walletIdAAddress,

      speed: PayoutSpeed.Fast,
      memo: randomOnChainMemo(),
    })
    expect(res).toBeInstanceOf(SelfPaymentError)
  })

  it("fails if an on us payment has insufficient balance", async () => {
    const walletIdDAddress = await Wallets.createOnChainAddressForBtcWallet({
      walletId: walletIdD,
    })
    if (walletIdDAddress instanceof Error) throw walletIdDAddress

    await Wallets.payAllOnChainByWalletId({
      senderWalletId: walletIdE,
      senderAccount: accountE,
      amount,
      address: walletIdDAddress,

      speed: PayoutSpeed.Fast,
      memo: randomOnChainMemo(),
    })

    const res = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderWalletId: walletIdE,
      senderAccount: accountE,
      amount,
      address: walletIdDAddress,

      speed: PayoutSpeed.Fast,
      memo: randomOnChainMemo(),
    })

    expect(res).toBeInstanceOf(InsufficientBalanceError)
  })

  it("fails if has insufficient balance", async () => {
    const initialBalanceUserG = await getBalanceHelper(walletIdG)

    const result = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderAccount: accountG,
      senderWalletId: walletIdG,
      address: outsideAddress,
      amount: initialBalanceUserG,

      speed: PayoutSpeed.Fast,
      memo: randomOnChainMemo(),
    })

    //should fail because user does not have balance to pay for on-chain fee
    expect(result).toBeInstanceOf(InsufficientBalanceError)
  })

  it("fails if has negative amount", async () => {
    const amount = -1000

    const result = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address: outsideAddress,
      amount,

      speed: PayoutSpeed.Fast,
      memo: randomOnChainMemo(),
    })
    expect(result).toBeInstanceOf(InvalidBtcPaymentAmountError)
  })

  it("fails if withdrawal limit hit", async () => {
    const timestamp1DayAgo = timestampDaysAgo(ONE_DAY)
    if (timestamp1DayAgo instanceof Error) throw timestamp1DayAgo
    const walletVolume = await LedgerService().externalPaymentVolumeAmountSince({
      walletDescriptor: walletDescriptorA,
      timestamp: timestamp1DayAgo,
    })
    if (walletVolume instanceof Error) throw walletVolume
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

    const remainingLimit = calc.sub(satsAmount, outgoingBaseAmount)

    const result = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address: outsideAddress,
      amount: Number(remainingLimit.amount) + 100,

      speed: PayoutSpeed.Fast,
      memo: randomOnChainMemo(),
    })

    expect(result).toBeInstanceOf(LimitsExceededError)
  })

  it("fails if the amount is less than on chain dust amount", async () => {
    const result = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address: outsideAddress,
      amount: amountBelowDustThreshold,

      speed: PayoutSpeed.Fast,
      memo: randomOnChainMemo(),
    })
    expect(result).toBeInstanceOf(LessThanDustThresholdError)
  })

  it("fails if the amount is less than lnd on-chain dust amount", async () => {
    const result = await Wallets.payOnChainByWalletIdForBtcWallet({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address: outsideAddress,
      amount: 1,

      speed: PayoutSpeed.Fast,
      memo: randomOnChainMemo(),
    })
    expect(result).toBeInstanceOf(LessThanDustThresholdError)
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

      const walletIdUsdBAddress = await Wallets.createOnChainAddressForUsdWallet({
        walletId: walletIdUsdB,
      })
      if (walletIdUsdBAddress instanceof Error) throw walletIdUsdBAddress

      const usdAmount = await dealerFns.getCentsFromSatsForImmediateBuy({
        amount: BigInt(btcSendAmount),
        currency: WalletCurrency.Btc,
      })
      if (usdAmount instanceof Error) return usdAmount
      const btcSendAmountInUsd = Number(usdAmount.amount)
      expect(btcSendAmountInUsd).toBe(0)

      const res = await Wallets.payOnChainByWalletIdForBtcWallet({
        senderAccount: accountA,
        senderWalletId: walletIdA,
        address: walletIdUsdBAddress,
        amount: btcSendAmount,

        speed: PayoutSpeed.Fast,
        memo: randomOnChainMemo(),
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
      const payoutId = randomPayoutId()
      const memo = randomOnChainMemo()

      // Setup system state
      const receive = await recordReceiveLnPayment({
        walletDescriptor: walletUsdDescriptorA,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      // Setup spies and mocks
      const { NewOnChainService: NewOnChainServiceOrig } =
        jest.requireActual("@services/bria")
      const briaSpy = jest.spyOn(BriaImpl, "NewOnChainService").mockReturnValue({
        ...NewOnChainServiceOrig(),
        queuePayoutToAddress: async () => payoutId,
      })

      const onChainSendLedgerMetadataSpy = jest.spyOn(
        LedgerFacadeTxMetadataImpl,
        "OnChainSendLedgerMetadata",
      )

      const recordSendOnChainSpy = jest.spyOn(
        LedgerFacadeOnChainSendImpl,
        "recordSendOnChain",
      )

      // Execute use-case
      const res = await Wallets.payOnChainByWalletIdForUsdWallet({
        senderWalletId: walletIdUsdA,
        senderAccount: accountA,
        amount: usdAmount,
        address: outsideAddress,

        speed: PayoutSpeed.Fast,
        memo,
      })
      if (res instanceof Error) throw res
      expect(res.payoutId).toBe(payoutId)

      // Inspect spies
      expect(onChainSendLedgerMetadataSpy).toHaveBeenCalledTimes(1)
      const metadataCallParams = onChainSendLedgerMetadataSpy.mock.calls[0][0]
      expect(metadataCallParams).toEqual(
        expect.objectContaining({
          paymentAmounts: expect.objectContaining({
            usdPaymentAmount: { amount: BigInt(usdAmount), currency: WalletCurrency.Usd },
          }),
          payeeAddresses: expect.arrayContaining([outsideAddress]),
        }),
      )

      expect(recordSendOnChainSpy).toHaveBeenCalledTimes(1)
      const recordCallParams = recordSendOnChainSpy.mock.calls[0][0]
      expect(recordCallParams).toEqual(
        expect.objectContaining({
          senderWalletDescriptor: expect.objectContaining({
            currency: WalletCurrency.Usd,
          }),
        }),
      )

      // Restore system state
      await Transaction.deleteMany({ memo })
      briaSpy.mockRestore()
      onChainSendLedgerMetadataSpy.mockClear()
      recordSendOnChainSpy.mockClear()
    })

    it("send sats from usd wallet", async () => {
      const payoutId = randomPayoutId()
      const memo = randomOnChainMemo()

      // Setup system state
      const receive = await recordReceiveLnPayment({
        walletDescriptor: walletUsdDescriptorA,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      // Setup spies and mocks
      const { NewOnChainService: NewOnChainServiceOrig } =
        jest.requireActual("@services/bria")
      const briaSpy = jest.spyOn(BriaImpl, "NewOnChainService").mockReturnValue({
        ...NewOnChainServiceOrig(),
        queuePayoutToAddress: async () => payoutId,
      })

      const onChainSendLedgerMetadataSpy = jest.spyOn(
        LedgerFacadeTxMetadataImpl,
        "OnChainSendLedgerMetadata",
      )

      const recordSendOnChainSpy = jest.spyOn(
        LedgerFacadeOnChainSendImpl,
        "recordSendOnChain",
      )

      // Execute use-case
      const res = await Wallets.payOnChainByWalletIdForUsdWalletAndBtcAmount({
        senderWalletId: walletIdUsdA,
        senderAccount: accountA,
        amount,
        address: outsideAddress,

        speed: PayoutSpeed.Fast,
        memo,
      })
      if (res instanceof Error) throw res
      expect(res.payoutId).toBe(payoutId)

      // Inspect spies
      expect(onChainSendLedgerMetadataSpy).toHaveBeenCalledTimes(1)
      const metadataCallParams = onChainSendLedgerMetadataSpy.mock.calls[0][0]
      expect(metadataCallParams).toEqual(
        expect.objectContaining({
          paymentAmounts: expect.objectContaining({
            btcPaymentAmount: { amount: BigInt(amount), currency: WalletCurrency.Btc },
          }),
          payeeAddresses: expect.arrayContaining([outsideAddress]),
        }),
      )

      expect(recordSendOnChainSpy).toHaveBeenCalledTimes(1)
      const recordCallParams = recordSendOnChainSpy.mock.calls[0][0]
      expect(recordCallParams).toEqual(
        expect.objectContaining({
          senderWalletDescriptor: expect.objectContaining({
            currency: WalletCurrency.Usd,
          }),
        }),
      )

      // Restore system state
      await Transaction.deleteMany({ memo })
      briaSpy.mockRestore()
      onChainSendLedgerMetadataSpy.mockClear()
      recordSendOnChainSpy.mockClear()
    })

    it("send all from usd wallet", async () => {
      const newWalletDescriptor = await createRandomUserAndUsdWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      const payoutId = randomPayoutId()
      const memo = randomOnChainMemo()

      // Setup system state
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      // Read required system state
      const sendAllAmount = await LedgerService().getWalletBalanceAmount(
        newWalletDescriptor,
      )
      if (sendAllAmount instanceof Error) throw sendAllAmount

      // Setup spies and mocks
      const { NewOnChainService: NewOnChainServiceOrig } =
        jest.requireActual("@services/bria")
      const briaSpy = jest.spyOn(BriaImpl, "NewOnChainService").mockReturnValue({
        ...NewOnChainServiceOrig(),
        queuePayoutToAddress: async () => payoutId,
      })

      const onChainSendLedgerMetadataSpy = jest.spyOn(
        LedgerFacadeTxMetadataImpl,
        "OnChainSendLedgerMetadata",
      )

      const recordSendOnChainSpy = jest.spyOn(
        LedgerFacadeOnChainSendImpl,
        "recordSendOnChain",
      )

      // Execute use-case
      const res = await Wallets.payAllOnChainByWalletId({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: outsideAddress,
        amount: 0,

        speed: PayoutSpeed.Fast,
        memo,
      })
      if (res instanceof Error) throw res
      expect(res.payoutId).toBe(payoutId)

      // Inspect spies
      expect(onChainSendLedgerMetadataSpy).toHaveBeenCalledTimes(1)
      const metadataCallParams = onChainSendLedgerMetadataSpy.mock.calls[0][0]
      const {
        paymentAmounts: { usdPaymentAmount, usdProtocolAndBankFee },
      } = metadataCallParams
      expect(sendAllAmount).toStrictEqual(
        calc.add(usdPaymentAmount, usdProtocolAndBankFee),
      )

      const recordCallParams = recordSendOnChainSpy.mock.calls[0][0]
      expect(recordCallParams).toEqual(
        expect.objectContaining({
          senderWalletDescriptor: expect.objectContaining({
            currency: WalletCurrency.Usd,
          }),
        }),
      )

      // Restore system state
      await Transaction.deleteMany({ memo })
      briaSpy.mockRestore()
      onChainSendLedgerMetadataSpy.mockClear()
      recordSendOnChainSpy.mockClear()
    })

    it("fails to send all from empty usd wallet", async () => {
      const newWalletDescriptor = await createRandomUserAndUsdWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount
      const memo = randomOnChainMemo()

      // Execute use-case
      const res = await Wallets.payAllOnChainByWalletId({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: outsideAddress,
        amount: 0,

        speed: PayoutSpeed.Fast,
        memo,
      })
      expect(res).toBeInstanceOf(InsufficientBalanceError)
      expect(res instanceof Error && res.message).toEqual(`No balance left to send.`)

      // Restore system state
      Transaction.deleteMany({ memo })
    })
  })
})
