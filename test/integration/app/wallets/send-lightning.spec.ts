import { Accounts, Payments } from "@app"

import { AccountStatus } from "@domain/accounts"
import { toSats } from "@domain/bitcoin"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import { DisplayCurrency, toCents } from "@domain/fiat"
import { InactiveAccountError } from "@domain/errors"
import { AmountCalculator, WalletCurrency } from "@domain/shared"

import { AccountsRepository, WalletInvoicesRepository } from "@services/mongoose"
import { Transaction } from "@services/ledger/schema"
import * as LndImpl from "@services/lnd"

import {
  createMandatoryUsers,
  createRandomUserAndWallet,
  recordReceiveLnPayment,
} from "test/helpers"

let lnInvoice: LnInvoice

const calc = AmountCalculator()

beforeAll(async () => {
  await createMandatoryUsers()

  const randomRequest =
    "lnbcrt10n1p39jatkpp5djwv295kunhe5e0e4whj3dcjzwy7cmcxk8cl2a4dquyrp3dqydesdqqcqzpuxqr23ssp56u5m680x7resnvcelmsngc64ljm7g5q9r26zw0qyq5fenuqlcfzq9qyyssqxv4kvltas2qshhmqnjctnqkjpdfzu89e428ga6yk9jsp8rf382f3t03ex4e6x3a4sxkl7ruj6lsfpkuu9u9ee5kgr5zdyj7x2nwdljgq74025p"
  const invoice = decodeInvoice(randomRequest)
  if (invoice instanceof Error) throw invoice
  lnInvoice = invoice
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

const randomLightningMemo = () =>
  "this is my lightning memo #" + (Math.random() * 1_000_000).toFixed()

describe("lightningPay", () => {
  describe("settles via lightning", () => {
    it("fails if sender account is locked", async () => {
      const memo = randomLightningMemo()

      // Setup mocks
      const { LndService: LnServiceOrig } = jest.requireActual("@services/lnd")
      const lndServiceSpy = jest.spyOn(LndImpl, "LndService").mockReturnValue({
        ...LnServiceOrig(),
        listAllPubkeys: () => [],
      })

      // Create users
      const newWalletDescriptor = await createRandomUserAndWallet()
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
        id: newAccount.id,
        status: AccountStatus.Locked,
        updatedByUserId: newAccount.kratosUserId,
      })
      if (updatedAccount instanceof Error) throw updatedAccount
      expect(updatedAccount.status).toEqual(AccountStatus.Locked)

      // Attempt send payment
      const res = await Payments.payInvoiceByWalletId({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        uncheckedPaymentRequest: lnInvoice.paymentRequest,

        memo,
      })
      expect(res).toBeInstanceOf(InactiveAccountError)

      // Restore system state
      await Transaction.deleteMany({ memo })
      lndServiceSpy.mockReset()
    })
  })

  describe("settles intraledger", () => {
    it("fails if recipient account is locked", async () => {
      const memo = randomLightningMemo()
      const { paymentHash, destination } = lnInvoice

      // Setup mocks
      const { LndService: LnServiceOrig } = jest.requireActual("@services/lnd")
      const lndServiceSpy = jest.spyOn(LndImpl, "LndService").mockReturnValue({
        ...LnServiceOrig(),
        listAllPubkeys: () => [destination],
      })

      // Setup users and wallets
      const newWalletDescriptor = await createRandomUserAndWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      const recipientWalletDescriptor = await createRandomUserAndWallet()
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

      // Add recipient invoice
      const persisted = await WalletInvoicesRepository().persistNew({
        paymentHash,
        secret: "secret" as SecretPreImage,
        selfGenerated: true,
        pubkey: destination,
        recipientWalletDescriptor,
        paid: false,
      })
      if (persisted instanceof Error) throw persisted

      // Lock recipient account
      const updatedAccount = await Accounts.updateAccountStatus({
        id: recipientAccount.id,
        status: AccountStatus.Locked,
        updatedByUserId: recipientAccount.kratosUserId,
      })
      if (updatedAccount instanceof Error) throw updatedAccount
      expect(updatedAccount.status).toEqual(AccountStatus.Locked)

      // Attempt send payment
      const res = await Payments.payInvoiceByWalletId({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        uncheckedPaymentRequest: lnInvoice.paymentRequest,

        memo,
      })
      expect(res).toBeInstanceOf(InactiveAccountError)

      // Restore system state
      await WalletInvoicesRepository().deleteByPaymentHash(paymentHash)
      await Transaction.deleteMany({ memo })
      lndServiceSpy.mockReset()
    })
  })
})
