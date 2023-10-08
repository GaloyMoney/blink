import { onChainLedgerAccountDescriptor } from "./accounts"

export const FeeOnlyEntryBuilder = <M extends MediciEntry>({
  entry,
  metadata,
  staticAccountUuids,
  btcFee,
}: FeeOnlyEntryBuilderConfig<M>): FeeOnlyEntryBuilderDebit<M> => {
  const debitAccount = <T extends WalletCurrency>({
    accountDescriptor,
  }: {
    accountDescriptor: LedgerAccountDescriptor<T>
    additionalMetadata?: TxMetadata
  }): FeeOnlyEntryBuilderCredit<M> => {
    entry.debit(accountDescriptor.id, Number(btcFee.amount), {
      ...metadata,
      currency: btcFee.currency,
    })

    return EntryBuilderCredit({
      entry,
      metadata,
      btcFee,
      staticAccountUuids,
    }) as FeeOnlyEntryBuilderCredit<M>
  }

  const debitBankOwner = (): FeeOnlyEntryBuilderCredit<M> => {
    const bankOwnerAccountDescriptor = {
      id: staticAccountUuids.bankOwnerAccountUuid,
      currency: btcFee.currency,
    } as LedgerAccountDescriptor<"BTC">

    return debitAccount({
      accountDescriptor: bankOwnerAccountDescriptor,
    })
  }

  const debitOnChain = (): FeeOnlyEntryBuilderCredit<M> => {
    return debitAccount({
      accountDescriptor: onChainLedgerAccountDescriptor,
    })
  }

  return {
    debitBankOwner,
    debitOnChain,
  }
}

const EntryBuilderCredit = <M extends MediciEntry>({
  entry,
  metadata,
  btcFee,
  staticAccountUuids,
}: FeeOnlyEntryBuilderConfig<M>): FeeOnlyEntryBuilderCredit<M> => {
  const creditAccount = ({
    accountDescriptor,
  }: {
    accountDescriptor: LedgerAccountDescriptor<"BTC">
    additionalMetadata?: TxMetadata
  }) => {
    entry.credit(accountDescriptor.id, Number(btcFee.amount), {
      ...metadata,
      currency: btcFee.currency,
    })

    return entry
  }

  const creditBankOwner = () => {
    const bankOwnerAccountDescriptor = {
      id: staticAccountUuids.bankOwnerAccountUuid,
      currency: btcFee.currency,
    } as LedgerAccountDescriptor<"BTC">

    return creditAccount({
      accountDescriptor: bankOwnerAccountDescriptor,
    })
  }

  const creditOnChain = () =>
    creditAccount({
      accountDescriptor: onChainLedgerAccountDescriptor,
    })

  return {
    creditBankOwner,
    creditOnChain,
  }
}
