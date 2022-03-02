import { lndLedgerAccountId } from "./accounts"
import { AmountCalculator } from "@domain/shared"

const calc = AmountCalculator()

export const EntryBuilder = ({
  bankOwnerAccountId,
  entry,
  metadata,
}: EntryBuilderConfig) => {
  const withFee = ({ btc }: { btc: PaymentAmount<"BTC"> }) => {
    entry.credit(bankOwnerAccountId, Number(btc.amount), metadata)
    return EntryBuilderDebit({ metadata, entry, btcFee: btc })
  }

  const withoutFee = () => {
    return EntryBuilderDebit({ metadata, entry, btcFee: "NO_FEE" })
  }

  return {
    withFee,
    withoutFee,
  }
}

type EntryBuilderDebitState = {
  entry: MediciEntry
  metadata: TxMetadata
  btcFee: PaymentAmount<"BTC"> | "NO_FEE"
}

const EntryBuilderDebit = ({ entry, metadata, btcFee }: EntryBuilderDebitState) => {
  const debitAccount = ({
    accountId,
    amount,
  }: {
    accountId: LedgerAccountId
    amount: PaymentAmount<"BTC">
  }) => {
    entry.debit(accountId, Number(amount.amount), metadata)
    return EntryBuilderCredit({ entry, metadata, btcFee, debitAmount: amount })
  }

  return {
    debitAccount,
  }
}

type EntryBuilderCreditState = {
  entry: MediciEntry
  metadata: TxMetadata
  btcFee: PaymentAmount<"BTC"> | "NO_FEE"
  debitAmount: PaymentAmount<"BTC">
}

const EntryBuilderCredit = ({
  entry,
  metadata,
  btcFee,
  debitAmount,
}: EntryBuilderCreditState) => {
  const creditLnd = () => {
    const creditAmount = btcFee === "NO_FEE" ? debitAmount : calc.sub(debitAmount, btcFee)
    entry.credit(lndLedgerAccountId, Number(creditAmount.amount), metadata)
    return entry
  }

  return {
    creditLnd,
  }
}
