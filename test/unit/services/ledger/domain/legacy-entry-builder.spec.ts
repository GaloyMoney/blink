import { LegacyEntryBuilder, lndLedgerAccountId } from "@services/ledger/domain"
import { WalletCurrency, AmountCalculator } from "@domain/shared"

class TestMediciEntry {
  credits: any // eslint-disable-line
  debits: any // eslint-disable-line

  credit(accountPath, amount, metadata = null) {
    this.credits = this.credits || {}
    this.credits[accountPath] = { amount, metadata }
    return this
  }

  debit(accountPath, amount, metadata = null) {
    this.debits = this.debits || {}
    this.debits[accountPath] = { amount, metadata }
    return this
  }
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
      it("without fee", () => {
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
