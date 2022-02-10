import { toSats } from "@domain/bitcoin"
import {
  CouldNotFindTransactionError,
  liabilitiesMainAccount,
  toWalletId,
  UnknownLedgerError,
} from "@domain/ledger"
import { toObjectId } from "@services/mongoose/utils"

import { MainBook } from "@services/ledger/books"

export const LedgerExternalService = (): ILedgerExternalService => {
  const findFromLiabilitiesById = async (
    id: LedgerTransactionId,
  ): Promise<LedgerTransaction | LedgerServiceError> => {
    try {
      const _id = toObjectId<LedgerTransactionId>(id)
      const { results } = await MainBook.ledger({
        account_path: liabilitiesMainAccount,
        _id,
      })
      if (results.length === 1) {
        return translateToLedgerTx(results[0])
      }
      return new CouldNotFindTransactionError()
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const listFromLiabilities = async (
    hash: PaymentHash | OnChainTxHash,
  ): Promise<LedgerTransaction[] | LedgerServiceError> => {
    try {
      const { results } = await MainBook.ledger({
        account_path: liabilitiesMainAccount,
        hash,
      })
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const listByWalletId = async ({
    liabilitiesWalletId,
    ...args
  }: ListByWalletIdArgs): Promise<LedgerTransaction[] | LedgerServiceError> => {
    try {
      const { results } = await MainBook.ledger({ account: liabilitiesWalletId, ...args })
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const isTxRecorded = async (
    args: IsTxRecordedArgs,
  ): Promise<boolean | LedgerServiceError> => {
    try {
      const { total } = await MainBook.ledger(args)
      return total > 0
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  return {
    findFromLiabilitiesById,
    listFromLiabilities,
    listByWalletId,
    isTxRecorded,
  }
}

const translateToLedgerTx = (tx): LedgerTransaction => ({
  id: tx.id,
  walletId: toWalletId(tx.accounts),
  type: tx.type,
  debit: toSats(tx.debit),
  credit: toSats(tx.credit),
  fee: toSats(tx.fee),
  usd: tx.usd,
  feeUsd: tx.feeUsd,
  currency: tx.currency,
  timestamp: tx.timestamp,
  pendingConfirmation: tx.pending,
  journalId: tx._journal.toString(),
  lnMemo: tx.memo,
  username: tx.username,
  memoFromPayer: tx.memoPayer,
  paymentHash: tx.hash,
  pubkey: tx.pubkey,
  address:
    tx.payee_addresses && tx.payee_addresses.length > 0
      ? tx.payee_addresses[0]
      : undefined,
  txHash: tx.hash,
  feeKnownInAdvance: tx.feeKnownInAdvance || false,
})
