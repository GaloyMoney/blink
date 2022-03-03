import { AmountCalculator, WalletCurrency } from "@domain/shared"

import { lndLedgerAccountId } from "./accounts"

const ZERO_SATS = {
  currency: WalletCurrency.Btc,
  amount: 0n,
} as const

type EntryBuilderDebitState = {
  entry: MediciEntry
  metadata: TxMetadata
  fee: BtcPaymentAmount
  staticAccountIds: StaticAccountIds
}

type EntryBuilderDebit = {
  debitAccount: <D extends WalletCurrency>({
    accountId,
    amount,
  }: {
    accountId: LedgerAccountId
    amount: PaymentAmount<D>
  }) => EntryBuilderCredit<D>
  debitLnd: (amount: BtcPaymentAmount) => EntryBuilderCredit<"BTC">
  debitLndWithUsd: (amount: BtcPaymentAmount) => EntryBuilderCredit<"USD">
}

type EntryBuilderCreditWithUsdDebit = {
  creditLnd: (amount: BtcPaymentAmount) => MediciEntry
}

type EntryBuilderCreditWithUsdDebitLnd = {
  creditAccount: ({
    accountId,
    amount,
  }: {
    accountId: LedgerAccountId
    amount: PaymentAmount<"USD">
  }) => MediciEntry
}

type EntryBuilderCreditWithBtcDebit = {
  creditLnd: () => MediciEntry
  creditAccount: ({ accountId }: { accountId: LedgerAccountId }) => MediciEntry
}

type EntryBuilderCredit<D extends WalletCurrency> = D extends "USD"
  ? EntryBuilderCreditWithUsdDebit & EntryBuilderCreditWithUsdDebitLnd
  : EntryBuilderCreditWithBtcDebit

const calc = AmountCalculator()

export const EntryBuilder = ({
  staticAccountIds,
  entry,
  metadata,
}: EntryBuilderConfig) => {
  const withFee = (fee: BtcPaymentAmount) => {
    if (fee.amount > 0n) {
      entry.credit(staticAccountIds.bankOwnerAccountId, Number(fee.amount), {
        ...metadata,
        currency: fee.currency,
      })
    }
    return EntryBuilderDebit({ metadata, entry, fee, staticAccountIds })
  }

  const withoutFee = (): EntryBuilderDebit => {
    return withFee(ZERO_SATS)
  }

  return {
    withFee,
    withoutFee,
  }
}

const EntryBuilderDebit = ({
  entry,
  metadata,
  fee,
  staticAccountIds,
}: EntryBuilderDebitState): EntryBuilderDebit => {
  const debitAccount = <T extends WalletCurrency>({
    accountId,
    amount,
  }: {
    accountId: LedgerAccountId
    amount: PaymentAmount<T>
  }): EntryBuilderCredit<T> => {
    entry.debit(accountId, Number(amount.amount), {
      ...metadata,
      currency: amount.currency,
    })
    if (amount.currency === WalletCurrency.Btc) {
      return EntryBuilderCreditWithBtcDebit({
        entry,
        metadata,
        fee,
        debitAmount: amount as BtcPaymentAmount,
        staticAccountIds,
      }) as EntryBuilderCredit<T>
    }

    return EntryBuilderCreditWithUsdDebit({
      entry,
      metadata,
      fee,
      debitAmount: amount as UsdPaymentAmount,
      staticAccountIds,
    }) as EntryBuilderCredit<T>
  }

  const debitLnd = (amount: BtcPaymentAmount): EntryBuilderCredit<"BTC"> => {
    entry.debit(lndLedgerAccountId, Number(amount.amount), {
      currency: amount.currency,
      ...metadata,
    })
    return EntryBuilderCreditWithBtcDebit({
      entry,
      metadata,
      fee,
      debitAmount: amount as BtcPaymentAmount,
      staticAccountIds,
    }) as EntryBuilderCredit<"BTC">
  }

  const debitLndWithUsd = (amount: BtcPaymentAmount): EntryBuilderCredit<"USD"> => {
    entry.debit(lndLedgerAccountId, Number(amount.amount), {
      currency: amount.currency,
      ...metadata,
    })
    return EntryBuilderCreditWithUsdDebitLnd({
      entry,
      metadata,
      fee,
      debitAmount: amount as BtcPaymentAmount,
      staticAccountIds,
    }) as EntryBuilderCredit<"USD">
  }

  return {
    debitAccount,
    debitLnd,
    debitLndWithUsd,
  }
}

type EntryBuilderCreditState<D extends WalletCurrency> = {
  entry: MediciEntry
  metadata: TxMetadata
  fee: BtcPaymentAmount
  debitAmount: PaymentAmount<D>
  staticAccountIds: {
    dealerBtcAccountId: LedgerAccountId
    dealerUsdAccountId: LedgerAccountId
  }
}

const EntryBuilderCreditWithUsdDebit = ({
  entry,
  metadata,
  debitAmount,
  staticAccountIds: { dealerBtcAccountId, dealerUsdAccountId },
}: EntryBuilderCreditState<"USD">): EntryBuilderCreditWithUsdDebit => {
  const creditLnd = (btcCreditAmount: BtcPaymentAmount) => {
    entry.debit(dealerBtcAccountId, Number(btcCreditAmount.amount), {
      ...metadata,
      currency: WalletCurrency.Btc,
    })
    entry.credit(dealerUsdAccountId, Number(debitAmount.amount), {
      ...metadata,
      currency: WalletCurrency.Usd,
    })
    entry.credit(lndLedgerAccountId, Number(btcCreditAmount.amount), {
      ...metadata,
      currency: btcCreditAmount.currency,
    })
    return entry
  }

  return {
    creditLnd,
  }
}

const EntryBuilderCreditWithUsdDebitLnd = ({
  entry,
  metadata,
  debitAmount,
  staticAccountIds: { dealerBtcAccountId, dealerUsdAccountId },
}: EntryBuilderCreditState<"BTC">): EntryBuilderCreditWithUsdDebitLnd => {
  const creditAccount = ({
    accountId,
    amount,
  }: {
    accountId: LedgerAccountId
    amount: PaymentAmount<"USD">
  }) => {
    entry.credit(dealerBtcAccountId, Number(debitAmount.amount), {
      currency: WalletCurrency.Btc,
      ...metadata,
    })
    entry.debit(dealerUsdAccountId, Number(amount.amount), {
      currency: WalletCurrency.Usd,
      ...metadata,
    })
    entry.credit(accountId, Number(amount.amount), {
      currency: amount.currency,
      ...metadata,
    })
    return entry
  }

  return {
    creditAccount,
  }
}

const EntryBuilderCreditWithBtcDebit = ({
  entry,
  metadata,
  fee,
  debitAmount,
}: EntryBuilderCreditState<"BTC">) => {
  const creditLnd = () => {
    const creditAmount = calc.sub(debitAmount, fee)
    entry.credit(lndLedgerAccountId, Number(creditAmount.amount), metadata)
    return entry
  }
  const creditAccount = ({ accountId }: { accountId: LedgerAccountId }) => {
    const creditAmount = calc.sub(debitAmount, fee)
    entry.credit(accountId, Number(creditAmount.amount), metadata)
    return entry
  }

  return {
    creditLnd,
    creditAccount,
  }
}
