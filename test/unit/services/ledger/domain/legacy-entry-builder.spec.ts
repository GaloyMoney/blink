import { WalletCurrency, AmountCalculator } from "@domain/shared"

import { MainBook } from "@services/ledger/books"
import { LegacyEntryBuilder, lndLedgerAccountId } from "@services/ledger/domain"

const createEntry = () => MainBook.entry("")

describe("LegacyEntryBuilder", () => {
  const findEntry = (
    txs: ILedgerTransaction[],
    account: string,
  ): ILedgerTransaction | undefined => txs.find((tx) => tx.accounts === account)
  const expectEntryToEqual = (entry: ILedgerTransaction | undefined, amount) => {
    if (!entry) throw new Error("Invalid entry")
    expect(entry.debit + entry.credit).toEqual(Number(amount.amount))
    expect(entry.currency).toEqual(amount.currency)
  }
  const calc = AmountCalculator()
  const staticAccountIds = {
    bankOwnerAccountId: "bankOwnerAccountId" as LedgerAccountId,
    dealerBtcAccountId: "dealerBtcAccountId" as LedgerAccountId,
    dealerUsdAccountId: "dealerUsdAccountId" as LedgerAccountId,
  }
  const debitorAccountId = "debitorAccountId" as LedgerAccountId
  const creditorAccountId = "creditorAccountId" as LedgerAccountId
  const btcAmount = {
    currency: WalletCurrency.Btc,
    amount: 2000n,
  }
  const usdAmount = {
    currency: WalletCurrency.Usd,
    amount: 20n,
  }
  const btcFee = {
    currency: WalletCurrency.Btc,
    amount: 111n,
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
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withoutFee()
          .debitAccount({
            accountId: debitorAccountId,
            amount: btcAmount,
          })
          .creditLnd()

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
        expectEntryToEqual(findEntry(credits, lndLedgerAccountId), btcAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountId), btcAmount)
        expect(findEntry(debits, staticAccountIds.bankOwnerAccountId)).toBeUndefined()
      })

      it("with fee", () => {
        const entry = createEntry()
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withFee(btcFee)
          .debitAccount({
            accountId: debitorAccountId,
            amount: btcAmount,
          })
          .creditLnd()

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
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
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withoutFee()
          .debitLnd(btcAmount)
          .creditAccount({ accountId: creditorAccountId })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
        expectEntryToEqual(findEntry(debits, lndLedgerAccountId), btcAmount)
        expectEntryToEqual(findEntry(credits, creditorAccountId), btcAmount)
      })

      it("with fee", () => {
        const entry = createEntry()
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder.withFee(btcFee).debitLnd(btcAmount).creditAccount({
          accountId: creditorAccountId,
        })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
        expect(findEntry(credits, staticAccountIds.bankOwnerAccountId)?.credit).toEqual(
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
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withoutFee()
          .debitAccount({
            accountId: debitorAccountId,
            amount: usdAmount,
          })
          .creditLnd(btcAmount)

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
        expectEntryToEqual(findEntry(credits, lndLedgerAccountId), btcAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountId), usdAmount)
        expectEntryToEqual(
          findEntry(debits, staticAccountIds.dealerBtcAccountId),
          btcAmount,
        )
        expect(findEntry(credits, staticAccountIds.dealerBtcAccountId)).toBeUndefined()
        expectEntryToEqual(
          findEntry(credits, staticAccountIds.dealerUsdAccountId),
          usdAmount,
        )
        expect(findEntry(debits, staticAccountIds.dealerUsdAccountId)).toBeUndefined()
      })

      it("with fee", () => {
        const entry = createEntry()
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withFee(btcFee)
          .debitAccount({
            accountId: debitorAccountId,
            amount: usdAmount,
          })
          .creditLnd(btcAmount)

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
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
        expect(findEntry(credits, staticAccountIds.dealerBtcAccountId)).toBeUndefined()
        expectEntryToEqual(
          findEntry(credits, staticAccountIds.dealerUsdAccountId),
          usdAmount,
        )
        expect(findEntry(debits, staticAccountIds.dealerUsdAccountId)).toBeUndefined()
      })
    })

    describe("receive", () => {
      describe("without fee", () => {
        it("handles txn with btc amount & usd amount", () => {
          const entry = createEntry()
          const builder = LegacyEntryBuilder({
            staticAccountIds,
            entry,
            metadata,
          })
          const result = builder.withoutFee().debitLnd(btcAmount).creditAccount({
            accountId: creditorAccountId,
            amount: usdAmount,
          })

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)
          expectEntryToEqual(findEntry(debits, lndLedgerAccountId), btcAmount)
          expectEntryToEqual(findEntry(credits, creditorAccountId), usdAmount)
          expectEntryToEqual(
            findEntry(credits, staticAccountIds.dealerBtcAccountId),
            btcAmount,
          )
          expect(findEntry(debits, staticAccountIds.dealerBtcAccountId)).toBeUndefined()
          expectEntryToEqual(
            findEntry(debits, staticAccountIds.dealerUsdAccountId),
            usdAmount,
          )
          expect(findEntry(credits, staticAccountIds.dealerUsdAccountId)).toBeUndefined()
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

          const entry = createEntry()
          const builder = LegacyEntryBuilder({
            staticAccountIds,
            entry,
            metadata,
          })
          const result = builder.withoutFee().debitLnd(btcAmount).creditAccount({
            accountId: creditorAccountId,
            amount: usdAmount,
          })

          const credits = result.transactions.filter((t) => t.credit > 0)
          const debits = result.transactions.filter((t) => t.debit > 0)
          expectEntryToEqual(findEntry(debits, lndLedgerAccountId), btcAmount)
          expect(findEntry(credits, creditorAccountId)).toBeUndefined()
          expectEntryToEqual(
            findEntry(credits, staticAccountIds.dealerBtcAccountId),
            btcAmount,
          )
          expect(findEntry(debits, staticAccountIds.dealerBtcAccountId)).toBeUndefined()
          expect(findEntry(debits, staticAccountIds.dealerUsdAccountId)).toBeUndefined()
          expect(findEntry(credits, staticAccountIds.dealerUsdAccountId)).toBeUndefined()
        })
      })

      it("with fee", () => {
        const entry = createEntry()
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder.withoutFee().debitLnd(btcAmount).creditAccount({
          accountId: creditorAccountId,
          amount: usdAmount,
        })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
        expectEntryToEqual(findEntry(debits, lndLedgerAccountId), btcAmount)
        expectEntryToEqual(findEntry(credits, creditorAccountId), usdAmount)
        expectEntryToEqual(
          findEntry(credits, staticAccountIds.dealerBtcAccountId),
          btcAmount,
        )
        expect(findEntry(debits, staticAccountIds.dealerBtcAccountId)).toBeUndefined()
        expectEntryToEqual(
          findEntry(debits, staticAccountIds.dealerUsdAccountId),
          usdAmount,
        )
        expect(findEntry(credits, staticAccountIds.dealerUsdAccountId)).toBeUndefined()
      })
    })
  })

  describe("intra ledger", () => {
    describe("from btc", () => {
      it("to btc", () => {
        const entry = createEntry()
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withoutFee()
          .debitAccount({
            accountId: debitorAccountId,
            amount: btcAmount,
          })
          .creditAccount({
            accountId: creditorAccountId,
          })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
        expectEntryToEqual(findEntry(credits, creditorAccountId), btcAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountId), btcAmount)
      })

      it("to usd", () => {
        const entry = createEntry()
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withoutFee()
          .debitAccount({
            accountId: debitorAccountId,
            amount: btcAmount,
          })
          .creditAccount({
            accountId: creditorAccountId,
            amount: usdAmount,
          })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
        expectEntryToEqual(findEntry(credits, creditorAccountId), usdAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountId), btcAmount)
        expectEntryToEqual(
          findEntry(credits, staticAccountIds.dealerBtcAccountId),
          btcAmount,
        )
        expect(findEntry(debits, staticAccountIds.dealerBtcAccountId)).toBeUndefined()
        expectEntryToEqual(
          findEntry(debits, staticAccountIds.dealerUsdAccountId),
          usdAmount,
        )
        expect(findEntry(credits, staticAccountIds.dealerUsdAccountId)).toBeUndefined()
      })
    })
    describe("from usd", () => {
      it("to btc", () => {
        const entry = createEntry()
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withoutFee()
          .debitAccount({
            accountId: debitorAccountId,
            amount: usdAmount,
          })
          .creditAccount({
            accountId: creditorAccountId,
            amount: btcAmount,
          })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
        expectEntryToEqual(findEntry(credits, creditorAccountId), btcAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountId), usdAmount)
        expectEntryToEqual(
          findEntry(debits, staticAccountIds.dealerBtcAccountId),
          btcAmount,
        )
        expect(findEntry(credits, staticAccountIds.dealerBtcAccountId)).toBeUndefined()
        expectEntryToEqual(
          findEntry(credits, staticAccountIds.dealerUsdAccountId),
          usdAmount,
        )
        expect(findEntry(debits, staticAccountIds.dealerUsdAccountId)).toBeUndefined()
      })

      it("to usd", () => {
        const entry = createEntry()
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withoutFee()
          .debitAccount({
            accountId: debitorAccountId,
            amount: usdAmount,
          })
          .creditAccount({
            accountId: creditorAccountId,
          })

        const credits = result.transactions.filter((t) => t.credit > 0)
        const debits = result.transactions.filter((t) => t.debit > 0)
        expectEntryToEqual(findEntry(credits, creditorAccountId), usdAmount)
        expectEntryToEqual(findEntry(debits, debitorAccountId), usdAmount)
      })
    })
  })

  describe("metadata", () => {
    it("debitor can take additional metadata", () => {
      const entry = createEntry()
      const builder = LegacyEntryBuilder({
        staticAccountIds,
        entry,
        metadata,
      })
      const result = builder
        .withFee(btcFee)
        .debitAccount({
          accountId: debitorAccountId,
          amount: btcAmount,
          additionalMetadata: {
            more: "yes",
            muchMore: "muchMore",
          },
        })
        .creditLnd()

      const debits = result.transactions.filter((t) => t.debit > 0)
      const resultEntry = findEntry(debits, debitorAccountId)
      expect(resultEntry).toBeDefined()
      expect(resultEntry?.currency).toEqual(WalletCurrency.Btc)
      expect(resultEntry?.meta).toEqual(
        expect.objectContaining({
          some: "some",
          more: "yes",
          muchMore: "muchMore",
        }),
      )
    })
  })
})
