import { Accounts } from "@/app"

import { toSats } from "@/domain/bitcoin"
import { UsdDisplayCurrency, toCents } from "@/domain/fiat"
import { InvalidWalletId } from "@/domain/errors"

import { AccountsRepository } from "@/services/mongoose"
import { Transaction } from "@/services/ledger/schema"

import { AmountCalculator, WalletCurrency } from "@/domain/shared"

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
  displayCurrency: UsdDisplayCurrency,
}

const randomMemo = () => "this is my memo #" + (Math.random() * 1_000_000).toFixed()

describe("getTransactionsForAccountByWalletIds", () => {
  it("returns an error if non-owned walletId is included", async () => {
    const memo = randomMemo()

    const senderWalletDescriptor = await createRandomUserAndBtcWallet()
    const senderAccount = await AccountsRepository().findById(
      senderWalletDescriptor.accountId,
    )
    if (senderAccount instanceof Error) throw senderAccount

    // Create transaction
    const receive = await recordReceiveLnPayment({
      walletDescriptor: senderWalletDescriptor,
      paymentAmount: receiveAmounts,
      bankFee: receiveBankFee,
      displayAmounts: receiveDisplayAmounts,
      memo,
    })
    expect(receive).not.toBeInstanceOf(Error)

    // Attempt transactions call
    const otherWalletDescriptor = await createRandomUserAndBtcWallet()

    const txns = await Accounts.getTransactionsForAccountByWalletIds({
      account: senderAccount,
      walletIds: [otherWalletDescriptor.id],
      rawPaginationArgs: {},
    })

    expect(txns).toBeInstanceOf(InvalidWalletId)

    // Restore system state
    await Transaction.deleteMany({ memo })
  })
})
