import { EntryBuilder, lndLedgerAccountId } from "@services/ledger/domain"

class TestMediciEntry {
  credit(accountPath, amount, extra = null) {
    this.credit = this.credit || {}
    this.credit[accountPath] = { amount, extra }
    return this
  }

  debit(accountPath, amount, extra = null) {
    this.debit = this.debit || {}
    this.debit[accountPath] = { amount, extra }
    return this
  }
}

describe("EntryBuilder", () => {
  const bankOwnerAccountId = "bankOwnerAccountId" as LedgerAccountId
  const debitorAccountId = "debitorAccountId" as LedgerAccountId
  const debitAmmount = 2000n

  it("Can credit lnd", () => {
    const entry = new TestMediciEntry()
    const builder = EntryBuilder({
      bankOwnerAccountId,
      entry,
      metadata: {},
    })
    const result = builder
      .withoutFee()
      .debitAccount({
        accountId: debitorAccountId,
        amount: {
          currency: "BTC",
          amount: debitAmmount,
        },
      })
      .creditLnd()

    expect(result.credit[lndLedgerAccountId].amount).toEqual(debitAmmount)
    expect(result.debit[debitorAccountId].amount).toEqual(debitAmmount)
  })

  it("Can apply a fee", () => {
    const feeAmount = 111n
    const entry = new TestMediciEntry()
    const builder = EntryBuilder({
      bankOwnerAccountId,
      entry,
      metadata: {},
    })
    const result = builder
      .withFee({
        btc: {
          currency: "BTC",
          amount: feeAmount,
        },
      })
      .debitAccount({
        accountId: debitorAccountId,
        amount: {
          currency: "BTC",
          amount: debitAmmount,
        },
      })
      .creditLnd()

    expect(result.credit[bankOwnerAccountId].amount).toEqual(feeAmount)
    expect(result.credit[lndLedgerAccountId].amount).toEqual(debitAmmount - feeAmount)
    expect(result.debit[debitorAccountId].amount).toEqual(debitAmmount)
  })
})
