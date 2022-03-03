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
  debitLnd: (amount: BtcPaymentAmount) => EntryBuilderCreditWithBtcDebit
}

type EntryBuilderCreditWithUsdDebit = {
  creditLnd: (amount: BtcPaymentAmount) => MediciEntry
}

type EntryBuilderCreditWithBtcDebit = {
  creditLnd: () => MediciEntry
  creditAccount: ({
    accountId,
    amount,
  }: {
    accountId: LedgerAccountId
    amount?: UsdPaymentAmount
  }) => MediciEntry
}

type EntryBuilderCredit<D extends WalletCurrency> = D extends "USD"
  ? EntryBuilderCreditWithUsdDebit
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

  const debitLnd = (amount: BtcPaymentAmount): EntryBuilderCreditWithBtcDebit => {
    entry.debit(lndLedgerAccountId, Number(amount.amount), {
      ...metadata,
      currency: amount.currency,
    })
    return EntryBuilderCreditWithBtcDebit({
      entry,
      metadata,
      fee,
      debitAmount: amount as BtcPaymentAmount,
      staticAccountIds,
    }) as EntryBuilderCreditWithBtcDebit
  }

  return {
    debitAccount,
    debitLnd,
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
  staticAccountIds,
  fee,
}: EntryBuilderCreditState<"USD">): EntryBuilderCreditWithUsdDebit => {
  const creditLnd = (btcCreditAmount: BtcPaymentAmount) => {
    withdrawUsdFromDealer({
      entry,
      metadata,
      staticAccountIds,
      btcAmount: btcCreditAmount,
      usdAmount: debitAmount,
    })
    const creditAmount = calc.sub(btcCreditAmount, fee)
    entry.credit(lndLedgerAccountId, Number(creditAmount.amount), {
      ...metadata,
      currency: btcCreditAmount.currency,
    })
    return entry
  }

  return {
    creditLnd,
  }
}

const EntryBuilderCreditWithBtcDebit = ({
  entry,
  metadata,
  fee,
  debitAmount,
  staticAccountIds,
}: EntryBuilderCreditState<"BTC">): EntryBuilderCreditWithBtcDebit => {
  const creditLnd = () => {
    const creditAmount = calc.sub(debitAmount, fee)
    entry.credit(lndLedgerAccountId, Number(creditAmount.amount), {
      ...metadata,
      currency: creditAmount.currency,
    })
    return entry
  }
  const creditAccount = ({
    accountId,
    amount,
  }: {
    accountId: LedgerAccountId
    amount?: UsdPaymentAmount
  }) => {
    if (amount) {
      addUsdToDealer({
        entry,
        metadata,
        staticAccountIds,
        btcAmount: debitAmount,
        usdAmount: amount,
      })
    }
    const creditAmount = amount || calc.sub(debitAmount, fee)
    entry.credit(accountId, Number(creditAmount.amount), {
      ...metadata,
      currency: creditAmount.currency,
    })
    return entry
  }

  return {
    creditLnd,
    creditAccount,
  }
}

const addUsdToDealer = ({
  staticAccountIds: { dealerBtcAccountId, dealerUsdAccountId },
  entry,
  btcAmount,
  usdAmount,
  metadata,
}: {
  staticAccountIds: {
    dealerBtcAccountId: LedgerAccountId
    dealerUsdAccountId: LedgerAccountId
  }
  entry: MediciEntry
  btcAmount: BtcPaymentAmount
  usdAmount: UsdPaymentAmount
  metadata: TxMetadata
}) => {
  entry.credit(dealerBtcAccountId, Number(btcAmount.amount), {
    ...metadata,
    currency: btcAmount.currency,
  })
  entry.debit(dealerUsdAccountId, Number(usdAmount.amount), {
    ...metadata,
    currency: usdAmount.currency,
  })
  return entry
}

const withdrawUsdFromDealer = ({
  staticAccountIds: { dealerBtcAccountId, dealerUsdAccountId },
  entry,
  btcAmount,
  usdAmount,
  metadata,
}: {
  staticAccountIds: {
    dealerBtcAccountId: LedgerAccountId
    dealerUsdAccountId: LedgerAccountId
  }
  entry: MediciEntry
  btcAmount: BtcPaymentAmount
  usdAmount: UsdPaymentAmount
  metadata: TxMetadata
}) => {
  entry.debit(dealerBtcAccountId, Number(btcAmount.amount), {
    ...metadata,
    currency: btcAmount.currency,
  })
  entry.credit(dealerUsdAccountId, Number(usdAmount.amount), {
    ...metadata,
    currency: usdAmount.currency,
  })
  return entry
}
