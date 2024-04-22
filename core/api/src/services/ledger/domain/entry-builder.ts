import {
  coldStorageAccountDescriptor,
  lndLedgerAccountDescriptor,
  onChainLedgerAccountDescriptor,
} from "./accounts"

import { AmountCalculator, WalletCurrency } from "@/domain/shared"

const calc = AmountCalculator()

export const EntryBuilder = <M extends MediciEntry>({
  staticAccountIds,
  externalId,
  entry,
  metadata,
  additionalInternalMetadata,
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
      additionalInternalMetadata,
      staticAccountIds,
      externalId,
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
  additionalInternalMetadata,
  staticAccountIds,
  externalId,
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
        ...additionalInternalMetadata,
        currency: btcBankFee.currency,
        external_id: externalId,
      })
    }

    return EntryBuilderDebit({
      metadata,
      additionalInternalMetadata,
      entry,
      amountWithFees: { usdWithFees, btcWithFees },
      bankFee: { btcBankFee, usdBankFee },
      staticAccountIds,
      externalId,
    })
  }

  return {
    withBankFee,
  }
}

const EntryBuilderDebit = <M extends MediciEntry>({
  entry,
  metadata,
  additionalInternalMetadata,
  staticAccountIds,
  externalId,
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
    const debitMetadata = {
      ...metadata,
      ...(additionalMetadata ? additionalMetadata : {}),
    }

    if (accountDescriptor.currency === WalletCurrency.Btc) {
      entry.debit(accountDescriptor.id, Number(btcWithFees.amount), {
        ...debitMetadata,
        currency: btcWithFees.currency,
        external_id: externalId,
      })
    } else {
      entry.debit(accountDescriptor.id, Number(usdWithFees.amount), {
        ...debitMetadata,
        currency: usdWithFees.currency,
        external_id: externalId,
      })
    }

    return EntryBuilderCredit({
      entry,
      metadata,
      additionalInternalMetadata,
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
      externalId,
    }) as EntryBuilderCredit<M>
  }

  const debitOffChain = (): EntryBuilderCredit<M> => {
    return debitAccount({
      accountDescriptor: lndLedgerAccountDescriptor,
      additionalMetadata: additionalInternalMetadata,
    })
  }

  const debitOnChain = (): EntryBuilderCredit<M> => {
    return debitAccount({
      accountDescriptor: onChainLedgerAccountDescriptor,
      additionalMetadata: additionalInternalMetadata,
    })
  }

  const debitColdStorage = (): EntryBuilderCredit<M> => {
    return debitAccount({
      accountDescriptor: coldStorageAccountDescriptor,
      additionalMetadata: additionalInternalMetadata,
    })
  }

  return {
    debitAccount,
    debitOffChain,
    debitOnChain,
    debitColdStorage,
  }
}

const EntryBuilderCredit = <M extends MediciEntry>({
  entry,
  metadata,
  additionalInternalMetadata,
  bankFee: { usdBankFee, btcBankFee },
  amountWithFees: { usdWithFees, btcWithFees },
  debitCurrency,
  staticAccountIds,
  externalId,
}: EntryBuilderCreditState<M>): EntryBuilderCredit<M> => {
  const addDealerDebitsAndCredits = <T extends WalletCurrency>(
    accountDescriptor: LedgerAccountDescriptor<T>,
  ): M => {
    const dealerMetadata = {
      ...metadata,
      ...additionalInternalMetadata,
    }

    const addUsdToBtcConversionToDealer = ({
      btcAmount,
      usdAmount,
    }: {
      btcAmount: BtcPaymentAmount
      usdAmount: UsdPaymentAmount
    }) => {
      entry.debit(staticAccountIds.dealerBtcAccountId, Number(btcAmount.amount), {
        ...dealerMetadata,
        currency: btcAmount.currency,
        external_id: externalId,
      })
      entry.credit(staticAccountIds.dealerUsdAccountId, Number(usdAmount.amount), {
        ...dealerMetadata,
        currency: usdAmount.currency,
        external_id: externalId,
      })
      return entry
    }

    const addBtcToUsdConversionToDealer = ({
      btcAmount,
      usdAmount,
    }: {
      btcAmount: BtcPaymentAmount
      usdAmount: UsdPaymentAmount
    }) => {
      entry.credit(staticAccountIds.dealerBtcAccountId, Number(btcAmount.amount), {
        ...dealerMetadata,
        currency: btcAmount.currency,
        external_id: externalId,
      })
      entry.debit(staticAccountIds.dealerUsdAccountId, Number(usdAmount.amount), {
        ...dealerMetadata,
        currency: usdAmount.currency,
        external_id: externalId,
      })
      return entry
    }

    switch (true) {
      case debitCurrency === WalletCurrency.Usd &&
        accountDescriptor.currency === WalletCurrency.Usd &&
        usdBankFee.amount > 0:
        return addUsdToBtcConversionToDealer({
          btcAmount: btcBankFee,
          usdAmount: usdBankFee,
        })

      case debitCurrency === WalletCurrency.Usd &&
        accountDescriptor.currency === WalletCurrency.Btc:
        return addUsdToBtcConversionToDealer({
          btcAmount: btcWithFees,
          usdAmount: usdWithFees,
        })

      case debitCurrency === WalletCurrency.Btc &&
        accountDescriptor.currency === WalletCurrency.Usd:
        return addBtcToUsdConversionToDealer({
          btcAmount: calc.sub(btcWithFees, btcBankFee),
          usdAmount: calc.sub(usdWithFees, usdBankFee),
        })

      default:
        return entry
    }
  }

  const creditAccount = <T extends WalletCurrency>({
    accountDescriptor,
    additionalMetadata,
  }: {
    accountDescriptor: LedgerAccountDescriptor<T>
    additionalMetadata?: TxMetadata
  }) => {
    const updatedEntry = addDealerDebitsAndCredits(accountDescriptor)

    const usdWithOutFee = calc.sub(usdWithFees, usdBankFee)
    const btcWithOutFee = calc.sub(btcWithFees, btcBankFee)
    const creditAmount =
      accountDescriptor.currency === WalletCurrency.Usd ? usdWithOutFee : btcWithOutFee

    const creditMetadata = additionalMetadata
      ? { ...metadata, ...additionalMetadata }
      : metadata

    updatedEntry.credit(accountDescriptor.id, Number(creditAmount.amount), {
      ...creditMetadata,
      currency: creditAmount.currency,
      external_id: externalId,
    })

    return removeZeroAmountEntries(updatedEntry)
  }

  const creditOffChain = () =>
    creditAccount({
      accountDescriptor: lndLedgerAccountDescriptor,
      additionalMetadata: additionalInternalMetadata,
    })

  const creditOnChain = () =>
    creditAccount({
      accountDescriptor: onChainLedgerAccountDescriptor,
      additionalMetadata: additionalInternalMetadata,
    })

  const creditColdStorage = () =>
    creditAccount({
      accountDescriptor: coldStorageAccountDescriptor,
      additionalMetadata: additionalInternalMetadata,
    })

  return {
    creditOffChain,
    creditOnChain,
    creditAccount,
    creditColdStorage,
  }
}

const removeZeroAmountEntries = <M extends MediciEntry>(entry: M): M => {
  const updatedTransactions = entry.transactions.filter(
    (txn) => !(txn.debit === 0 && txn.credit === 0),
  )

  entry.transactions = updatedTransactions

  return entry
}
