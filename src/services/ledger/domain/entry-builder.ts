import { lndLedgerAccountId } from "./accounts"

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
  const debit = ({
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
    debit,
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
    const creditAmount =
      btcFee === "NO_FEE" ? debitAmount.amount : debitAmount.amount - btcFee.amount
    entry.credit(lndLedgerAccountId, Number(creditAmount), metadata)
    return entry
  }

  return {
    creditLnd,
  }
}
