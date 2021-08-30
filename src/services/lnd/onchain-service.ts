import {
  UnknownOnChainServiceError,
  OnChainServiceUnavailableError,
  SubmittedTransaction,
} from "@domain/bitcoin/onchain"
import { toSats } from "@domain/bitcoin"
import { getHeight, getChainTransactions, GetChainTransactionsResult } from "lightning"
import { getActiveLnd } from "./utils"

export const OnChainService = (
  decoder: TxDecoder,
): IOnChainService | OnChainServiceError => {
  let lnd: AuthenticatedLnd

  try {
    ;({ lnd } = getActiveLnd())
  } catch (err) {
    return new OnChainServiceUnavailableError(err)
  }

  const getIncomingTransactions = async (
    scanDepth: number,
  ): Promise<SubmittedTransaction[] | OnChainServiceError> => {
    try {
      const { current_block_height } = await getHeight({ lnd })

      // this is necessary for tests, otherwise after may be negative
      const after = Math.max(0, current_block_height - scanDepth)

      const result = await getChainTransactions({
        lnd,
        after,
      })

      return extractIncomingTransactions(decoder, result)
    } catch (err) {
      return new UnknownOnChainServiceError(err)
    }
  }

  return {
    getIncomingTransactions,
  }
}

export const extractIncomingTransactions = (
  decoder: TxDecoder,
  { transactions }: GetChainTransactionsResult,
): SubmittedTransaction[] => {
  return transactions
    .filter((tx) => !tx.is_outgoing && !!tx.transaction)
    .map(
      (tx): SubmittedTransaction =>
        SubmittedTransaction({
          confirmations: tx.confirmation_count || 0,
          rawTx: decoder.decode(tx.transaction as string),
          fee: toSats(tx.fee || 0),
          createdAt: new Date(tx.created_at),
        }),
    )
}
