import {
  UnknownOnChainServiceError,
  OnChainServiceUnavailableError,
  IncomingOnChainTransaction,
  CouldNotFindOnChainTransactionError,
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

  const listTransactions = async (
    scanDepth: number,
  ): Promise<GetChainTransactionsResult | OnChainServiceError> => {
    try {
      const { current_block_height } = await getHeight({ lnd })

      // this is necessary for tests, otherwise after may be negative
      const after = Math.max(0, current_block_height - scanDepth)

      return getChainTransactions({
        lnd,
        after,
      })
    } catch (err) {
      return new UnknownOnChainServiceError(err)
    }
  }

  const listIncomingTransactions = async (
    scanDepth: number,
  ): Promise<SubmittedTransaction[] | OnChainServiceError> => {
    const txs = await listTransactions(scanDepth)
    if (txs instanceof Error) return txs

    return extractIncomingTransactions({ decoder, txs })
  }

  const listOutgoingTransactions = async (
    scanDepth: number,
  ): Promise<SubmittedTransaction[] | OnChainServiceError> => {
    const txs = await listTransactions(scanDepth)
    if (txs instanceof Error) return txs

    return extractOutgoingTransactions({ decoder, txs })
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

  const findOnChainFee = async ({
    txHash,
    scanDepth,
  }: FindOnChainFeeArgs): Promise<Satoshis | OnChainServiceError> => {
    const onChainTxs = await listOutgoingTransactions(scanDepth)
    if (onChainTxs instanceof Error) return onChainTxs

    const tx = onChainTxs.find((tx) => tx.rawTx.txHash === txHash)
    return (tx && tx.fee) || new CouldNotFindOnChainTransactionError()
  }

  const getOnChainFeeEstimate = async (
    amount: Satoshis,
    address: OnChainAddress,
    targetConfirmations: TargetConfirmations,
  ): Promise<Satoshis | OnChainServiceError> => {
    const sendTo = [{ address, tokens: amount }]
    try {
      const { fee } = await getChainFeeEstimate({
        lnd,
        send_to: sendTo,
        target_confirmations: targetConfirmations,
      })

      return fee as Satoshis
    } catch (err) {
      return new UnknownOnChainServiceError(err[2]?.err?.details || err[1])
    }
  }

  return {
    listIncomingTransactions,
    findOnChainFee,
    createOnChainAddress,
    getOnChainFeeEstimate,
  }
}

export const extractIncomingTransactions = ({
  decoder,
  txs,
}: {
  decoder: TxDecoder
  txs: GetChainTransactionsResult
}): IncomingOnChainTransaction[] => {
  return txs.transactions
    .filter((tx) => !tx.is_outgoing && !!tx.transaction)
    .map(
      (tx): IncomingOnChainTransaction =>
        IncomingOnChainTransaction({
          confirmations: tx.confirmation_count || 0,
          rawTx: decoder.decode(tx.transaction as string),
          fee: toSats(tx.fee || 0),
          createdAt: new Date(tx.created_at),
        }),
    )
}

export const extractOutgoingTransactions = ({
  decoder,
  txs,
}: {
  decoder: TxDecoder
  txs: GetChainTransactionsResult
}): IncomingOnChainTransaction[] => {
  return txs.transactions
    .filter((tx) => tx.is_outgoing && !!tx.transaction)
    .map(
      (tx): IncomingOnChainTransaction =>
        IncomingOnChainTransaction({
          confirmations: tx.confirmation_count || 0,
          rawTx: decoder.decode(tx.transaction as string),
          fee: toSats(tx.fee || 0),
          createdAt: new Date(tx.created_at),
        }),
    )
}
