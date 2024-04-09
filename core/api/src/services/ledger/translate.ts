import { toSats } from "@/domain/bitcoin"
import { toCents } from "@/domain/fiat"
import { InvalidTxMetadataFetchedError, toWalletId } from "@/domain/ledger"
import { WalletCurrency } from "@/domain/shared"
import { fromObjectId } from "@/services/mongoose/utils"

export const translateToLedgerTx = <S extends WalletCurrency, T extends DisplayCurrency>(
  tx: ILedgerTransaction,
): LedgerTransaction<S> => {
  const currency = tx.currency as S

  const displayCurrency =
    tx.displayCurrency !== undefined ? (tx.displayCurrency as T) : undefined

  const debit = currency === WalletCurrency.Btc ? toSats(tx.debit) : toCents(tx.debit)
  const credit = currency === WalletCurrency.Btc ? toSats(tx.credit) : toCents(tx.credit)

  return {
    id: fromObjectId<LedgerTransactionId>(tx._id || ""),
    walletId: toWalletId(tx.accounts as LiabilitiesWalletId),
    externalId: (tx.external_id as LedgerExternalId) || undefined,
    type: tx.type,
    debit,
    credit,
    currency,
    timestamp: tx.timestamp,
    pendingConfirmation: tx.pending,
    lnPaymentState: tx.bundle_completion_state,
    journalId: tx._journal.toString() as LedgerJournalId,
    lnMemo: tx.memo,
    username: (tx.username as Username) || undefined,
    memoFromPayer: tx.memoPayer,
    paymentHash: (tx.hash as PaymentHash) || undefined,
    pubkey: (tx.pubkey as Pubkey) || undefined,
    address:
      tx.payee_addresses && tx.payee_addresses.length > 0
        ? (tx.payee_addresses[0] as OnChainAddress)
        : undefined,
    requestId: (tx.request_id as OnChainAddressRequestId) || undefined,
    payoutId: (tx.payout_id as PayoutId) || undefined,
    txHash: (tx.hash as OnChainTxHash) || undefined,
    vout: (tx.vout as OnChainTxVout) || undefined,
    feeKnownInAdvance: tx.feeKnownInAdvance || false,

    satsAmount: tx.satsAmount !== undefined ? toSats(tx.satsAmount) : undefined,
    centsAmount: tx.centsAmount !== undefined ? toCents(tx.centsAmount) : undefined,
    satsFee: tx.satsFee !== undefined ? toSats(tx.satsFee) : undefined,
    centsFee: tx.centsFee !== undefined ? toCents(tx.centsFee) : undefined,
    displayAmount:
      tx.displayAmount !== undefined
        ? (tx.displayAmount as DisplayCurrencyBaseAmount)
        : undefined,
    displayFee:
      tx.displayFee !== undefined
        ? (tx.displayFee as DisplayCurrencyBaseAmount)
        : undefined,
    displayCurrency,

    fee: tx.fee,
    usd: tx.usd,
    feeUsd: tx.feeUsd,
  }
}

export const translateToLedgerTxWithMetadata = <S extends WalletCurrency>({
  rawTx,
  txMetadata,
}: {
  rawTx: ILedgerTransaction
  txMetadata: LedgerTransactionMetadata | undefined
}): LedgerTransaction<S> | LedgerServiceError => {
  const tx = translateToLedgerTx<S, DisplayCurrency>(rawTx)
  if (txMetadata === undefined) {
    return tx
  }

  if (tx.id !== txMetadata.id) {
    return new InvalidTxMetadataFetchedError()
  }

  return { ...tx, ...txMetadata }
}

export const translateToLedgerTxAndMetadata = <S extends WalletCurrency>(
  rawTxAndMetadata: ILedgerTransaction & TransactionMetadataRecord,
): LedgerTransaction<S> => ({
  ...translateToLedgerTx<S, DisplayCurrency>(rawTxAndMetadata),
  revealedPreImage: (rawTxAndMetadata.revealedPreImage as RevealedPreImage) || undefined,
})
