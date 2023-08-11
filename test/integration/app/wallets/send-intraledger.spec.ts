import { Accounts, Payments } from "@app"

import { AccountStatus } from "@domain/accounts"
import { toSats } from "@domain/bitcoin"
import { DisplayCurrency, toCents } from "@domain/fiat"
import { InactiveAccountError } from "@domain/errors"

import { AccountsRepository } from "@services/mongoose"
import { Transaction } from "@services/ledger/schema"

import { AmountCalculator, WalletCurrency } from "@domain/shared"

import {
  createMandatoryUsers,
  createRandomUserAndBtcWallet,
  recordReceiveLnPayment,
} from "test/helpers"

const calc = AmountCalculator()

beforeAll(async () => {
  await createMandatoryUsers()
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
  displayCurrency: DisplayCurrency.Usd,
}

const randomOnChainMemo = () =>
  "this is my onchain memo #" + (Math.random() * 1_000_000).toFixed()

describe("intraLedgerPay", () => {
  it("fails if sender account is locked", async () => {
    const memo = randomOnChainMemo()

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
      id: senderAccount.id,
      status: AccountStatus.Locked,
      updatedByUserId: senderAccount.kratosUserId,
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

    // Restore system state
    await Transaction.deleteMany({ memo })
  })

  it("fails if recipient account is locked", async () => {
    const memo = randomOnChainMemo()

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
      id: recipientAccount.id,
      status: AccountStatus.Locked,
      updatedByUserId: recipientAccount.kratosUserId,
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

    // Restore system state
    await Transaction.deleteMany({ memo })
  })
})
