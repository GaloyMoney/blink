import { AmountCalculator, WalletCurrency } from "@domain/shared"

import { coldStorageAccountDescriptor, lndLedgerAccountDescriptor } from "./accounts"

const calc = AmountCalculator()

export const EntryBuilder = <M extends MediciEntry>({
  staticAccountIds,
  entry,
  metadata,
}: EntryBuilderConfig<M>) => {
  const withTotalAmount = ({
    usdWithFees,
    btcWithFees,
  }: {
    usdWithFees: UsdPaymentAmount
    btcWithFees: BtcPaymentAmount
  }) => {
    return EntryBuilderFee({
      entry,
      metadata,
      staticAccountIds,
      amountWithFees: {
        usdWithFees,
        btcWithFees,
      },
    })
  }

  return {
    withTotalAmount,
  }
}

const EntryBuilderFee = <M extends MediciEntry>({
  entry,
  metadata,
  staticAccountIds,
  amountWithFees: { usdWithFees, btcWithFees },
}: EntryBuilderFeeState<M>): EntryBuilderFee<M> => {
  const withBankFee = ({
    btcBankFee,
    usdBankFee,
  }: {
    btcBankFee: BtcPaymentAmount
    usdBankFee: UsdPaymentAmount
  }) => {
    if (btcBankFee.amount > 0n) {
      entry.credit(staticAccountIds.bankOwnerAccountId, Number(btcBankFee.amount), {
        ...metadata,
        currency: btcBankFee.currency,
      })
    }

    return EntryBuilderDebit({
      metadata,
      entry,
      amountWithFees: { usdWithFees, btcWithFees },
      bankFee: { btcBankFee, usdBankFee },
      staticAccountIds,
    })
  }

  return {
    withBankFee,
  }
}

const EntryBuilderDebit = <M extends MediciEntry>({
  entry,
  metadata,
  staticAccountIds,
  amountWithFees: { usdWithFees, btcWithFees },
  bankFee: { usdBankFee, btcBankFee },
}: EntryBuilderDebitState<M>): EntryBuilderDebit<M> => {
  const debitAccount = <T extends WalletCurrency>({
    accountDescriptor,
    additionalMetadata,
  }: {
    accountDescriptor: LedgerAccountDescriptor<T>
    additionalMetadata?: TxMetadata
  }): EntryBuilderCredit<M> => {
    const debitMetadata = additionalMetadata
      ? { ...metadata, ...additionalMetadata }
      : metadata

    if (accountDescriptor.currency === WalletCurrency.Btc) {
      entry.debit(accountDescriptor.id, Number(btcWithFees.amount), {
        ...debitMetadata,
        currency: btcWithFees.currency,
      })
    } else {
      entry.debit(accountDescriptor.id, Number(usdWithFees.amount), {
        ...debitMetadata,
        currency: usdWithFees.currency,
      })
    }

    return EntryBuilderCredit({
      entry,
      metadata,
      debitCurrency: accountDescriptor.currency,
      bankFee: {
        usdBankFee,
        btcBankFee,
      },
      amountWithFees: {
        usdWithFees,
        btcWithFees,
      },
      staticAccountIds,
    }) as EntryBuilderCredit<M>
  }

  const debitLnd = (): EntryBuilderCredit<M> => {
    return debitAccount({ accountDescriptor: lndLedgerAccountDescriptor })
  }

  const debitColdStorage = (): EntryBuilderCredit<M> => {
    return debitAccount({ accountDescriptor: coldStorageAccountDescriptor })
  }

  return {
    debitAccount,
    debitLnd,
    debitColdStorage,
  }
}

const EntryBuilderCredit = <M extends MediciEntry>({
  entry,
  metadata,
  bankFee: { usdBankFee, btcBankFee },
  amountWithFees: { usdWithFees, btcWithFees },
  debitCurrency,
  staticAccountIds,
}: EntryBuilderCreditState<M>): EntryBuilderCredit<M> => {
  const creditLnd = () => creditAccount(lndLedgerAccountDescriptor)
  const creditColdStorage = () => creditAccount(coldStorageAccountDescriptor)

  const creditAccount = <T extends WalletCurrency>(
    accountDescriptor: LedgerAccountDescriptor<T>,
  ) => {
    let entryToReturn = entry
    const usdWithOutFee = calc.sub(usdWithFees, usdBankFee)
    const btcWithOutFee = calc.sub(btcWithFees, btcBankFee)

    if (
      debitCurrency === WalletCurrency.Usd &&
      accountDescriptor.currency === WalletCurrency.Usd &&
      usdBankFee.amount > 0
    ) {
      entryToReturn = addUsdToBtcConversionToEntry({
        entry,
        metadata,
        staticAccountIds,
        btcAmount: btcBankFee,
        usdAmount: usdBankFee,
      })
    }

    if (
      debitCurrency === WalletCurrency.Usd &&
      accountDescriptor.currency === WalletCurrency.Btc
    ) {
      entryToReturn = addUsdToBtcConversionToEntry({
        entry,
        metadata,
        staticAccountIds,
        btcAmount: btcWithFees,
        usdAmount: usdWithFees,
      })
    }

    if (
      debitCurrency === WalletCurrency.Btc &&
      accountDescriptor.currency === WalletCurrency.Usd
    ) {
      entryToReturn = addBtcToUsdConversionToDealer({
        entry,
        metadata,
        staticAccountIds,
        btcAmount: btcWithOutFee,
        usdAmount: usdWithOutFee,
      })
    }

    const creditAmount =
      accountDescriptor.currency === WalletCurrency.Usd ? usdWithOutFee : btcWithOutFee

    entryToReturn.credit(accountDescriptor.id, Number(creditAmount.amount), {
      ...metadata,
      currency: creditAmount.currency,
    })

    return removeZeroAmountEntries(entryToReturn)
  }

  return {
    creditLnd,
    creditAccount,
    creditColdStorage,
  }
}

const addBtcToUsdConversionToDealer = <M extends MediciEntry>({
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
  entry: M
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

const addUsdToBtcConversionToEntry = <M extends MediciEntry>({
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
  entry: M
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
