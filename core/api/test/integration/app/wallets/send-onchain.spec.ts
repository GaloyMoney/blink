import { randomUUID } from "crypto"

import { Accounts, Prices, Wallets, Payments } from "@/app"

import { getAccountLimits, getOnChainWalletConfig, ONE_DAY } from "@/config"

import { AccountStatus } from "@/domain/accounts"
import { toSats } from "@/domain/bitcoin"
import { toCents, UsdDisplayCurrency } from "@/domain/fiat"
import {
  InactiveAccountError,
  InsufficientBalanceError,
  IntraledgerLimitsExceededError,
  LessThanDustThresholdError,
  SelfPaymentError,
  TradeIntraAccountLimitsExceededError,
  WithdrawalLimitsExceededError,
} from "@/domain/errors"
import { SubOneCentSatAmountForUsdSelfSendError } from "@/domain/payments"
import {
  AmountCalculator,
  InvalidBtcPaymentAmountError,
  WalletCurrency,
} from "@/domain/shared"
import * as DisplayAmountsConverterImpl from "@/domain/fiat"

import { PayoutSpeed } from "@/domain/bitcoin/onchain"
import { PaymentSendStatus } from "@/domain/bitcoin/lightning"

import { DealerPriceService } from "@/services/dealer-price"
import { AccountsRepository } from "@/services/mongoose"
import { Transaction, TransactionMetadata } from "@/services/ledger/schema"
import * as PushNotificationsServiceImpl from "@/services/notifications/push-notifications"
import * as LedgerFacadeImpl from "@/services/ledger/facade"

import { timestampDaysAgo } from "@/utils"

import {
  createMandatoryUsers,
  createRandomUserAndBtcWallet,
  createRandomUserAndWallets,
  recordReceiveLnPayment,
} from "test/helpers"
import { getBalanceHelper } from "test/helpers/wallet"
import { LedgerTransactionType } from "@/domain/ledger"

let outsideAddress: OnChainAddress
let memo: string

const dealerFns = DealerPriceService()

const calc = AmountCalculator()

beforeAll(async () => {
  await createMandatoryUsers()

  outsideAddress = "bcrt1qs758ursh4q9z627kt3pp5yysm78ddny6txaqgw" as OnChainAddress
})

beforeEach(async () => {
  memo = randomOnChainMemo()
})

afterEach(async () => {
  await Transaction.deleteMany()
  await TransactionMetadata.deleteMany()

  jest.restoreAllMocks()
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

const receiveAmounts = { btc: calc.mul(btcPaymentAmount, 3n), usd: usdPaymentAmount }

const receiveBankFee = {
  btc: { amount: 100n, currency: WalletCurrency.Btc },
  usd: { amount: 1n, currency: WalletCurrency.Usd },
}

const receiveDisplayAmounts = {
  amountDisplayCurrency: Number(receiveAmounts.usd.amount) as DisplayCurrencyBaseAmount,
  feeDisplayCurrency: Number(receiveBankFee.usd.amount) as DisplayCurrencyBaseAmount,
  displayCurrency: UsdDisplayCurrency,
}

const amountBelowDustThreshold = getOnChainWalletConfig().dustThreshold - 1

const updatedByPrivilegedClientId = randomUUID() as PrivilegedClientId

const randomOnChainMemo = () =>
  "this is my onchain memo #" + (Math.random() * 1_000_000).toFixed()

describe("onChainPay", () => {
  describe("common", () => {
    it("fails to send all from empty wallet", async () => {
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Execute use-case
      const res = await Payments.payAllOnChainByWalletId({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: outsideAddress,
        speed: PayoutSpeed.Fast,
        memo,
      })
      expect(res).toBeInstanceOf(InsufficientBalanceError)
      expect(res instanceof Error && res.message).toEqual(`No balance left to send.`)
    })

    it("fails if 'validatePaymentInput' fails", async () => {
      const amount = -1000

      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const result = await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: outsideAddress,
        amount,

        speed: PayoutSpeed.Fast,
        memo,
      })
      expect(result).toBeInstanceOf(InvalidBtcPaymentAmountError)
    })
  })

  describe("settles onchain", () => {
    it("fails if builder 'withConversion' step fails", async () => {
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const result = await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: outsideAddress,
        amount: amountBelowDustThreshold,

        speed: PayoutSpeed.Fast,
        memo,
      })
      expect(result).toBeInstanceOf(LessThanDustThresholdError)
    })

    it("fails if withdrawal limit hit", async () => {
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Get remaining limit
      const timestamp1DayAgo = timestampDaysAgo(ONE_DAY)
      if (timestamp1DayAgo instanceof Error) throw timestamp1DayAgo

      const withdrawalLimit = getAccountLimits({
        level: newAccount.level,
      }).withdrawalLimit
      const withdrawalLimitUsdAmount = {
        amount: BigInt(withdrawalLimit),
        currency: WalletCurrency.Usd,
      }
      const walletPriceRatio = await Prices.getCurrentPriceAsWalletPriceRatio({
        currency: UsdDisplayCurrency,
      })
      if (walletPriceRatio instanceof Error) throw walletPriceRatio
      const withdrawalLimitBtcAmount = walletPriceRatio.convertFromUsd(
        withdrawalLimitUsdAmount,
      )

      // Fund wallet past remaining limit
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: {
          usd: calc.mul(withdrawalLimitUsdAmount, 2n),
          btc: calc.mul(withdrawalLimitBtcAmount, 2n),
        },
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const result = await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: outsideAddress,
        amount: Number(withdrawalLimitBtcAmount.amount) + 10_000,

        speed: PayoutSpeed.Fast,
        memo,
      })

      expect(result).toBeInstanceOf(WithdrawalLimitsExceededError)
    })

    it("fails if has insufficient balance for fee", async () => {
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const balance = await getBalanceHelper(newWalletDescriptor.id)

      const result = await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: outsideAddress,
        amount: balance,

        speed: PayoutSpeed.Fast,
        memo,
      })

      //should fail because user does not have balance to pay for on-chain fee
      expect(result).toBeInstanceOf(InsufficientBalanceError)
    })

    it("fails if sender account is locked", async () => {
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      // Lock sender account
      const updatedAccount = await Accounts.updateAccountStatus({
        accountId: newAccount.id,
        status: AccountStatus.Locked,
        updatedByPrivilegedClientId,
      })
      if (updatedAccount instanceof Error) throw updatedAccount
      expect(updatedAccount.status).toEqual(AccountStatus.Locked)

      // Attempt send payment
      const res = await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        amount,
        address: outsideAddress,

        speed: PayoutSpeed.Fast,
        memo,
      })
      expect(res).toBeInstanceOf(InactiveAccountError)
    })

    it("records transaction with send-onchain metadata on send", async () => {
      // Setup mocks
      const displayAmountsConverterSpy = jest.spyOn(
        DisplayAmountsConverterImpl,
        "DisplayAmountsConverter",
      )

      const onChainSendLedgerMetadataSpy = jest.spyOn(
        LedgerFacadeImpl,
        "OnChainSendLedgerMetadata",
      )
      const recordOnChainSendSpy = jest.spyOn(LedgerFacadeImpl, "recordSendOnChain")

      // Create users
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      // Send payment
      await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        amount,
        address: outsideAddress,

        speed: PayoutSpeed.Fast,
        memo,
      })

      // Check record function was called with right metadata
      expect(displayAmountsConverterSpy).toHaveBeenCalledTimes(1)
      expect(onChainSendLedgerMetadataSpy).toHaveBeenCalledTimes(1)
      const args = recordOnChainSendSpy.mock.calls[0][0]
      expect(args.metadata.type).toBe(LedgerTransactionType.OnchainPayment)
    })
  })

  describe("settles intraledger", () => {
    it("fails if builder 'withRecipient' step fails", async () => {
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const newWalletIdAddress = await Wallets.createOnChainAddress({
        walletId: newWalletDescriptor.id,
      })
      if (newWalletIdAddress instanceof Error) throw newWalletIdAddress

      const res = await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        amount,
        address: newWalletIdAddress,

        speed: PayoutSpeed.Fast,
        memo,
      })
      expect(res).toBeInstanceOf(SelfPaymentError)
    })

    it("fails if builder 'withConversion' step fails", async () => {
      const {
        btcWalletDescriptor: newWalletDescriptor,
        usdWalletDescriptor: recipientUsdWalletDescriptor,
      } = await createRandomUserAndWallets()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      // Execute
      const btcSendAmount = toSats(10)

      const recipientUsdWalletIdAddress = await Wallets.createOnChainAddress({
        walletId: recipientUsdWalletDescriptor.id,
      })
      if (recipientUsdWalletIdAddress instanceof Error) throw recipientUsdWalletIdAddress

      const usdAmount = await dealerFns.getCentsFromSatsForImmediateBuy({
        amount: BigInt(btcSendAmount),
        currency: WalletCurrency.Btc,
      })
      if (usdAmount instanceof Error) return usdAmount
      const btcSendAmountInUsd = Number(usdAmount.amount)
      expect(btcSendAmountInUsd).toBe(0)

      const res = await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: recipientUsdWalletIdAddress,
        amount: btcSendAmount,

        speed: PayoutSpeed.Fast,
        memo,
      })
      expect(res).toBeInstanceOf(SubOneCentSatAmountForUsdSelfSendError)
    })

    it("fails if intraledger limit hit", async () => {
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Create recipient address
      const recipientWalletDescriptor = await createRandomUserAndBtcWallet()
      const address = await Wallets.createOnChainAddress({
        walletId: recipientWalletDescriptor.id,
      })
      if (address instanceof Error) throw address

      // Get remaining limit
      const timestamp1DayAgo = timestampDaysAgo(ONE_DAY)
      if (timestamp1DayAgo instanceof Error) throw timestamp1DayAgo

      const intraLedgerLimit = getAccountLimits({
        level: newAccount.level,
      }).intraLedgerLimit
      const intraLedgerLimitUsdAmount = {
        amount: BigInt(intraLedgerLimit),
        currency: WalletCurrency.Usd,
      }
      const walletPriceRatio = await Prices.getCurrentPriceAsWalletPriceRatio({
        currency: UsdDisplayCurrency,
      })
      if (walletPriceRatio instanceof Error) throw walletPriceRatio
      const intraLedgerLimitBtcAmount = walletPriceRatio.convertFromUsd(
        intraLedgerLimitUsdAmount,
      )

      // Fund wallet past remaining limit
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: {
          usd: calc.mul(intraLedgerLimitUsdAmount, 2n),
          btc: calc.mul(intraLedgerLimitBtcAmount, 2n),
        },
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const result = await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address,
        amount: Number(intraLedgerLimitBtcAmount.amount) + 10_000,

        speed: PayoutSpeed.Fast,
        memo,
      })

      expect(result).toBeInstanceOf(IntraledgerLimitsExceededError)
    })

    it("fails if trade-intra-account limit hit", async () => {
      const {
        btcWalletDescriptor: newWalletDescriptor,
        usdWalletDescriptor: recipientWalletDescriptor,
      } = await createRandomUserAndWallets()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Create recipient address
      const address = await Wallets.createOnChainAddress({
        walletId: recipientWalletDescriptor.id,
      })
      if (address instanceof Error) throw address

      // Get remaining limit
      const timestamp1DayAgo = timestampDaysAgo(ONE_DAY)
      if (timestamp1DayAgo instanceof Error) throw timestamp1DayAgo

      const tradeIntraAccountLimit = getAccountLimits({
        level: newAccount.level,
      }).tradeIntraAccountLimit
      const tradeIntraAccountLimitUsdAmount = {
        amount: BigInt(tradeIntraAccountLimit),
        currency: WalletCurrency.Usd,
      }

      const hedgeBuyUsdBtcFromUsd = DealerPriceService().getSatsFromCentsForImmediateBuy
      const tradeIntraAccountLimitBtcAmount = await hedgeBuyUsdBtcFromUsd(
        tradeIntraAccountLimitUsdAmount,
      )
      if (tradeIntraAccountLimitBtcAmount instanceof Error) {
        throw tradeIntraAccountLimitBtcAmount
      }

      // Fund wallet past remaining limit
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: {
          usd: calc.mul(tradeIntraAccountLimitUsdAmount, 2n),
          btc: calc.mul(tradeIntraAccountLimitBtcAmount, 2n),
        },
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const result = await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address,
        amount: Number(tradeIntraAccountLimitBtcAmount.amount) + 10_000,

        speed: PayoutSpeed.Fast,
        memo,
      })

      expect(result).toBeInstanceOf(TradeIntraAccountLimitsExceededError)
    })

    it("fails if recipient account is locked", async () => {
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      const recipientWalletDescriptor = await createRandomUserAndBtcWallet()
      const recipientAccount = await AccountsRepository().findById(
        recipientWalletDescriptor.accountId,
      )
      if (recipientAccount instanceof Error) throw recipientAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const recipientWalletIdAddress = await Wallets.createOnChainAddress({
        walletId: recipientWalletDescriptor.id,
      })
      if (recipientWalletIdAddress instanceof Error) throw recipientWalletIdAddress

      // Lock recipient account
      const updatedAccount = await Accounts.updateAccountStatus({
        accountId: recipientAccount.id,
        status: AccountStatus.Locked,
        updatedByPrivilegedClientId,
      })
      if (updatedAccount instanceof Error) throw updatedAccount
      expect(updatedAccount.status).toEqual(AccountStatus.Locked)

      // Attempt payment
      const res = await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        amount,
        address: recipientWalletIdAddress,

        speed: PayoutSpeed.Fast,
        memo,
      })
      expect(res).toBeInstanceOf(InactiveAccountError)
    })

    it("calls sendFilteredNotification on successful intraledger receive", async () => {
      // Setup mocks
      const sendFilteredNotification = jest.fn()
      const pushNotificationsServiceSpy = jest
        .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
        .mockImplementationOnce(() => ({
          sendFilteredNotification,
          sendNotification: jest.fn(),
        }))

      // Create users
      const { btcWalletDescriptor: newWalletDescriptor, usdWalletDescriptor } =
        await createRandomUserAndWallets()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const recipientWalletIdAddress = await Wallets.createOnChainAddress({
        walletId: usdWalletDescriptor.id,
      })
      if (recipientWalletIdAddress instanceof Error) throw recipientWalletIdAddress

      // Execute payment
      const paymentResult = await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        amount,
        address: recipientWalletIdAddress,
        speed: PayoutSpeed.Fast,
        memo,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toEqual({
        status: PaymentSendStatus.Success,
        transaction: expect.objectContaining({
          walletId: newWalletDescriptor.id,
          status: "success",
          settlementAmount: amount * -1,
          settlementCurrency: "BTC",
          initiationVia: expect.objectContaining({
            type: "onchain",
            address: recipientWalletIdAddress,
          }),
          settlementVia: expect.objectContaining({
            type: "intraledger",
          }),
        }),
      })

      // Expect sent notification
      expect(sendFilteredNotification.mock.calls.length).toBe(1)
      expect(sendFilteredNotification.mock.calls[0][0].title).toBeTruthy()

      // Restore system state
      pushNotificationsServiceSpy.mockRestore()
    })

    it("records transaction with onchain-trade-intra-account metadata on intraledger send", async () => {
      // Setup mocks
      const displayAmountsConverterSpy = jest.spyOn(
        DisplayAmountsConverterImpl,
        "DisplayAmountsConverter",
      )

      const onChainTradeIntraAccountLedgerMetadataSpy = jest.spyOn(
        LedgerFacadeImpl,
        "OnChainTradeIntraAccountLedgerMetadata",
      )
      const recordIntraledgerSpy = jest.spyOn(LedgerFacadeImpl, "recordIntraledger")

      // Create users
      const { btcWalletDescriptor: newWalletDescriptor, usdWalletDescriptor } =
        await createRandomUserAndWallets()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const recipientWalletIdAddress = await Wallets.createOnChainAddress({
        walletId: usdWalletDescriptor.id,
      })
      if (recipientWalletIdAddress instanceof Error) throw recipientWalletIdAddress

      // Execute payment
      const paymentResult = await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        amount,
        address: recipientWalletIdAddress,
        speed: PayoutSpeed.Fast,
        memo,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toEqual({
        status: PaymentSendStatus.Success,
        transaction: expect.objectContaining({
          walletId: newWalletDescriptor.id,
          status: "success",
          settlementAmount: amount * -1,
          settlementCurrency: "BTC",
          initiationVia: expect.objectContaining({
            type: "onchain",
            address: recipientWalletIdAddress,
          }),
          settlementVia: expect.objectContaining({
            type: "intraledger",
          }),
        }),
      })

      // Check record function was called with right metadata
      expect(displayAmountsConverterSpy).toHaveBeenCalledTimes(2)
      expect(onChainTradeIntraAccountLedgerMetadataSpy).toHaveBeenCalledTimes(1)
      const args = recordIntraledgerSpy.mock.calls[0][0]
      expect(args.metadata.type).toBe(LedgerTransactionType.OnChainTradeIntraAccount)
    })

    it("records transaction with onchain-intraledger metadata on intraledger send", async () => {
      // Setup mocks
      const displayAmountsConverterSpy = jest.spyOn(
        DisplayAmountsConverterImpl,
        "DisplayAmountsConverter",
      )

      const onChainIntraledgerLedgerMetadataSpy = jest.spyOn(
        LedgerFacadeImpl,
        "OnChainIntraledgerLedgerMetadata",
      )
      const recordIntraledgerSpy = jest.spyOn(LedgerFacadeImpl, "recordIntraledger")

      // Setup users and wallets
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      const recipientWalletDescriptor = await createRandomUserAndBtcWallet()

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const recipientWalletIdAddress = await Wallets.createOnChainAddress({
        walletId: recipientWalletDescriptor.id,
      })
      if (recipientWalletIdAddress instanceof Error) throw recipientWalletIdAddress

      // Execute payment
      const paymentResult = await Payments.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        amount,
        address: recipientWalletIdAddress,
        speed: PayoutSpeed.Fast,
        memo,
      })
      if (paymentResult instanceof Error) throw paymentResult
      expect(paymentResult).toEqual({
        status: PaymentSendStatus.Success,
        transaction: expect.objectContaining({
          walletId: newWalletDescriptor.id,
          status: "success",
          settlementAmount: amount * -1,
          settlementCurrency: "BTC",
          initiationVia: expect.objectContaining({
            type: "onchain",
            address: recipientWalletIdAddress,
          }),
          settlementVia: expect.objectContaining({
            type: "intraledger",
          }),
        }),
      })

      // Check record function was called with right metadata
      expect(displayAmountsConverterSpy).toHaveBeenCalledTimes(2)
      expect(onChainIntraledgerLedgerMetadataSpy).toHaveBeenCalledTimes(1)
      const args = recordIntraledgerSpy.mock.calls[0][0]
      expect(args.metadata.type).toBe(LedgerTransactionType.OnchainIntraLedger)
    })
  })
})
