import { AmountCalculator, WalletCurrency } from "@domain/shared"

import { lndLedgerAccountId } from "./accounts"

type EntryBuilderDebitState = {
  entry: MediciEntry
  metadata: TxMetadata
  btcFee: BtcPaymentAmount | "NO_FEE"
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
}

type EntryBuilderCreditWithUsdDebit = {
  creditLnd: (amount: BtcPaymentAmount) => MediciEntry
}

type EntryBuilderCredit<D extends WalletCurrency> = D extends "USD"
  ? EntryBuilderCreditWithUsdDebit
  : {
      creditLnd: () => MediciEntry
    }

const calc = AmountCalculator()

export const EntryBuilder = ({
  staticAccountIds,
  entry,
  metadata,
}: EntryBuilderConfig) => {
  const withFee = ({ btc }: { btc: BtcPaymentAmount }) => {
    entry.credit(staticAccountIds.bankOwnerAccountId, Number(btc.amount), {
      currency: btc.currency,
      ...metadata,
    })
    return EntryBuilderDebit({ metadata, entry, btcFee: btc, staticAccountIds })
  }

  const withoutFee = (): EntryBuilderDebit => {
    return EntryBuilderDebit({ metadata, entry, btcFee: "NO_FEE", staticAccountIds })
  }

  return {
    withFee,
    withoutFee,
  }
}

const EntryBuilderDebit = ({
  entry,
  metadata,
  btcFee,
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
      currency: amount.currency,
      ...metadata,
    })
    if (amount.currency === WalletCurrency.Btc) {
      return EntryBuilderCreditWithBtcDebit({
        entry,
        metadata,
        btcFee,
        debitAmount: amount as BtcPaymentAmount,
        staticAccountIds,
      }) as EntryBuilderCredit<T>
    } else {
      return EntryBuilderCreditWithUsdDebit({
        entry,
        metadata,
        btcFee,
        debitAmount: amount as UsdPaymentAmount,
        staticAccountIds,
      }) as EntryBuilderCredit<T>
    }
  }

  return {
    debitAccount,
  }
}

type EntryBuilderCreditState<D extends WalletCurrency> = {
  entry: MediciEntry
  metadata: TxMetadata
  btcFee: BtcPaymentAmount | "NO_FEE"
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
      currency: WalletCurrency.Btc,
      ...metadata,
    })
    entry.credit(dealerUsdAccountId, Number(debitAmount.amount), {
      currency: WalletCurrency.Usd,
      ...metadata,
    })
    entry.credit(lndLedgerAccountId, Number(btcCreditAmount.amount), {
      currency: btcCreditAmount.currency,
      ...metadata,
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
  btcFee,
  debitAmount,
}: EntryBuilderCreditState<"BTC">) => {
  const creditLnd = () => {
    const creditAmount =
      btcFee === "NO_FEE"
        ? debitAmount
        : debitAmount.currency === WalletCurrency.Btc
        ? calc.sub(debitAmount, btcFee)
        : debitAmount
    entry.credit(lndLedgerAccountId, Number(creditAmount.amount), metadata)
    return entry
  }

  return {
    creditLnd,
  }
}
