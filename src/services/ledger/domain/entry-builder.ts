import { AmountCalculator, WalletCurrency } from "@domain/shared"

import { lndLedgerAccountId } from "./accounts"

const ZERO_SATS = {
  currency: WalletCurrency.Btc,
  amount: 0n,
} as const
const calc = AmountCalculator()

export const EntryBuilder = <M extends MediciEntry>({
  staticAccountIds,
  entry,
  metadata,
}: EntryBuilderConfig<M>) => {
  const withFee = (fee: BtcPaymentAmount) => {
    if (fee.amount > 0n) {
      entry.credit(staticAccountIds.bankOwnerAccountId, Number(fee.amount), {
        ...metadata,
        currency: fee.currency,
      })
    }
    return EntryBuilderDebit({ metadata, entry, fee, staticAccountIds })
  }

  const withoutFee = () => {
    return withFee(ZERO_SATS)
  }

  return {
    withFee,
    withoutFee,
  }
}

const EntryBuilderDebit = <M extends MediciEntry>({
  entry,
  metadata,
  fee,
  staticAccountIds,
}: EntryBuilderDebitState<M>): EntryBuilderDebit<M> => {
  const debitAccount = <T extends WalletCurrency>({
    accountId,
    amount,
    additionalMetadata,
  }: {
    accountId: LedgerAccountId
    amount: PaymentAmount<T>
    additionalMetadata?: TxMetadata
  }): EntryBuilderCredit<M, T> => {
    const debitMetadata = additionalMetadata
      ? { ...metadata, ...additionalMetadata }
      : metadata
    entry.debit(accountId, Number(amount.amount), {
      ...debitMetadata,
      currency: amount.currency,
    })
    if (amount.currency === WalletCurrency.Btc) {
      return EntryBuilderCreditWithBtcDebit({
        entry,
        metadata,
        fee,
        debitAmount: amount as BtcPaymentAmount,
        staticAccountIds,
      }) as EntryBuilderCredit<M, T>
    }

    return EntryBuilderCreditWithUsdDebit({
      entry,
      metadata,
      fee,
      debitAmount: amount as UsdPaymentAmount,
      staticAccountIds,
    }) as EntryBuilderCredit<M, T>
  }

  const debitLnd = (amount: BtcPaymentAmount): EntryBuilderCreditWithBtcDebit<M> => {
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
    }) as EntryBuilderCreditWithBtcDebit<M>
  }

  return {
    debitAccount,
    debitLnd,
  }
}

type EntryBuilderCreditState<M extends MediciEntry, D extends WalletCurrency> = {
  entry: M
  metadata: TxMetadata
  fee: BtcPaymentAmount
  debitAmount: PaymentAmount<D>
  staticAccountIds: {
    dealerBtcAccountId: LedgerAccountId
    dealerUsdAccountId: LedgerAccountId
  }
}

const EntryBuilderCreditWithUsdDebit = <M extends MediciEntry>({
  entry,
  metadata,
  debitAmount,
  staticAccountIds,
  fee,
}: EntryBuilderCreditState<M, "USD">): EntryBuilderCreditWithUsdDebit<M> => {
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
  const creditAccount = ({
    accountId,
    amount,
  }: {
    accountId: LedgerAccountId
    amount?: BtcPaymentAmount
  }) => {
    if (amount) {
      withdrawUsdFromDealer({
        entry,
        metadata,
        staticAccountIds,
        btcAmount: amount,
        usdAmount: debitAmount,
      })
    }
    const creditAmount = amount ? calc.sub(amount, fee) : debitAmount
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

const EntryBuilderCreditWithBtcDebit = <M extends MediciEntry>({
  entry,
  metadata,
  fee,
  debitAmount,
  staticAccountIds,
}: EntryBuilderCreditState<M, "BTC">): EntryBuilderCreditWithBtcDebit<M> => {
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
