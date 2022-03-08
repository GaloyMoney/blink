import { AmountCalculator, WalletCurrency } from "@domain/shared"

import { coldStorageAccountDescriptor, lndLedgerAccountDescriptor } from "./accounts"

export const ZERO_SATS = {
  currency: WalletCurrency.Btc,
  amount: 0n,
} as const

export const ZERO_CENTS = {
  currency: WalletCurrency.Usd,
  amount: 0n,
}
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

    const usdWithOutFee = calc.sub(usdWithFee, usdProtocolFee)
    const btcWithOutFee = calc.sub(btcWithFee, btcProtocolFee)
    return EntryBuilderDebit({
      metadata,
      entry,
      amountWithFee: { usdWithFee, btcWithFee },
      amountWithOutFee: { usdWithOutFee, btcWithOutFee },
      staticAccountIds,
    })
  }

  const withFeeFromBank = ({
    btcProtocolFee,
    usdProtocolFee,
  }: {
    btcProtocolFee: BtcPaymentAmount
    usdProtocolFee: UsdPaymentAmount
  }) => {
    if (btcProtocolFee.amount > 0n) {
      entry.debit(staticAccountIds.bankOwnerAccountId, Number(btcProtocolFee.amount), {
        ...metadata,
        currency: btcProtocolFee.currency,
      })
    }

    const usdWithOutFee = calc.add(usdWithFee, usdProtocolFee)
    const btcWithOutFee = calc.add(btcWithFee, btcProtocolFee)
    return EntryBuilderDebit({
      metadata,
      entry,
      amountWithFee: { usdWithFee, btcWithFee },
      amountWithOutFee: { usdWithOutFee, btcWithOutFee },
      staticAccountIds,
    })
  }

  return {
    withFee,
    withFeeFromBank,
  }
}

const EntryBuilderDebit = <M extends MediciEntry>({
  entry,
  metadata,
  staticAccountIds,
  amountWithFee: { usdWithFee, btcWithFee },
  amountWithOutFee: { usdWithOutFee, btcWithOutFee },
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
      amountWithOutFee: {
        usdWithOutFee,
        btcWithOutFee,
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

type EntryBuilderCreditState<M extends MediciEntry> = {
  entry: M
  metadata: TxMetadata
  debitCurrency: WalletCurrency
  amountWithOutFee: {
    usdWithOutFee: UsdPaymentAmount
    btcWithOutFee: BtcPaymentAmount
  }
  amountWithFee: {
    usdWithFee: UsdPaymentAmount
    btcWithFee: BtcPaymentAmount
  }
  staticAccountIds: {
    dealerBtcAccountId: LedgerAccountId
    dealerUsdAccountId: LedgerAccountId
  }
}

const EntryBuilderCredit = <M extends MediciEntry>({
  entry,
  metadata,
  amountWithOutFee: { usdWithOutFee, btcWithOutFee },
  amountWithFee: { usdWithFee, btcWithFee },
  debitCurrency,
  staticAccountIds,
}: EntryBuilderCreditState<M>): EntryBuilderCredit<M> => {
  const creditLnd = () => creditAccount(lndLedgerAccountDescriptor)
  const creditColdStorage = () => creditAccount(coldStorageAccountDescriptor)

  const creditAccount = <T extends WalletCurrency>(
    accountDescriptor: LedgerAccountDescriptor<T>,
  ) => {
    if (
      debitCurrency === WalletCurrency.Usd &&
      accountDescriptor.currency === WalletCurrency.Usd &&
      usdWithFee.amount != usdWithOutFee.amount
    ) {
      const dealerData = {
        entry,
        metadata,
        staticAccountIds,
        btcAmount: calc.sub(btcWithFee, btcWithOutFee),
        usdAmount: calc.sub(usdWithFee, usdWithOutFee),
      }
      withdrawUsdFromDealer(dealerData)
    }

    if (
      debitCurrency === WalletCurrency.Usd &&
      accountDescriptor.currency === WalletCurrency.Btc
    ) {
      const dealerData = {
        entry,
        metadata,
        staticAccountIds,
        btcAmount: btcWithFee,
        usdAmount: usdWithFee,
      }
      withdrawUsdFromDealer(dealerData)
    }

    if (
      debitCurrency === WalletCurrency.Btc &&
      accountDescriptor.currency === WalletCurrency.Usd
    ) {
      const dealerData = {
        entry,
        metadata,
        staticAccountIds,
        btcAmount: btcWithOutFee,
        usdAmount: usdWithOutFee,
      }
      addUsdToDealer(dealerData)
    }

    const creditAmount =
      accountDescriptor.currency === WalletCurrency.Usd ? usdWithOutFee : btcWithOutFee

    entry.credit(accountDescriptor.id, Number(creditAmount.amount), {
      ...metadata,
      currency: creditAmount.currency,
    })
    return entry
  }

  return {
    creditLnd,
    creditAccount,
    creditColdStorage,
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
