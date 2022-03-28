import { AmountCalculator, WalletCurrency } from "@domain/shared"

import { coldStorageAccountDescriptor, lndLedgerAccountDescriptor } from "./accounts"

const calc = AmountCalculator()

export const EntryBuilder = <M extends MediciEntry>({
  staticAccountIds,
  entry,
  metadata,
}: EntryBuilderConfig<M>) => {
  const withTotalAmount = ({
    usdWithFee,
    btcWithFee,
  }: {
    usdWithFee: UsdPaymentAmount
    btcWithFee: BtcPaymentAmount
  }) => {
    return EntryBuilderFee({
      entry,
      metadata,
      staticAccountIds,
      amountWithFee: {
        usdWithFee,
        btcWithFee,
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
  amountWithFee: { usdWithFee, btcWithFee },
}: EntryBuilderFeeState<M>): EntryBuilderFee<M> => {
  const withFee = ({
    btcProtocolFee,
    usdProtocolFee,
  }: {
    btcProtocolFee: BtcPaymentAmount
    usdProtocolFee: UsdPaymentAmount
  }) => {
    if (btcProtocolFee.amount > 0n) {
      entry.credit(staticAccountIds.bankOwnerAccountId, Number(btcProtocolFee.amount), {
        ...metadata,
        currency: btcProtocolFee.currency,
      })
    }

    return EntryBuilderDebit({
      metadata,
      entry,
      amountWithFee: { usdWithFee, btcWithFee },
      fee: { btcProtocolFee, usdProtocolFee },
      staticAccountIds,
    })
  }

  return {
    withFee,
  }
}

const EntryBuilderDebit = <M extends MediciEntry>({
  entry,
  metadata,
  staticAccountIds,
  amountWithFee: { usdWithFee, btcWithFee },
  fee: { usdProtocolFee, btcProtocolFee },
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
      entry.debit(accountDescriptor.id, Number(btcWithFee.amount), {
        ...debitMetadata,
        currency: btcWithFee.currency,
      })
    } else {
      entry.debit(accountDescriptor.id, Number(usdWithFee.amount), {
        ...debitMetadata,
        currency: usdWithFee.currency,
      })
    }

    return EntryBuilderCredit({
      entry,
      metadata,
      debitCurrency: accountDescriptor.currency,
      fee: {
        usdProtocolFee,
        btcProtocolFee,
      },
      amountWithFee: {
        usdWithFee,
        btcWithFee,
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
  fee: { usdProtocolFee, btcProtocolFee },
  amountWithFee: { usdWithFee, btcWithFee },
  debitCurrency,
  staticAccountIds,
}: EntryBuilderCreditState<M>): EntryBuilderCredit<M> => {
  const creditLnd = () => creditAccount(lndLedgerAccountDescriptor)
  const creditColdStorage = () => creditAccount(coldStorageAccountDescriptor)

  const creditAccount = <T extends WalletCurrency>(
    accountDescriptor: LedgerAccountDescriptor<T>,
  ) => {
    let entryToReturn = entry
    const usdWithOutFee = calc.sub(usdWithFee, usdProtocolFee)
    const btcWithOutFee = calc.sub(btcWithFee, btcProtocolFee)

    if (
      debitCurrency === WalletCurrency.Usd &&
      accountDescriptor.currency === WalletCurrency.Usd &&
      usdProtocolFee.amount > 0
    ) {
      entryToReturn = addUsdToBtcConversionToEntry({
        entry,
        metadata,
        staticAccountIds,
        btcAmount: btcProtocolFee,
        usdAmount: usdProtocolFee,
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
        btcAmount: btcWithFee,
        usdAmount: usdWithFee,
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
    return entryToReturn
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
