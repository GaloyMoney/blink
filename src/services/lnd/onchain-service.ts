import {
  UnknownOnChainServiceError,
  OnChainServiceUnavailableError,
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

  const getIncomingTransactions = async ({
    scanDepth,
  }: {
    scanDepth: number
  }): Promise<SubmittedTransaction[] | OnChainServiceError> => {
    try {
      const { current_block_height } = await getHeight({ lnd })
      const after = Math.max(0, current_block_height - scanDepth) // this is necessary for tests, otherwise after may be negative
      const { transactions }: GetChainTransactionsResult = await getChainTransactions({
        lnd,
        after,
      })

      return transactions
        .filter((tx) => !tx.is_outgoing || !!tx.transaction)
        .map(
          (tx): SubmittedTransaction => {
            return {
              confirmations: tx.confirmation_count || 0,
              rawTx: decoder.decode(tx.transaction as string),
              createdAt: new Date(tx.created_at),
            }
          },
        )
    } catch (err) {
      return new UnknownOnChainServiceError(err)
    }
  }

  return {
    getIncomingTransactions,
  }
}
