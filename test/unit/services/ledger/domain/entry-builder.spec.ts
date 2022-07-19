import { WalletCurrency, AmountCalculator, ZERO_BANK_FEE } from "@domain/shared"

import { lndLedgerAccountId, EntryBuilder } from "@services/ledger/domain"
import { MainBook } from "@services/ledger/books"

const createEntry = () => MainBook.entry("")

describe("EntryBuilder", () => {
  const findEntry = (txs: ILedgerTransaction[], account: string): ILedgerTransaction => {
    const entry = txs.find((tx) => tx.accounts === account)
    if (!entry) throw new Error("Invalid entry")
    return entry
  }

  const expectEntryToEqual = (entry: ILedgerTransaction, amount) => {
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

  const calc = AmountCalculator()
  const staticAccountIds = {
    bankOwnerAccountId: "bankOwnerAccountId" as LedgerAccountId,
    dealerBtcAccountId: "dealerBtcAccountId" as LedgerAccountId,
    dealerUsdAccountId: "dealerUsdAccountId" as LedgerAccountId,
  }
  const debitorAccountId = "debitorAccountId" as LedgerAccountId
  const btcDebitorAccountDescriptor = {
    id: debitorAccountId,
    currency: WalletCurrency.Btc,
  } as LedgerAccountDescriptor<"BTC">

  const usdDebitorAccountDescriptor = {
    id: debitorAccountId,
    currency: WalletCurrency.Usd,
  } as LedgerAccountDescriptor<"USD">

  const creditorAccountId = "creditorAccountId" as LedgerAccountId

  const btcCreditorAccountDescriptor = {
    id: creditorAccountId,
    currency: WalletCurrency.Btc,
  } as LedgerAccountDescriptor<"BTC">

  const usdCreditorAccountDescriptor = {
    id: creditorAccountId,
    currency: WalletCurrency.Usd,
  } as LedgerAccountDescriptor<"USD">

  const btcAmount = {
    currency: WalletCurrency.Btc,
    amount: 2000n,
  }
  const usdAmount = {
    currency: WalletCurrency.Usd,
    amount: 20n,
  }

  const amount = {
    btcWithFees: btcAmount,
    usdWithFees: usdAmount,
  }
  const btcFee = {
    currency: WalletCurrency.Btc,
    amount: 110n,
  }
  const usdFee = {
    currency: WalletCurrency.Usd,
    amount: 1n,
  }

  const bankFee = {
    usdBankFee: usdFee,
    btcBankFee: btcFee,
  }

  const metadata = {
    currency: "BAD CURRENCY",
    some: "some",
    more: "more",
  }

  describe("Btc account", () => {
    describe("send", () => {
      it("without fee", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(ZERO_BANK_FEE)
          .debitAccount({ accountDescriptor: btcDebitorAccountDescriptor })
          .creditLnd()

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        expectEntryToEqual(findEntry(credits, lndLedgerAccountId), btcAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountId), btcAmount)
        expect(
          debits.find((tx) => tx.accounts === staticAccountIds.bankOwnerAccountId),
        ).toBeUndefined()
      })

      it("with fee", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(bankFee)
          .debitAccount({ accountDescriptor: btcDebitorAccountDescriptor })
          .creditLnd()

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        expectEntryToEqual(
          findEntry(credits, staticAccountIds.bankOwnerAccountId),
          btcFee,
        )
        expectEntryToEqual(
          findEntry(credits, lndLedgerAccountId),
          calc.sub(btcAmount, btcFee),
        )
        expectEntryToEqual(findEntry(debits, debitorAccountId), btcAmount)
      })
    })

    describe("receive", () => {
      it("without fee", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(ZERO_BANK_FEE)
          .debitLnd()
          .creditAccount(btcCreditorAccountDescriptor)

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        expectEntryToEqual(findEntry(debits, lndLedgerAccountId), btcAmount)
        expectEntryToEqual(findEntry(credits, creditorAccountId), btcAmount)
      })

      it("with fee", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(bankFee)
          .debitLnd()
          .creditAccount(btcCreditorAccountDescriptor)

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
        expectJournalToBeBalanced(result)
        expect(findEntry(credits, staticAccountIds.bankOwnerAccountId).credit).toEqual(
          Number(btcFee.amount),
        )
        expectEntryToEqual(findEntry(debits, lndLedgerAccountId), btcAmount)
        expectEntryToEqual(
          findEntry(credits, creditorAccountId),
          calc.sub(btcAmount, btcFee),
        )
      })
    })
  })

  describe("Usd account", () => {
    describe("send", () => {
      it("without fee", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(ZERO_BANK_FEE)
          .debitAccount({
            accountDescriptor: usdDebitorAccountDescriptor,
          })
          .creditLnd()

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        expectEntryToEqual(findEntry(credits, lndLedgerAccountId), btcAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountId), usdAmount)
        expectEntryToEqual(
          findEntry(debits, staticAccountIds.dealerBtcAccountId),
          btcAmount,
        )
        expect(
          credits.find((tx) => tx.accounts === staticAccountIds.dealerBtcAccountId),
        ).toBeUndefined()
        expectEntryToEqual(
          findEntry(credits, staticAccountIds.dealerUsdAccountId),
          usdAmount,
        )
        expect(
          debits.find((tx) => tx.accounts === staticAccountIds.dealerUsdAccountId),
        ).toBeUndefined()
      })

      it("with fee", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(bankFee)
          .debitAccount({
            accountDescriptor: usdDebitorAccountDescriptor,
          })
          .creditLnd()

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        expectEntryToEqual(
          findEntry(credits, lndLedgerAccountId),
          calc.sub(btcAmount, btcFee),
        )
        expectEntryToEqual(
          findEntry(credits, staticAccountIds.bankOwnerAccountId),
          btcFee,
        )
        expectEntryToEqual(findEntry(debits, debitorAccountId), usdAmount)
        expectEntryToEqual(
          findEntry(debits, staticAccountIds.dealerBtcAccountId),
          btcAmount,
        )
        expect(
          credits.find((tx) => tx.accounts === staticAccountIds.dealerBtcAccountId),
        ).toBeUndefined()
        expectEntryToEqual(
          findEntry(credits, staticAccountIds.dealerUsdAccountId),
          usdAmount,
        )
        expect(
          debits.find((tx) => tx.accounts === staticAccountIds.dealerUsdAccountId),
        ).toBeUndefined()
      })
    })

    describe("receive", () => {
      describe("without fee", () => {
        it("handles txn with btc amount & usd amount", () => {
          const entry = createEntry()
          const builder = EntryBuilder({
            staticAccountIds,
            entry,
            metadata,
          })

          const result = builder
            .withTotalAmount(amount)
            .withBankFee(ZERO_BANK_FEE)
            .debitLnd()
            .creditAccount(usdCreditorAccountDescriptor)

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)

          expectJournalToBeBalanced(result)
          expectEntryToEqual(findEntry(debits, lndLedgerAccountId), btcAmount)
          expectEntryToEqual(findEntry(credits, creditorAccountId), usdAmount)
          expectEntryToEqual(
            findEntry(credits, staticAccountIds.dealerBtcAccountId),
            btcAmount,
          )
          expect(
            debits.find((tx) => tx.accounts === staticAccountIds.dealerBtcAccountId),
          ).toBeUndefined()
          expectEntryToEqual(
            findEntry(debits, staticAccountIds.dealerUsdAccountId),
            usdAmount,
          )
          expect(
            credits.find((tx) => tx.accounts === staticAccountIds.dealerUsdAccountId),
          ).toBeUndefined()
        })

        // e.g. a `recordReceive' fee-reimbursement with low sats amount
        it("handles txn with btc amount & zero usd amount", () => {
          const btcAmount = {
            currency: WalletCurrency.Btc,
            amount: 18n,
          }
          const usdAmount = {
            currency: WalletCurrency.Usd,
            amount: 0n,
          }

          const amount = {
            btcWithFees: btcAmount,
            usdWithFees: usdAmount,
          }

          const entry = createEntry()
          const builder = EntryBuilder({
            staticAccountIds,
            entry,
            metadata,
          })

          const result = builder
            .withTotalAmount(amount)
            .withBankFee(ZERO_BANK_FEE)
            .debitLnd()
            .creditAccount(usdCreditorAccountDescriptor)

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)
          expectJournalToBeBalanced(result)
          expectEntryToEqual(findEntry(debits, lndLedgerAccountId), btcAmount)
          expect(credits.find((tx) => tx.accounts === creditorAccountId)).toBeUndefined()
          expectEntryToEqual(
            findEntry(credits, staticAccountIds.dealerBtcAccountId),
            btcAmount,
          )
          expect(
            debits.find((tx) => tx.accounts === staticAccountIds.dealerBtcAccountId),
          ).toBeUndefined()
          expect(
            debits.find((tx) => tx.accounts === staticAccountIds.dealerUsdAccountId),
          ).toBeUndefined()
          expect(
            credits.find((tx) => tx.accounts === staticAccountIds.dealerUsdAccountId),
          ).toBeUndefined()
        })
      })

      it("with fee", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(bankFee)
          .debitLnd()
          .creditAccount(usdCreditorAccountDescriptor)

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        expectEntryToEqual(findEntry(debits, lndLedgerAccountId), btcAmount)
        expectEntryToEqual(
          findEntry(credits, creditorAccountId),
          calc.sub(usdAmount, usdFee),
        )
        expectEntryToEqual(
          findEntry(credits, staticAccountIds.dealerBtcAccountId),
          calc.sub(btcAmount, btcFee),
        )
        expect(
          debits.find((tx) => tx.accounts === staticAccountIds.dealerBtcAccountId),
        ).toBeUndefined()
        expectEntryToEqual(
          findEntry(debits, staticAccountIds.dealerUsdAccountId),
          calc.sub(usdAmount, usdFee),
        )
        expect(
          credits.find((tx) => tx.accounts === staticAccountIds.dealerUsdAccountId),
        ).toBeUndefined()
      })
    })
  })

  describe("intra ledger", () => {
    describe("from btc", () => {
      it("to btc", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(ZERO_BANK_FEE)
          .debitAccount({
            accountDescriptor: btcDebitorAccountDescriptor,
          })
          .creditAccount(btcCreditorAccountDescriptor)

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
        expectEntryToEqual(findEntry(credits, creditorAccountId), btcAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountId), btcAmount)
      })

      it("to usd", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(ZERO_BANK_FEE)
          .debitAccount({
            accountDescriptor: btcDebitorAccountDescriptor,
          })
          .creditAccount(usdCreditorAccountDescriptor)

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        expectEntryToEqual(findEntry(credits, creditorAccountId), usdAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountId), btcAmount)
        expectEntryToEqual(
          findEntry(credits, staticAccountIds.dealerBtcAccountId),
          btcAmount,
        )
        expect(
          debits.find((tx) => tx.accounts === staticAccountIds.dealerBtcAccountId),
        ).toBeUndefined()
        expectEntryToEqual(
          findEntry(debits, staticAccountIds.dealerUsdAccountId),
          usdAmount,
        )
        expect(
          credits.find((tx) => tx.accounts === staticAccountIds.dealerUsdAccountId),
        ).toBeUndefined()
      })
    })
    describe("from usd", () => {
      it("to btc", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(ZERO_BANK_FEE)
          .debitAccount({
            accountDescriptor: usdDebitorAccountDescriptor,
          })
          .creditAccount(btcCreditorAccountDescriptor)

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        expectEntryToEqual(findEntry(credits, creditorAccountId), btcAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountId), usdAmount)
        expectEntryToEqual(
          findEntry(debits, staticAccountIds.dealerBtcAccountId),
          btcAmount,
        )
        expect(
          credits.find((tx) => tx.accounts === staticAccountIds.dealerBtcAccountId),
        ).toBeUndefined()
        expectEntryToEqual(
          findEntry(credits, staticAccountIds.dealerUsdAccountId),
          usdAmount,
        )
        expect(
          debits.find((tx) => tx.accounts === staticAccountIds.dealerUsdAccountId),
        ).toBeUndefined()
      })

      it("to usd", () => {
        const entry = createEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withBankFee(ZERO_BANK_FEE)
          .debitAccount({
            accountDescriptor: usdDebitorAccountDescriptor,
          })
          .creditAccount(usdCreditorAccountDescriptor)

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)

        expectJournalToBeBalanced(result)
        expectEntryToEqual(findEntry(credits, creditorAccountId), usdAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountId), usdAmount)
      })
    })
  })

  describe("metadata", () => {
    it("debitor can take additional metadata", () => {
      const entry = createEntry()
      const builder = EntryBuilder({
        staticAccountIds,
        entry,
        metadata,
      })
      const result = builder
        .withTotalAmount(amount)
        .withBankFee(ZERO_BANK_FEE)
        .debitAccount({
          accountDescriptor: btcDebitorAccountDescriptor,
          additionalMetadata: {
            more: "yes",
            muchMore: "muchMore",
          },
        })
        .creditLnd()

      const debits = result.transactions.filter((t) => t.debit > 0)
      expectJournalToBeBalanced(result)

      const resultEntry = findEntry(debits, debitorAccountId)
      expect(resultEntry.currency).toEqual(WalletCurrency.Btc)
      expect(resultEntry.meta).toEqual(
        expect.objectContaining({
          some: "some",
          more: "yes",
          muchMore: "muchMore",
        }),
      )
    })
  })
})
