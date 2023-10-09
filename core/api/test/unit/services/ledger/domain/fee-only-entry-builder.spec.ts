/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectEntryToEqual", "expectJournalToBeBalanced"] }] */

import { WalletCurrency } from "@/domain/shared"

import { onChainLedgerAccountId } from "@/services/ledger/domain"
import { MainBook } from "@/services/ledger/books"
import { FeeOnlyEntryBuilder } from "@/services/ledger/domain/fee-only-entry-builder"

const createEntry = () => MainBook.entry("")

describe("FeeOnlyEntryBuilder", () => {
  const findEntry = (txs: ILedgerTransaction[], account: string): ILedgerTransaction => {
    const entry = txs.find((tx) => tx.accounts === account)
    if (!entry) throw new Error("Invalid entry")
    return entry
  }

  const expectEntryToEqual = (
    entry: ILedgerTransaction,
    amount: Amount<WalletCurrency>,
  ) => {
    expect(entry.debit + entry.credit).toEqual(Number(amount.amount))
    expect(entry.currency).toEqual(amount.currency)
  }

  const expectJournalToBeBalanced = (journal: MediciEntry) => {
    let usdCredits = 0
    let btcCredits = 0
    let usdDebits = 0
    let btcDebits = 0

    const credits = journal.transactions.filter((t) => t.credit > 0)
    const debits = journal.transactions.filter((t) => t.debit > 0)
    const zeroAmounts = journal.transactions.filter(
      (t) => t.debit === 0 && t.credit === 0,
    )

    // eslint-disable-next-line
    Object.values<any>(debits).forEach((entry) =>
      entry.currency === WalletCurrency.Usd
        ? (usdDebits += entry.amount)
        : (btcDebits += entry.amount),
    )
    // eslint-disable-next-line
    Object.values<any>(credits).forEach((entry) =>
      entry.currency === WalletCurrency.Usd
        ? (usdCredits += entry.amount)
        : (btcCredits += entry.amount),
    )

    expect(usdCredits).toEqual(usdDebits)
    expect(btcCredits).toEqual(btcDebits)
    expect(zeroAmounts.length).toBe(0)
  }

  const staticAccountIds = {
    bankOwnerAccountId: "bankOwnerAccountId" as LedgerAccountId,
  }

  const btcFee = { amount: 1000n, currency: WalletCurrency.Btc }
  const metadata = {
    currency: "BAD CURRENCY",
    some: "some",
    more: "more",
  }

  it("overestimated fee, credit back bank owner", () => {
    const entry = createEntry()
    const builder = FeeOnlyEntryBuilder({
      staticAccountIds,
      entry,
      metadata,
      btcFee,
    })
    const result = builder.debitBankOwner().creditOnChain()

    const credits = result.transactions.filter((t) => t.credit > 0)
    const debits = result.transactions.filter((t) => t.debit > 0)

    expectJournalToBeBalanced(result)

    expectEntryToEqual(findEntry(credits, onChainLedgerAccountId), btcFee)
    expect(
      credits.find((tx) => tx.accounts === staticAccountIds.bankOwnerAccountId),
    ).toBeUndefined()

    expectEntryToEqual(findEntry(debits, staticAccountIds.bankOwnerAccountId), btcFee)
    expect(debits.find((tx) => tx.accounts === onChainLedgerAccountId)).toBeUndefined()
  })

  it("underestimated fee, debit from bank owner", () => {
    const entry = createEntry()
    const builder = FeeOnlyEntryBuilder({
      staticAccountIds,
      entry,
      metadata,
      btcFee,
    })
    const result = builder.debitOnChain().creditBankOwner()

    const credits = result.transactions.filter((t) => t.credit > 0)
    const debits = result.transactions.filter((t) => t.debit > 0)

    expectJournalToBeBalanced(result)

    expectEntryToEqual(findEntry(credits, staticAccountIds.bankOwnerAccountId), btcFee)
    expect(credits.find((tx) => tx.accounts === onChainLedgerAccountId)).toBeUndefined()

    expectEntryToEqual(findEntry(debits, onChainLedgerAccountId), btcFee)
    expect(
      debits.find((tx) => tx.accounts === staticAccountIds.bankOwnerAccountId),
    ).toBeUndefined()
  })
})
