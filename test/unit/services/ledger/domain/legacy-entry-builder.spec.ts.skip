import { LegacyEntryBuilder, lndLedgerAccountId } from "@services/ledger/domain"
import { WalletCurrency, AmountCalculator } from "@domain/shared"

class TestMediciEntry {
  credits: any // eslint-disable-line
  debits: any // eslint-disable-line
  transactions: any // eslint-disable-line

  credit(accountPath, amount, metadata = null) {
    this.credits = this.credits || {}
    this.transactions = this.transactions || []
    this.credits[accountPath] = { amount, metadata }

    const metadataObj = metadata === null ? {} : metadata
    this.transactions.push({
      debit: 0,
      credit: amount,
      accounts: accountPath,
      ...metadataObj,
    })
    return this
  }

  debit(accountPath, amount, metadata = null) {
    this.debits = this.debits || {}
    this.transactions = this.transactions || []
    this.debits[accountPath] = { amount, metadata }

    const metadataObj = metadata === null ? {} : metadata
    this.transactions.push({
      debit: amount,
      credit: 0,
      accounts: accountPath,
      ...metadataObj,
    })
    return this
  }
}

const reconstructEntryFromTransactions = (entry: TestMediciEntry): TestMediciEntry => {
  const result = new TestMediciEntry()

  for (const txn of entry.transactions) {
    let accountPath, amount, metadata, credit, debit
    if (txn.debit > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ;({ debit: amount, credit, accounts: accountPath, ...metadata } = txn)
      result.debit(accountPath, amount, metadata)
    }

    if (txn.credit > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ;({ credit: amount, debit, accounts: accountPath, ...metadata } = txn)
      result.credit(accountPath, amount, metadata)
    }
  }

  return result
}

describe("LegacyEntryBuilder", () => {
  const expectEntryToEqual = (entry, amount) => {
    expect(entry.amount).toEqual(Number(amount.amount))
    expect(entry.metadata.currency).toEqual(amount.currency)
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
        const entry = new TestMediciEntry()
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

        expectEntryToEqual(result.credits[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.debits[debitorAccountId], btcAmount)
        expect(result.debits[staticAccountIds.bankOwnerAccountId]).toBeUndefined()
      })

      it("with fee", () => {
        const entry = new TestMediciEntry()
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

        expectEntryToEqual(result.credits[staticAccountIds.bankOwnerAccountId], btcFee)
        expectEntryToEqual(
          result.credits[lndLedgerAccountId],
          calc.sub(btcAmount, btcFee),
        )
        expectEntryToEqual(result.debits[debitorAccountId], btcAmount)
      })
    })

    describe("receive", () => {
      it("without fee", () => {
        const entry = new TestMediciEntry()
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withoutFee()
          .debitLnd(btcAmount)
          .creditAccount({ accountId: creditorAccountId })

        expectEntryToEqual(result.debits[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.credits[creditorAccountId], btcAmount)
      })

      it("with fee", () => {
        const entry = new TestMediciEntry()
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder.withFee(btcFee).debitLnd(btcAmount).creditAccount({
          accountId: creditorAccountId,
        })

        expect(result.credits[staticAccountIds.bankOwnerAccountId].amount).toEqual(
          Number(btcFee.amount),
        )
        expectEntryToEqual(result.debits[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.credits[creditorAccountId], calc.sub(btcAmount, btcFee))
      })
    })
  })

  describe("Usd account", () => {
    describe("send", () => {
      it("without fee", () => {
        const entry = new TestMediciEntry()
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

        expectEntryToEqual(result.credits[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.debits[debitorAccountId], usdAmount)
        expectEntryToEqual(result.debits[staticAccountIds.dealerBtcAccountId], btcAmount)
        expect(result.credits[staticAccountIds.dealerBtcAccountId]).toBeUndefined()
        expectEntryToEqual(result.credits[staticAccountIds.dealerUsdAccountId], usdAmount)
        expect(result.debits[staticAccountIds.dealerUsdAccountId]).toBeUndefined()
      })

      it("with fee", () => {
        const entry = new TestMediciEntry()
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

        expectEntryToEqual(
          result.credits[lndLedgerAccountId],
          calc.sub(btcAmount, btcFee),
        )
        expectEntryToEqual(result.credits[staticAccountIds.bankOwnerAccountId], btcFee)
        expectEntryToEqual(result.debits[debitorAccountId], usdAmount)
        expectEntryToEqual(result.debits[staticAccountIds.dealerBtcAccountId], btcAmount)
        expect(result.credits[staticAccountIds.dealerBtcAccountId]).toBeUndefined()
        expectEntryToEqual(result.credits[staticAccountIds.dealerUsdAccountId], usdAmount)
        expect(result.debits[staticAccountIds.dealerUsdAccountId]).toBeUndefined()
      })
    })

    describe("receive", () => {
      describe("without fee", () => {
        it("handles txn with btc amount & usd amount", () => {
          const entry = new TestMediciEntry()
          const builder = LegacyEntryBuilder({
            staticAccountIds,
            entry,
            metadata,
          })
          const result = builder.withoutFee().debitLnd(btcAmount).creditAccount({
            accountId: creditorAccountId,
            amount: usdAmount,
          })
          expectEntryToEqual(result.debits[lndLedgerAccountId], btcAmount)
          expectEntryToEqual(result.credits[creditorAccountId], usdAmount)
          expectEntryToEqual(
            result.credits[staticAccountIds.dealerBtcAccountId],
            btcAmount,
          )
          expect(result.debits[staticAccountIds.dealerBtcAccountId]).toBeUndefined()
          expectEntryToEqual(
            result.debits[staticAccountIds.dealerUsdAccountId],
            usdAmount,
          )
          expect(result.credits[staticAccountIds.dealerUsdAccountId]).toBeUndefined()
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

          const entry = new TestMediciEntry()
          const builder = LegacyEntryBuilder({
            staticAccountIds,
            entry,
            metadata,
          })
          const initialResult = builder.withoutFee().debitLnd(btcAmount).creditAccount({
            accountId: creditorAccountId,
            amount: usdAmount,
          })
          const result = reconstructEntryFromTransactions(initialResult)

          expectEntryToEqual(result.debits[lndLedgerAccountId], btcAmount)
          expect(result.credits[creditorAccountId]).toBeUndefined()
          expectEntryToEqual(
            result.credits[staticAccountIds.dealerBtcAccountId],
            btcAmount,
          )
          expect(result.debits[staticAccountIds.dealerBtcAccountId]).toBeUndefined()
          expect(result.debits[staticAccountIds.dealerUsdAccountId]).toBeUndefined()
          expect(result.credits[staticAccountIds.dealerUsdAccountId]).toBeUndefined()
        })
      })

      it("with fee", () => {
        const entry = new TestMediciEntry()
        const builder = LegacyEntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder.withoutFee().debitLnd(btcAmount).creditAccount({
          accountId: creditorAccountId,
          amount: usdAmount,
        })
        expectEntryToEqual(result.debits[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.credits[creditorAccountId], usdAmount)
        expectEntryToEqual(result.credits[staticAccountIds.dealerBtcAccountId], btcAmount)
        expect(result.debits[staticAccountIds.dealerBtcAccountId]).toBeUndefined()
        expectEntryToEqual(result.debits[staticAccountIds.dealerUsdAccountId], usdAmount)
        expect(result.credits[staticAccountIds.dealerUsdAccountId]).toBeUndefined()
      })
    })
  })

  describe("intra ledger", () => {
    describe("from btc", () => {
      it("to btc", () => {
        const entry = new TestMediciEntry()
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

        expectEntryToEqual(result.credits[creditorAccountId], btcAmount)
        expectEntryToEqual(result.debits[debitorAccountId], btcAmount)
      })

      it("to usd", () => {
        const entry = new TestMediciEntry()
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

        expectEntryToEqual(result.credits[creditorAccountId], usdAmount)
        expectEntryToEqual(result.debits[debitorAccountId], btcAmount)
        expectEntryToEqual(result.credits[staticAccountIds.dealerBtcAccountId], btcAmount)
        expect(result.debits[staticAccountIds.dealerBtcAccountId]).toBeUndefined()
        expectEntryToEqual(result.debits[staticAccountIds.dealerUsdAccountId], usdAmount)
        expect(result.credits[staticAccountIds.dealerUsdAccountId]).toBeUndefined()
      })
    })
    describe("from usd", () => {
      it("to btc", () => {
        const entry = new TestMediciEntry()
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

        expectEntryToEqual(result.credits[creditorAccountId], btcAmount)
        expectEntryToEqual(result.debits[debitorAccountId], usdAmount)
        expectEntryToEqual(result.debits[staticAccountIds.dealerBtcAccountId], btcAmount)
        expect(result.credits[staticAccountIds.dealerBtcAccountId]).toBeUndefined()
        expectEntryToEqual(result.credits[staticAccountIds.dealerUsdAccountId], usdAmount)
        expect(result.debits[staticAccountIds.dealerUsdAccountId]).toBeUndefined()
      })

      it("to usd", () => {
        const entry = new TestMediciEntry()
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

        expectEntryToEqual(result.credits[creditorAccountId], usdAmount)
        expectEntryToEqual(result.debits[debitorAccountId], usdAmount)
      })
    })
  })

  describe("metadata", () => {
    it("debitor can take additional metadata", () => {
      const entry = new TestMediciEntry()
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

      expect(result.debits[debitorAccountId].metadata).toEqual(
        expect.objectContaining({
          some: "some",
          more: "yes",
          muchMore: "muchMore",
          currency: WalletCurrency.Btc,
        }),
      )
    })
  })
})
