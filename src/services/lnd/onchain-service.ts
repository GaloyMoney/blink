import {
  UnknownOnChainServiceError,
  OnChainServiceUnavailableError,
} from "@domain/bitcoin/onchain"
import { toSats } from "@domain/bitcoin"
import { getHeight, getChainTransactions } from "lightning"
import { getActiveLnd } from "./utils"

export const MakeOnChainService = (
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
      const { transactions } = await getChainTransactions({ lnd, after })

      return transactions
        .filter((tx) => !tx.is_outgoing || !!tx.transaction)
        .map((tx) => {
          return {
            confirmations: tx.confirmation_count || 0,
            fee: toSats(tx.fee as number),
            id: tx.id as TxId,
            outputAddresses: tx.output_addresses as OnChainAddress[],
            tokens: toSats(tx.tokens),
            rawTx: decoder.decode(tx.transaction as string),
          } as SubmittedTransaction
        })
    } catch (err) {
      return new UnknownOnChainServiceError(err)
    }
  }

  return {
    getIncomingTransactions,
  }
}
