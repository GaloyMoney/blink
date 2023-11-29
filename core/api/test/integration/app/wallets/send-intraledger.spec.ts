import { randomUUID } from "crypto"

import { Accounts, Payments } from "@/app"

import { AccountStatus } from "@/domain/accounts"
import { toSats } from "@/domain/bitcoin"
import { PaymentSendStatus } from "@/domain/bitcoin/lightning"
import { UsdDisplayCurrency, toCents } from "@/domain/fiat"
import {
  InactiveAccountError,
  IntraledgerLimitsExceededError,
  SelfPaymentError,
  TradeIntraAccountLimitsExceededError,
} from "@/domain/errors"

import { AccountsRepository } from "@/services/mongoose"
import { Transaction } from "@/services/ledger/schema"
import * as PushNotificationsServiceImpl from "@/services/notifications/push-notifications"

import { AmountCalculator, WalletCurrency } from "@/domain/shared"

import {
  createMandatoryUsers,
  createRandomUserAndBtcWallet,
  createRandomUserAndWallets,
  recordReceiveLnPayment,
} from "test/helpers"

let memo: string

const calc = AmountCalculator()

beforeAll(async () => {
  await createMandatoryUsers()
})

beforeEach(() => {
  memo = randomIntraLedgerMemo()
})

afterEach(async () => {
  await Transaction.deleteMany({ memo })
  await Transaction.deleteMany({ memoPayer: memo })
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

const receiveAboveLimitAmounts = {
  btc: { amount: 300_000_000n, currency: WalletCurrency.Btc },
  usd: { amount: 6_000_000n, currency: WalletCurrency.Usd },
}
const receiveAboveLimitDisplayAmounts = {
  amountDisplayCurrency: Number(
    receiveAboveLimitAmounts.usd.amount,
  ) as DisplayCurrencyBaseAmount,
  feeDisplayCurrency: Number(receiveBankFee.usd.amount) as DisplayCurrencyBaseAmount,
  displayCurrency: UsdDisplayCurrency,
}

const randomIntraLedgerMemo = () =>
  "this is my intraledger memo #" + (Math.random() * 1_000_000).toFixed()

const updatedByPrivilegedClientId = randomUUID() as PrivilegedClientId

describe("intraLedgerPay", () => {
  it("fails if sender account is locked", async () => {
    const senderWalletDescriptor = await createRandomUserAndBtcWallet()
    const senderAccount = await AccountsRepository().findById(
      senderWalletDescriptor.accountId,
    )
    if (senderAccount instanceof Error) throw senderAccount

    const recipientWalletDescriptor = await createRandomUserAndBtcWallet()
    const recipientAccount = await AccountsRepository().findById(
      recipientWalletDescriptor.accountId,
    )
    if (recipientAccount instanceof Error) throw recipientAccount

    // Fund balance for send
    const receive = await recordReceiveLnPayment({
      walletDescriptor: senderWalletDescriptor,
      paymentAmount: receiveAmounts,
      bankFee: receiveBankFee,
      displayAmounts: receiveDisplayAmounts,
      memo,
    })
    if (receive instanceof Error) throw receive

    // Lock sender account
    const updatedAccount = await Accounts.updateAccountStatus({
      accountId: senderAccount.id,
      status: AccountStatus.Locked,
      updatedByPrivilegedClientId,
    })
    if (updatedAccount instanceof Error) throw updatedAccount
    expect(updatedAccount.status).toEqual(AccountStatus.Locked)

    // Initiate intraledger send
    const res = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      senderWalletId: senderWalletDescriptor.id,
      senderAccount: senderAccount,
      recipientWalletId: recipientWalletDescriptor.id,
      amount,

      memo,
    })
    expect(res).toBeInstanceOf(InactiveAccountError)
  })

  it("fails if recipient account is locked", async () => {
    const senderWalletDescriptor = await createRandomUserAndBtcWallet()
    const senderAccount = await AccountsRepository().findById(
      senderWalletDescriptor.accountId,
    )
    if (senderAccount instanceof Error) throw senderAccount

    const recipientWalletDescriptor = await createRandomUserAndBtcWallet()
    const recipientAccount = await AccountsRepository().findById(
      recipientWalletDescriptor.accountId,
    )
    if (recipientAccount instanceof Error) throw recipientAccount

    // Lock recipient account
    const updatedAccount = await Accounts.updateAccountStatus({
      accountId: recipientAccount.id,
      status: AccountStatus.Locked,
      updatedByPrivilegedClientId,
    })
    if (updatedAccount instanceof Error) throw updatedAccount
    expect(updatedAccount.status).toEqual(AccountStatus.Locked)

    // Fund balance for send
    const receive = await recordReceiveLnPayment({
      walletDescriptor: senderWalletDescriptor,
      paymentAmount: receiveAmounts,
      bankFee: receiveBankFee,
      displayAmounts: receiveDisplayAmounts,
      memo,
    })
    if (receive instanceof Error) throw receive

    const res = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      senderWalletId: senderWalletDescriptor.id,
      senderAccount: senderAccount,
      recipientWalletId: recipientWalletDescriptor.id,
      amount,

      memo,
    })
    expect(res).toBeInstanceOf(InactiveAccountError)
  })

  it("fails if sends to self", async () => {
    // Create users
    const newWalletDescriptor = await createRandomUserAndBtcWallet()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
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

    // Pay intraledger
    const paymentResult = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      recipientWalletId: newWalletDescriptor.id,
      memo,
      amount,
      senderWalletId: newWalletDescriptor.id,
      senderAccount: newAccount,
    })
    expect(paymentResult).toBeInstanceOf(SelfPaymentError)
  })

  it("fails if amount greater than trade-intra-account limit", async () => {
    // Create users
    const { btcWalletDescriptor: newWalletDescriptor, usdWalletDescriptor } =
      await createRandomUserAndWallets()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    // Fund balance for send
    for (let i = 0; i < 2; i++) {
      const receive = await recordReceiveLnPayment({
        walletDescriptor: usdWalletDescriptor,
        paymentAmount: receiveAboveLimitAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveAboveLimitDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive
    }

    // Pay intraledger
    const paymentResult = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      recipientWalletId: usdWalletDescriptor.id,
      memo,
      amount: toSats(receiveAboveLimitAmounts.btc.amount),
      senderWalletId: newWalletDescriptor.id,
      senderAccount: newAccount,
    })
    expect(paymentResult).toBeInstanceOf(TradeIntraAccountLimitsExceededError)
  })

  it("fails if amount greater than intraledger limit", async () => {
    // Create users
    const newWalletDescriptor = await createRandomUserAndBtcWallet()
    const recipientWalletDescriptor = await createRandomUserAndBtcWallet()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    // Fund balance for send
    for (let i = 0; i < 2; i++) {
      const receive = await recordReceiveLnPayment({
        walletDescriptor: recipientWalletDescriptor,
        paymentAmount: receiveAboveLimitAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveAboveLimitDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive
    }

    // Pay intraledger
    const paymentResult = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      recipientWalletId: recipientWalletDescriptor.id,
      memo,
      amount: toSats(receiveAboveLimitAmounts.btc.amount),
      senderWalletId: newWalletDescriptor.id,
      senderAccount: newAccount,
    })
    expect(paymentResult).toBeInstanceOf(IntraledgerLimitsExceededError)
  })

  it("calls sendFilteredNotification on successful intraledger send", async () => {
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
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
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

    // Pay intraledger
    const paymentResult = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      recipientWalletId: usdWalletDescriptor.id,
      memo,
      amount,
      senderWalletId: newWalletDescriptor.id,
      senderAccount: newAccount,
    })
    expect(paymentResult).toEqual({
      status: PaymentSendStatus.Success,
      transaction: expect.objectContaining({
        walletId: newWalletDescriptor.id,
        status: "success",
        settlementAmount: amount * -1,
        settlementCurrency: "BTC",
        initiationVia: expect.objectContaining({
          type: "intraledger",
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
    pushNotificationsServiceSpy.mockReset()
  })
})
