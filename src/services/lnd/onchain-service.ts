import {
  UnknownOnChainServiceError,
  OnChainServiceUnavailableError,
  IncomingOnChainTransaction,
  CouldNotFindOnChainTransactionError,
  OutgoingOnChainTransaction,
} from "@domain/bitcoin/onchain"
import { toSats } from "@domain/bitcoin"
import {
  getChainTransactions,
  GetChainTransactionsResult,
  createChainAddress,
  getChainFeeEstimate,
  getWalletInfo,
  getChainBalance,
  sendToChainAddress,
} from "lightning"

import { wrapAsyncToRunInSpan } from "@services/tracing"
import { LocalCacheService } from "@services/cache"
import { CacheKeys } from "@domain/cache"
import { SECS_PER_5_MINS } from "@config"

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

  const getBalance = async (): Promise<Satoshis | OnChainServiceError> => {
    try {
      const { chain_balance } = await getChainBalance({ lnd })
      return toSats(chain_balance)
    } catch (err) {
      const errDetails = parseLndErrorDetails(err)
      return new UnknownOnChainServiceError(errDetails)
    }
  }

  const listTransactions = async (
    scanDepth: ScanDepth,
  ): Promise<GetChainTransactionsResult | OnChainServiceError> => {
    try {
      let blockHeight = await getCachedHeight()
      if (!blockHeight) {
        ;({ current_block_height: blockHeight } = await getWalletInfo({ lnd }))
        await LocalCacheService().set<number>({
          key: CacheKeys.BlockHeight,
          value: blockHeight,
          ttlSecs: SECS_PER_5_MINS,
        })
      }

      // this is necessary for tests, otherwise `after` may be negative
      const after = Math.max(0, blockHeight - scanDepth)

      return getChainTransactions({
        lnd,
        after,
      })
    } catch (err) {
      const errDetails = parseLndErrorDetails(err)
      return new UnknownOnChainServiceError(errDetails)
    }
  }

  const listIncomingTransactions = async (
    scanDepth: ScanDepth,
  ): Promise<IncomingOnChainTransaction[] | OnChainServiceError> => {
    const txs = await listTransactions(scanDepth)
    if (txs instanceof Error) return txs

    return extractIncomingTransactions({ decoder, txs })
  }

  const listOutgoingTransactions = async (
    scanDepth: ScanDepth,
  ): Promise<OutgoingOnChainTransaction[] | OnChainServiceError> => {
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
      const errDetails = parseLndErrorDetails(err)
      return new UnknownOnChainServiceError(errDetails)
    }
  }

  const lookupOnChainFee = async ({
    txHash,
    scanDepth,
  }: LookupOnChainFeeArgs): Promise<Satoshis | OnChainServiceError> => {
    const onChainTxs = await listOutgoingTransactions(scanDepth)
    if (onChainTxs instanceof Error) return onChainTxs

    const tx = onChainTxs.find((tx) => tx.rawTx.txHash === txHash)
    return (tx && tx.fee) || new CouldNotFindOnChainTransactionError()
  }

  const getOnChainFeeEstimate = async ({
    amount,
    address,
    targetConfirmations,
  }: GetOnChainFeeEstimateArgs): Promise<Satoshis | OnChainServiceError> => {
    const sendTo = [{ address, tokens: amount }]
    try {
      const { fee } = await getChainFeeEstimate({
        lnd,
        send_to: sendTo,
        target_confirmations: targetConfirmations,
      })

      return toSats(fee)
    } catch (err) {
      const errDetails = parseLndErrorDetails(err)
      return new UnknownOnChainServiceError(errDetails)
    }
  }

  const payToAddress = async ({
    amount,
    address,
    targetConfirmations,
  }: PayToAddressArgs): Promise<OnChainTxHash | OnChainServiceError> => {
    try {
      const { id } = await sendToChainAddress({
        lnd,
        address,
        tokens: amount,
        utxo_confirmations: 0,
        target_confirmations: targetConfirmations,
      })

      return id as OnChainTxHash
    } catch (err) {
      const errDetails = parseLndErrorDetails(err)
      return new UnknownOnChainServiceError(errDetails)
    }
  }

  return {
    getBalance,
    listIncomingTransactions: wrapAsyncToRunInSpan({
      namespace: `service.lnd`,
      fn: listIncomingTransactions,
    }),
    lookupOnChainFee,
    createOnChainAddress,
    getOnChainFeeEstimate,
    payToAddress,
  }
}

const parseLndErrorDetails = (err) =>
  err[2]?.err?.details || err[2]?.failures?.[0]?.[2]?.err?.details || err[1]

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
}): OutgoingOnChainTransaction[] => {
  return txs.transactions
    .filter((tx) => tx.is_outgoing && !!tx.transaction)
    .map(
      (tx): OutgoingOnChainTransaction =>
        OutgoingOnChainTransaction({
          confirmations: tx.confirmation_count || 0,
          rawTx: decoder.decode(tx.transaction as string),
          fee: toSats(tx.fee || 0),
          createdAt: new Date(tx.created_at),
        }),
    )
}

const getCachedHeight = async (): Promise<number> => {
  const cachedHeight = await LocalCacheService().get<number>(CacheKeys.BlockHeight)
  if (cachedHeight instanceof Error) return 0
  return cachedHeight
}
