import {
  UnknownOnChainServiceError,
  OnChainServiceUnavailableError,
  SubmittedTransaction,
} from "@domain/bitcoin/onchain"
import { toSats } from "@domain/bitcoin"
import {
  getHeight,
  getChainTransactions,
  GetChainTransactionsResult,
  createChainAddress,
  getChainFeeEstimate,
} from "lightning"
import { getActiveOnchainLnd } from "./utils"

export const OnChainService = (
  decoder: TxDecoder,
): IOnChainService | OnChainServiceError => {
  let lnd: AuthenticatedLnd
  let pubkey: Pubkey

  try {
    const activeNode = getActiveOnchainLnd()
    lnd = activeNode.lnd
    pubkey = activeNode.pubkey as Pubkey
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

  const getOnChainFeeEstimate = async (
    amount: Satoshis,
    address: OnChainAddress,
  ): Promise<Satoshis | OnChainServiceError> => {
    const sendTo = [{ address, tokens: amount }]
    try {
      const { fee } = await getChainFeeEstimate({
        lnd,
        send_to: sendTo,
      })

      return fee as Satoshis
    } catch (err) {
      return new UnknownOnChainServiceError(err)
    }
  }

  return {
    getIncomingTransactions,
    createOnChainAddress,
    getOnChainFeeEstimate,
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
