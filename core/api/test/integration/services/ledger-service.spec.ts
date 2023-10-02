import { UnknownLedgerError } from "@domain/ledger"
import { BtcWalletDescriptor, UsdWalletDescriptor, WalletCurrency } from "@domain/shared"
import { LedgerService } from "@services/ledger"

import { createMandatoryUsers, recordWalletIdIntraLedgerPayment } from "test/helpers"

let walletDescriptor: WalletDescriptor<"BTC">
let walletDescriptorOther: WalletDescriptor<"USD">

beforeAll(async () => {
  await createMandatoryUsers()

  walletDescriptor = BtcWalletDescriptor(crypto.randomUUID() as WalletId)
  walletDescriptorOther = UsdWalletDescriptor(crypto.randomUUID() as WalletId)

  const paymentAmount = {
    usd: { amount: 200n, currency: WalletCurrency.Usd },
    btc: { amount: 400n, currency: WalletCurrency.Btc },
  }

  const displayAmounts = {
    amountDisplayCurrency: 240 as DisplayCurrencyBaseAmount,
    feeDisplayCurrency: 24 as DisplayCurrencyBaseAmount,
    displayCurrency: "EUR" as DisplayCurrency,
  }

  const senderDisplayAmounts = {
    senderAmountDisplayCurrency: displayAmounts.amountDisplayCurrency,
    senderFeeDisplayCurrency: displayAmounts.feeDisplayCurrency,
    senderDisplayCurrency: displayAmounts.displayCurrency,
  }

  const recipientDisplayAmounts = {
    recipientAmountDisplayCurrency: displayAmounts.amountDisplayCurrency,
    recipientFeeDisplayCurrency: displayAmounts.feeDisplayCurrency,
    recipientDisplayCurrency: displayAmounts.displayCurrency,
  }

  await recordWalletIdIntraLedgerPayment({
    senderWalletDescriptor: walletDescriptor,
    recipientWalletDescriptor: walletDescriptorOther,
    paymentAmount,
    senderDisplayAmounts,
    recipientDisplayAmounts,
  })

  await recordWalletIdIntraLedgerPayment({
    senderWalletDescriptor: walletDescriptorOther,
    recipientWalletDescriptor: walletDescriptor,
    paymentAmount,
    senderDisplayAmounts,
    recipientDisplayAmounts,
  })
})

describe("LedgerService", () => {
  describe("getTransactionsByWalletIds", () => {
    const ledger = LedgerService()

    it("returns valid data for walletIds passed", async () => {
      const txns = await ledger.getTransactionsByWalletIds({
        walletIds: [walletDescriptor.id, walletDescriptorOther.id],
      })
      if (txns instanceof Error) throw txns

      expect(txns.slice).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            walletId: walletDescriptor.id,
          }),
          expect.objectContaining({
            walletId: walletDescriptorOther.id,
          }),
        ]),
      )
    })

    it("returns valid data using after cursor", async () => {
      const allTxns = await ledger.getTransactionsByWalletIds({
        walletIds: [walletDescriptor.id, walletDescriptorOther.id],
      })
      if (allTxns instanceof Error) throw allTxns
      const firstTxnId = allTxns.slice[0].id

      const txns = await ledger.getTransactionsByWalletIds({
        walletIds: [walletDescriptor.id, walletDescriptorOther.id],
        paginationArgs: { after: firstTxnId },
      })
      if (txns instanceof Error) throw txns

      expect(txns.total).toEqual(allTxns.total - 1)
    })

    it("returns error for invalid after cursor", async () => {
      const txns = await ledger.getTransactionsByWalletIds({
        walletIds: [walletDescriptor.id, walletDescriptorOther.id],
        paginationArgs: { after: "invalid-cursor" },
      })
      expect(txns).toBeInstanceOf(UnknownLedgerError)
    })
  })
})
