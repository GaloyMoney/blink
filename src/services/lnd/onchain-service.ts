import {
  UnknownOnChainServiceError,
  OnChainServiceUnavailableError,
} from "@domain/bitcoin/onchain"
import { toSats } from "@domain/bitcoin"
import {
  getHeight,
  createChainAddress,
  getChainTransactions,
  GetChainTransactionsResult,
} from "lightning"
import { getActiveOnchainLnd } from "./utils"

export const OnChainService = (
  decoder: TxDecoder,
): IOnChainService | OnChainServiceError => {
  let lnd: AuthenticatedLnd, pubkey

  try {
    ;({ lnd, pubkey } = getActiveOnchainLnd())
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

  const createOnChainAddress = async (): Promise<
    OnChainAddressIdentifier | OnChainServiceError
  > => {
    try {
      const { address } = await createChainAddress({
        lnd,
        format: "p2wpkh",
      })
      return { address: address as OnChainAddress, pubkey }
    } catch (err) {
      return new UnknownOnChainServiceError(err)
    }
  }

  return {
    getIncomingTransactions,
    createOnChainAddress,
  }
}

export const extractIncomingTransactions = (
  decoder: TxDecoder,
  { transactions }: GetChainTransactionsResult,
): SubmittedTransaction[] => {
  return transactions
    .filter((tx) => !tx.is_outgoing && !!tx.transaction)
    .map(
      (tx): SubmittedTransaction => {
        return {
          confirmations: tx.confirmation_count || 0,
          rawTx: decoder.decode(tx.transaction as string),
          fee: toSats(tx.fee || 0),
          createdAt: new Date(tx.created_at),
        }
      },
    )
}
