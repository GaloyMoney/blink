import {
  EntryBuilder,
  lndLedgerAccountId,
  ZERO_SATS,
  ZERO_CENTS,
} from "@services/ledger/domain"
import { WalletCurrency, AmountCalculator } from "@domain/shared"

class TestMediciEntry {
  credits: any
  debits: any

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

describe("EntryBuilder", () => {
  const expectEntryToEqual = (entry, amount) => {
    expect(entry.amount).toEqual(Number(amount.amount))
    expect(entry.metadata.currency).toEqual(amount.currency)
  }

  const expectJournalToBeBalanced = (journal) => {
    let usdCredits = 0
    let btcCredits = 0
    let usdDebits = 0
    let btcDebits = 0

    Object.values<any>(journal.debits).forEach((entry) =>
      entry.metadata.currency === WalletCurrency.Usd
        ? (usdDebits += entry.amount)
        : (btcDebits += entry.amount),
    )
    Object.values<any>(journal.credits).forEach((entry) =>
      entry.metadata.currency === WalletCurrency.Usd
        ? (usdCredits += entry.amount)
        : (btcCredits += entry.amount),
    )

    expect(usdCredits).toEqual(usdDebits)
    expect(btcCredits).toEqual(btcDebits)
    console.log(usdCredits)
    console.log(btcCredits)
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
    btcWithFee: btcAmount,
    usdWithFee: usdAmount,
  }
  const btcFee = {
    currency: WalletCurrency.Btc,
    amount: 110n,
  }
  const usdFee = {
    currency: WalletCurrency.Usd,
    amount: 1n,
  }

  const protocolFee = {
    usdProtocolFee: usdFee,
    btcProtocolFee: btcFee,
  }

  const ZERO_FEE = {
    usdProtocolFee: ZERO_CENTS,
    btcProtocolFee: ZERO_SATS,
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
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withFee(ZERO_FEE)
          .debitAccount({ accountDescriptor: btcDebitorAccountDescriptor })
          .creditLnd()

        expectJournalToBeBalanced(result)
        expectEntryToEqual(result.credits[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.debits[debitorAccountId], btcAmount)
        expect(result.debits[staticAccountIds.bankOwnerAccountId]).toBeUndefined()
      })

      it("with fee", () => {
        const entry = new TestMediciEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withFee(protocolFee)
          .debitAccount({ accountDescriptor: btcDebitorAccountDescriptor })
          .creditLnd()

        expectJournalToBeBalanced(result)
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
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withFee(ZERO_FEE)
          .debitLnd()
          .creditAccount(btcCreditorAccountDescriptor)

        expectJournalToBeBalanced(result)
        expectEntryToEqual(result.debits[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.credits[creditorAccountId], btcAmount)
      })

      it("with fee", () => {
        const entry = new TestMediciEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withFee(protocolFee)
          .debitLnd()
          .creditAccount(btcCreditorAccountDescriptor)

        expectJournalToBeBalanced(result)
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
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withFee(ZERO_FEE)
          .debitAccount({
            accountDescriptor: usdDebitorAccountDescriptor,
          })
          .creditLnd()

        expectJournalToBeBalanced(result)
        expectEntryToEqual(result.credits[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.debits[debitorAccountId], usdAmount)
        expectEntryToEqual(result.debits[staticAccountIds.dealerBtcAccountId], btcAmount)
        expect(result.credits[staticAccountIds.dealerBtcAccountId]).toBeUndefined()
        expectEntryToEqual(result.credits[staticAccountIds.dealerUsdAccountId], usdAmount)
        expect(result.debits[staticAccountIds.dealerUsdAccountId]).toBeUndefined()
      })

      it("with fee", () => {
        const entry = new TestMediciEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withFee(protocolFee)
          .debitAccount({
            accountDescriptor: usdDebitorAccountDescriptor,
          })
          .creditLnd()

        expectJournalToBeBalanced(result)
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
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withFee(ZERO_FEE)
          .debitLnd()
          .creditAccount(usdCreditorAccountDescriptor)

        expectJournalToBeBalanced(result)
        expectEntryToEqual(result.debits[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.credits[creditorAccountId], usdAmount)
        expectEntryToEqual(result.credits[staticAccountIds.dealerBtcAccountId], btcAmount)
        expect(result.debits[staticAccountIds.dealerBtcAccountId]).toBeUndefined()
        expectEntryToEqual(result.debits[staticAccountIds.dealerUsdAccountId], usdAmount)
        expect(result.credits[staticAccountIds.dealerUsdAccountId]).toBeUndefined()
      })

      it("with fee", () => {
        const entry = new TestMediciEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withFee(protocolFee)
          .debitLnd()
          .creditAccount(usdCreditorAccountDescriptor)

        expectJournalToBeBalanced(result)
        expectEntryToEqual(result.debits[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.credits[creditorAccountId], calc.sub(usdAmount, usdFee))
        expectEntryToEqual(
          result.credits[staticAccountIds.dealerBtcAccountId],
          calc.sub(btcAmount, btcFee),
        )
        expect(result.debits[staticAccountIds.dealerBtcAccountId]).toBeUndefined()
        expectEntryToEqual(
          result.debits[staticAccountIds.dealerUsdAccountId],
          calc.sub(usdAmount, usdFee),
        )
        expect(result.credits[staticAccountIds.dealerUsdAccountId]).toBeUndefined()
      })
    })
  })

  describe("intra ledger", () => {
    describe("from btc", () => {
      it("to btc", () => {
        const entry = new TestMediciEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withFee(ZERO_FEE)
          .debitAccount({
            accountDescriptor: btcDebitorAccountDescriptor,
          })
          .creditAccount(btcCreditorAccountDescriptor)

        expectEntryToEqual(result.credits[creditorAccountId], btcAmount)
        expectEntryToEqual(result.debits[debitorAccountId], btcAmount)
      })

      it("to usd", () => {
        const entry = new TestMediciEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withFee(ZERO_FEE)
          .debitAccount({
            accountDescriptor: btcDebitorAccountDescriptor,
          })
          .creditAccount(usdCreditorAccountDescriptor)
        console.log("Btc to usd")
        expectJournalToBeBalanced(result)
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
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withFee(ZERO_FEE)
          .debitAccount({
            accountDescriptor: usdDebitorAccountDescriptor,
          })
          .creditAccount(btcCreditorAccountDescriptor)
        expectJournalToBeBalanced(result)
        expectEntryToEqual(result.credits[creditorAccountId], btcAmount)
        expectEntryToEqual(result.debits[debitorAccountId], usdAmount)
        expectEntryToEqual(result.debits[staticAccountIds.dealerBtcAccountId], btcAmount)
        expect(result.credits[staticAccountIds.dealerBtcAccountId]).toBeUndefined()
        expectEntryToEqual(result.credits[staticAccountIds.dealerUsdAccountId], usdAmount)
        expect(result.debits[staticAccountIds.dealerUsdAccountId]).toBeUndefined()
      })

      it("to usd", () => {
        const entry = new TestMediciEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder
          .withTotalAmount(amount)
          .withFee(ZERO_FEE)
          .debitAccount({
            accountDescriptor: usdDebitorAccountDescriptor,
          })
          .creditAccount(usdCreditorAccountDescriptor)
        expectJournalToBeBalanced(result)
        expectEntryToEqual(result.credits[creditorAccountId], usdAmount)
        expectEntryToEqual(result.debits[debitorAccountId], usdAmount)
      })
    })
  })

  describe("metadata", () => {
    it("debitor can take additional metadata", () => {
      const entry = new TestMediciEntry()
      const builder = EntryBuilder({
        staticAccountIds,
        entry,
        metadata,
      })
      const result = builder
        .withTotalAmount(amount)
        .withFee(ZERO_FEE)
        .debitAccount({
          accountDescriptor: btcDebitorAccountDescriptor,
          additionalMetadata: {
            more: "yes",
            muchMore: "muchMore",
          },
        })
        .creditLnd()
      expectJournalToBeBalanced(result)
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
