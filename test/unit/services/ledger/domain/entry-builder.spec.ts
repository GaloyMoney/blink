import { EntryBuilder, lndLedgerAccountId } from "@services/ledger/domain"
import { WalletCurrency } from "@domain/shared"

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

  it("Can credit lnd", () => {
    const entry = new TestMediciEntry()
    const builder = EntryBuilder({
      staticAccountIds,
      entry,
      metadata: {},
    })
    const result = builder
      .withoutFee()
      .debitAccount({
        accountId: debitorAccountId,
        amount: btcAmount,
      })
      .creditLnd()

    expect(result.credit[lndLedgerAccountId].amount).toEqual(Number(btcAmount.amount))
    expect(result.debit[debitorAccountId].amount).toEqual(Number(btcAmount.amount))
    expect(result.debit[staticAccountIds.bankOwnerAccountId]).toEqual(undefined)
  })

  it("Can debit lnd", () => {
    const entry = new TestMediciEntry()
    const builder = EntryBuilder({
      staticAccountIds,
      entry,
      metadata: {},
    })
    const result = builder
      .withoutFee()
      .debitLnd(btcAmount)
      .creditAccount({ accountId: creditorAccountId })

    expect(result.debit[lndLedgerAccountId].amount).toEqual(Number(btcAmount.amount))
    expect(result.credit[creditorAccountId].amount).toEqual(Number(btcAmount.amount))
  })

  it("Can apply a fee on send", () => {
    const btcFee = {
      currency: WalletCurrency.Btc,
      amount: 111n,
    }
    const entry = new TestMediciEntry()
    const builder = EntryBuilder({
      staticAccountIds,
      entry,
      metadata: {},
    })
    const result = builder
      .withFee(btcFee)
      .debitAccount({
        accountId: debitorAccountId,
        amount: btcAmount,
      })
      .creditLnd()

    expect(result.credit[staticAccountIds.bankOwnerAccountId].amount).toEqual(
      Number(btcFee.amount),
    )
    expect(result.credit[lndLedgerAccountId].amount).toEqual(
      Number(btcAmount.amount - btcFee.amount),
    )
    expect(result.debit[debitorAccountId].amount).toEqual(Number(btcAmount.amount))
  })

  it("Can apply a fee on receive", () => {
    const btcFee = {
      currency: WalletCurrency.Btc,
      amount: 111n,
    }
    const entry = new TestMediciEntry()
    const builder = EntryBuilder({
      staticAccountIds,
      entry,
      metadata: {},
    })
    const result = builder.withFee(btcFee).debitLnd(btcAmount).creditAccount({
      accountId: creditorAccountId,
    })

    expect(result.credit[staticAccountIds.bankOwnerAccountId].amount).toEqual(
      Number(btcFee.amount),
    )
    expect(result.debit[lndLedgerAccountId].amount).toEqual(Number(btcAmount.amount))
    expect(result.credit[creditorAccountId].amount).toEqual(
      Number(btcAmount.amount - btcFee.amount),
    )
  })

  it("can debit a USD account", () => {
    const entry = new TestMediciEntry()
    const builder = EntryBuilder({
      staticAccountIds,
      entry,
      metadata: {},
    })
    const result = builder
      .withoutFee()
      .debitAccount({
        accountId: debitorAccountId,
        amount: usdAmount,
      })
      .creditLnd(btcAmount)

    expect(result.credit[lndLedgerAccountId].amount).toEqual(Number(btcAmount.amount))
    expect(result.credit[lndLedgerAccountId].metadata.currency).toEqual(
      WalletCurrency.Btc,
    )
    expect(result.debit[debitorAccountId].amount).toEqual(Number(usdAmount.amount))
    expect(result.debit[debitorAccountId].metadata.currency).toEqual(WalletCurrency.Usd)
    expect(result.debit[staticAccountIds.dealerBtcAccountId].amount).toEqual(
      Number(btcAmount.amount),
    )
    expect(result.debit[staticAccountIds.dealerBtcAccountId].metadata.currency).toEqual(
      WalletCurrency.Btc,
    )
    expect(result.credit[staticAccountIds.dealerUsdAccountId].amount).toEqual(
      Number(usdAmount.amount),
    )
    expect(result.credit[staticAccountIds.dealerUsdAccountId].metadata.currency).toEqual(
      WalletCurrency.Usd,
    )
  })

  it("can credit a USD account", () => {
    const entry = new TestMediciEntry()
    const builder = EntryBuilder({
      staticAccountIds,
      entry,
      metadata: {},
    })
    const result = builder.withoutFee().debitLndWithUsd(btcAmount).creditAccount({
      accountId: creditorAccountId,
      amount: usdAmount,
    })
    expect(result.debit[lndLedgerAccountId].amount).toEqual(Number(btcAmount.amount))
    expect(result.debit[lndLedgerAccountId].metadata.currency).toEqual(WalletCurrency.Btc)
    expect(result.credit[creditorAccountId].amount).toEqual(Number(usdAmount.amount))
    expect(result.credit[creditorAccountId].metadata.currency).toEqual(WalletCurrency.Usd)
    expect(result.credit[staticAccountIds.dealerBtcAccountId].amount).toEqual(
      Number(btcAmount.amount),
    )
    expect(result.credit[staticAccountIds.dealerBtcAccountId].metadata.currency).toEqual(
      WalletCurrency.Btc,
    )
    expect(result.debit[staticAccountIds.dealerUsdAccountId].amount).toEqual(
      Number(usdAmount.amount),
    )
    expect(result.debit[staticAccountIds.dealerUsdAccountId].metadata.currency).toEqual(
      WalletCurrency.Usd,
    )
  })
})
