import { Prices, Wallets } from "@app"
import { getAccountLimits, getOnChainWalletConfig, ONE_DAY } from "@config"
import { toSats } from "@domain/bitcoin"
import {
  InsufficientBalanceError,
  LessThanDustThresholdError,
  LimitsExceededError,
  SelfPaymentError,
} from "@domain/errors"
import { InvalidZeroAmountPriceRatioInputError } from "@domain/payments"

import { LedgerService } from "@services/ledger"
import * as BriaImpl from "@services/bria"
import * as LedgerFacadeOnChainSendImpl from "@services/ledger/facade/onchain-send"
import * as LedgerFacadeTxMetadataImpl from "@services/ledger/facade/tx-metadata"

import { timestampDaysAgo } from "@utils"

import { DisplayCurrency, toCents } from "@domain/fiat"

import { AccountsRepository } from "@services/mongoose"
import { Transaction } from "@services/ledger/schema"

import {
  AmountCalculator,
  WalletCurrency,
  InvalidBtcPaymentAmountError,
} from "@domain/shared"

import { PayoutSpeed } from "@domain/bitcoin/onchain"

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
  getBtcWalletDescriptorByTestUserRef,
  getUsdWalletDescriptorByTestUserRef,
  createRandomUserAndWallet,
  createRandomUserAndUsdWallet,
} from "test/helpers"
import { recordReceiveLnPayment } from "test/helpers/ledger"
import { getBalanceHelper } from "test/helpers/wallet"

let accountA: Account
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

  walletIdD = await getDefaultWalletIdByTestUserRef("D")
  walletIdE = await getDefaultWalletIdByTestUserRef("E")
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
