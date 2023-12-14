import { UnknownLedgerError } from "@/domain/ledger"
import { checkedToPaginatedQueryCursor } from "@/domain/primitives"
import { BtcWalletDescriptor, UsdWalletDescriptor, WalletCurrency } from "@/domain/shared"
import { LedgerService } from "@/services/ledger"

import { createMandatoryUsers, recordWalletIdIntraLedgerPayment } from "test/helpers"

let walletDescriptorA: WalletDescriptor<"BTC">
let walletDescriptorB: WalletDescriptor<"USD">

beforeAll(async () => {
  await createMandatoryUsers()

  walletDescriptorA = BtcWalletDescriptor(crypto.randomUUID() as WalletId)
  walletDescriptorB = UsdWalletDescriptor(crypto.randomUUID() as WalletId)

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

  for (let i = 0; i < 3; i++) {
    await recordWalletIdIntraLedgerPayment({
      senderWalletDescriptor: walletDescriptorA,
      recipientWalletDescriptor: walletDescriptorB,
      paymentAmount,
      senderDisplayAmounts,
      recipientDisplayAmounts,
    })
    await recordWalletIdIntraLedgerPayment({
      senderWalletDescriptor: walletDescriptorB,
      recipientWalletDescriptor: walletDescriptorA,
      paymentAmount,
      senderDisplayAmounts,
      recipientDisplayAmounts,
    })
  }
})

describe("LedgerService", () => {
  describe("getTransactionsByWalletIds", () => {
    const ledger = LedgerService()

    it("returns valid data for multiple walletIds passed", async () => {
      const paginatedResult = await ledger.getTransactionsByWalletIds({
        walletIds: [walletDescriptorA.id, walletDescriptorB.id],
        paginationArgs: { first: 20 },
      })
      if (paginatedResult instanceof Error) throw paginatedResult

      const txs = paginatedResult.edges.map((edge) => edge.node)

      expect(txs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            walletId: walletDescriptorA.id,
          }),
          expect.objectContaining({
            walletId: walletDescriptorB.id,
          }),
        ]),
      )

      expect(paginatedResult.pageInfo.hasNextPage).toEqual(false)
    })

    it("correctly paginates forward", async () => {
      const allTxns = await ledger.getTransactionsByWalletIds({
        walletIds: [walletDescriptorA.id, walletDescriptorB.id],
        paginationArgs: { first: 10 },
      })
      if (allTxns instanceof Error) throw allTxns
      const firstTxnId = allTxns.edges[0].node.id
      const secondTxnId = allTxns.edges[1].node.id

      const txns = await ledger.getTransactionsByWalletIds({
        walletIds: [walletDescriptorA.id, walletDescriptorB.id],
        paginationArgs: { first: 3, after: checkedToPaginatedQueryCursor(firstTxnId) },
      })
      if (txns instanceof Error) throw txns

      expect(txns.edges[0].node.id).toEqual(secondTxnId)
      expect(txns.pageInfo.hasNextPage).toEqual(true)
    })

    it("correctly paginates backward", async () => {
      const allTxns = await ledger.getTransactionsByWalletIds({
        walletIds: [walletDescriptorA.id, walletDescriptorB.id],
        paginationArgs: { first: 6 },
      })
      if (allTxns instanceof Error) throw allTxns
      const lastTxnId = allTxns.edges[allTxns.edges.length - 1].node.id
      const secondToLastTxnId = allTxns.edges[allTxns.edges.length - 2].node.id

      const txns = await ledger.getTransactionsByWalletIds({
        walletIds: [walletDescriptorA.id, walletDescriptorB.id],
        paginationArgs: { last: 3, before: checkedToPaginatedQueryCursor(lastTxnId) },
      })
      if (txns instanceof Error) throw txns

      expect(txns.edges[txns.edges.length - 1].node.id).toEqual(secondToLastTxnId)
      expect(txns.pageInfo.hasPreviousPage).toEqual(true)
    })

    it("returns valid data for a single walletId passed", async () => {
      const paginatedResult = await ledger.getTransactionsByWalletIds({
        walletIds: [walletDescriptorA.id],
        paginationArgs: { first: 10 },
      })
      if (paginatedResult instanceof Error) throw paginatedResult

      const txs = paginatedResult.edges.map((edge) => edge.node)

      const walletIds = txs.map((tx) => tx.walletId)
      const uniqueWalletIds = [...new Set(walletIds)]

      expect(uniqueWalletIds.length).toEqual(1)
    })

    it("returns error for invalid after cursor", async () => {
      const txns = await ledger.getTransactionsByWalletIds({
        walletIds: [walletDescriptorA.id, walletDescriptorB.id],
        paginationArgs: {
          first: 100,
          after: checkedToPaginatedQueryCursor("invalid-cursor"),
        },
      })
      expect(txns).toBeInstanceOf(UnknownLedgerError)
    })
  })
})
