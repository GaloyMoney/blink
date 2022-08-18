import { AmountCalculator, WalletCurrency } from "@domain/shared"

import { lndLedgerAccountId } from "./accounts"

const ZERO_SATS = {
  currency: WalletCurrency.Btc,
  amount: 0n,
} as const
const calc = AmountCalculator()

export const LegacyEntryBuilder = <M extends MediciEntry>({
  staticAccountIds,
  entry,
  metadata,
}: LegacyEntryBuilderConfig<M>) => {
  const withFee = (fee: BtcPaymentAmount) => {
    if (fee.amount > 0n) {
      entry.credit(staticAccountIds.bankOwnerAccountId, Number(fee.amount), {
        ...metadata,
        currency: fee.currency,
      })
    }
    return LegacyEntryBuilderDebit({ metadata, entry, fee, staticAccountIds })
  }

  const withoutFee = () => {
    return withFee(ZERO_SATS)
  }

  return {
    withFee,
    withoutFee,
  }
}

const LegacyEntryBuilderDebit = <M extends MediciEntry>({
  entry,
  metadata,
  fee,
  staticAccountIds,
}: LegacyEntryBuilderDebitState<M>): LegacyEntryBuilderDebit<M> => {
  const debitAccount = <T extends WalletCurrency>({
    accountId,
    amount,
    additionalMetadata,
  }: {
    accountId: LedgerAccountId
    amount: PaymentAmount<T>
    additionalMetadata?: TxMetadata
  }): LegacyEntryBuilderCredit<M, T> => {
    const debitMetadata = additionalMetadata
      ? { ...metadata, ...additionalMetadata }
      : metadata
    entry.debit(accountId, Number(amount.amount), {
      ...debitMetadata,
      currency: amount.currency,
    })
    if (amount.currency === WalletCurrency.Btc) {
      return LegacyEntryBuilderCreditWithBtcDebit({
        entry,
        metadata,
        fee,
        debitAmount: amount as BtcPaymentAmount,
        staticAccountIds,
      }) as LegacyEntryBuilderCredit<M, T>
    }

    return LegacyEntryBuilderCreditWithUsdDebit({
      entry,
      metadata,
      fee,
      debitAmount: amount as UsdPaymentAmount,
      staticAccountIds,
    }) as LegacyEntryBuilderCredit<M, T>
  }

  const debitLnd = (
    amount: BtcPaymentAmount,
  ): LegacyEntryBuilderCreditWithBtcDebit<M> => {
    entry.debit(lndLedgerAccountId, Number(amount.amount), {
      ...metadata,
      currency: amount.currency,
    })
    return LegacyEntryBuilderCreditWithBtcDebit({
      entry,
      metadata,
      fee,
      debitAmount: amount as BtcPaymentAmount,
      staticAccountIds,
    }) as LegacyEntryBuilderCreditWithBtcDebit<M>
  }

  return {
    debitAccount,
    debitLnd,
  }
}

const LegacyEntryBuilderCreditWithUsdDebit = <M extends MediciEntry>({
  entry,
  metadata,
  debitAmount,
  staticAccountIds,
  fee,
}: LegacyEntryBuilderCreditState<M, "USD">): LegacyEntryBuilderCreditWithUsdDebit<M> => {
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
    return removeZeroAmountEntries(entry)
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

    return removeZeroAmountEntries(entry)
  }
  return {
    creditLnd,
    creditAccount,
  }
}

const LegacyEntryBuilderCreditWithBtcDebit = <M extends MediciEntry>({
  entry,
  metadata,
  fee,
  debitAmount,
  staticAccountIds,
}: LegacyEntryBuilderCreditState<M, "BTC">): LegacyEntryBuilderCreditWithBtcDebit<M> => {
  const creditLnd = () => {
    const creditAmount = calc.sub(debitAmount, fee)
    entry.credit(lndLedgerAccountId, Number(creditAmount.amount), {
      ...metadata,
      currency: creditAmount.currency,
    })
    return removeZeroAmountEntries(entry)
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
    return removeZeroAmountEntries(entry)
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

const removeZeroAmountEntries = <M extends MediciEntry>(entry: M): M => {
  const updatedTransactions = entry.transactions.filter(
    (txn) => !(txn.debit === 0 && txn.credit === 0),
  )

  entry.transactions = updatedTransactions

  return entry
}
