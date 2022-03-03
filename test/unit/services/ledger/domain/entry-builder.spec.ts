import { EntryBuilder, lndLedgerAccountId } from "@services/ledger/domain"
import { WalletCurrency, AmountCalculator } from "@domain/shared"

class TestMediciEntry {
  credit(accountPath, amount, metadata = null) {
    this.credit = this.credit || {}
    this.credit[accountPath] = { amount, metadata }
    return this
  }

  debit(accountPath, amount, metadata = null) {
    this.debit = this.debit || {}
    this.debit[accountPath] = { amount, metadata }
    return this
  }

  commit() {
    return this
  }
}

describe("EntryBuilder", () => {
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
          .withoutFee()
          .debitAccount({
            accountId: debitorAccountId,
            amount: btcAmount,
          })
          .creditLnd()

        expectEntryToEqual(result.credit[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.debit[debitorAccountId], btcAmount)
        expect(result.debit[staticAccountIds.bankOwnerAccountId]).toEqual(undefined)
      })

      it("with fee", () => {
        const entry = new TestMediciEntry()
        const builder = EntryBuilder({
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

        expectEntryToEqual(result.credit[staticAccountIds.bankOwnerAccountId], btcFee)
        expectEntryToEqual(result.credit[lndLedgerAccountId], calc.sub(btcAmount, btcFee))
        expectEntryToEqual(result.debit[debitorAccountId], btcAmount)
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
          .withoutFee()
          .debitLnd(btcAmount)
          .creditAccount({ accountId: creditorAccountId })

        expectEntryToEqual(result.debit[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.credit[creditorAccountId], btcAmount)
      })

      it("with fee", () => {
        const entry = new TestMediciEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder.withFee(btcFee).debitLnd(btcAmount).creditAccount({
          accountId: creditorAccountId,
        })

        expect(result.credit[staticAccountIds.bankOwnerAccountId].amount).toEqual(
          Number(btcFee.amount),
        )
        expectEntryToEqual(result.debit[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.credit[creditorAccountId], calc.sub(btcAmount, btcFee))
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
          .withoutFee()
          .debitAccount({
            accountId: debitorAccountId,
            amount: usdAmount,
          })
          .creditLnd(btcAmount)

        expectEntryToEqual(result.credit[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.debit[debitorAccountId], usdAmount)
        expectEntryToEqual(result.debit[staticAccountIds.dealerBtcAccountId], btcAmount)
        expectEntryToEqual(result.credit[staticAccountIds.dealerUsdAccountId], usdAmount)
      })

      it("with fee", () => {
        const entry = new TestMediciEntry()
        const builder = EntryBuilder({
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

        expectEntryToEqual(result.credit[lndLedgerAccountId], calc.sub(btcAmount, btcFee))
        expectEntryToEqual(result.credit[staticAccountIds.bankOwnerAccountId], btcFee)
        expectEntryToEqual(result.debit[debitorAccountId], usdAmount)
        expectEntryToEqual(result.debit[staticAccountIds.dealerBtcAccountId], btcAmount)
        expectEntryToEqual(result.credit[staticAccountIds.dealerUsdAccountId], usdAmount)
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
        const result = builder.withoutFee().debitLnd(btcAmount).creditAccount({
          accountId: creditorAccountId,
          amount: usdAmount,
        })
        expectEntryToEqual(result.debit[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.credit[creditorAccountId], usdAmount)
        expectEntryToEqual(result.credit[staticAccountIds.dealerBtcAccountId], btcAmount)
        expectEntryToEqual(result.debit[staticAccountIds.dealerUsdAccountId], usdAmount)
      })

      it("with fee", () => {
        const entry = new TestMediciEntry()
        const builder = EntryBuilder({
          staticAccountIds,
          entry,
          metadata,
        })
        const result = builder.withoutFee().debitLnd(btcAmount).creditAccount({
          accountId: creditorAccountId,
          amount: usdAmount,
        })
        expectEntryToEqual(result.debit[lndLedgerAccountId], btcAmount)
        expectEntryToEqual(result.credit[creditorAccountId], usdAmount)
        expectEntryToEqual(result.credit[staticAccountIds.dealerBtcAccountId], btcAmount)
        expectEntryToEqual(result.debit[staticAccountIds.dealerUsdAccountId], usdAmount)
      })
    })
  })
})
