import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"
import { toSats } from "@domain/bitcoin"
import {
  CouldNotFindOnChainTransactionError,
  CPFPAncestorLimitReachedError,
  IncomingOnChainTransaction,
  InsufficientOnChainFundsError,
  OnChainServiceBusyError,
  OnChainServiceUnavailableError,
  OutgoingOnChainTransaction,
  UnexpectedDustAmountError,
  UnknownOnChainServiceError,
} from "@domain/bitcoin/onchain"
import {
  createChainAddress,
  getChainBalance,
  getChainFeeEstimate,
  getChainTransactions,
  GetChainTransactionsResult,
  getPendingChainBalance,
  getWalletInfo,
  sendToChainAddress,
} from "lightning"

import { SECS_PER_5_MINS } from "@config"
import { CacheKeys } from "@domain/cache"
import { LocalCacheService } from "@services/cache"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import {
  getActiveOnchainLnd,
  getLndFromPubkey,
  getLnds,
  parseLndErrorDetails,
} from "./utils"
import { KnownLndErrorDetails } from "./errors"

export const OnChainService = (
  decoder: TxDecoder,
): IOnChainService | OnChainServiceError => {
  const activeNode = getActiveOnchainLnd()
  if (activeNode instanceof Error) return activeNode

  const lnd = activeNode.lnd
  const pubkey = activeNode.pubkey as Pubkey

  const listActivePubkeys = (): Pubkey[] =>
    getLnds({ active: true, type: "onchain" }).map((lndAuth) => lndAuth.pubkey as Pubkey)

  const getBalance = async (pubkey?: Pubkey): Promise<Satoshis | OnChainServiceError> => {
    try {
      const lndInstance = pubkey ? getLndFromPubkey({ pubkey }) : lnd
      if (lndInstance instanceof Error) return lndInstance

      const { chain_balance } = await getChainBalance({ lnd: lndInstance })
      return toSats(chain_balance)
    } catch (err) {
      const errDetails = parseLndErrorDetails(err)

      return new OnChainServiceUnavailableError(errDetails)
    }
  }

  const getBalanceAmount = async (
    pubkey?: Pubkey,
  ): Promise<BtcPaymentAmount | OnChainServiceError> => {
    const balance = await getBalance(pubkey)
    if (balance instanceof Error) return balance

    return paymentAmountFromNumber({ amount: balance, currency: WalletCurrency.Btc })
  }

  const getPendingBalance = async (
    pubkey?: Pubkey,
  ): Promise<Satoshis | OnChainServiceError> => {
    try {
      const lndInstance = pubkey ? getLndFromPubkey({ pubkey }) : lnd
      if (lndInstance instanceof Error) return lndInstance

      const { pending_chain_balance } = await getPendingChainBalance({ lnd: lndInstance })
      return toSats(pending_chain_balance)
    } catch (err) {
      const errDetails = parseLndErrorDetails(err)

      return new OnChainServiceUnavailableError(errDetails)
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
      return handleCommonOnChainServiceErrors(err)
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
    LndOnChainAddressIdentifier | OnChainServiceError
  > => {
    try {
      const { address } = await createChainAddress({
        lnd,
        format: "p2wpkh",
      })

      return { address: address as OnChainAddress, pubkey }
    } catch (err) {
      return handleCommonOnChainServiceErrors(err)
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
        utxo_confirmations: 1,
        target_confirmations: targetConfirmations,
      })

      return toSats(fee)
    } catch (err) {
      const errDetails = parseLndErrorDetails(err)
      const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errDetails)
      switch (true) {
        case match(KnownLndErrorDetails.InsufficientFunds):
          return new InsufficientOnChainFundsError()
        case match(KnownLndErrorDetails.DustAmount):
          return new UnexpectedDustAmountError()
        default:
          return handleCommonOnChainServiceErrors(err)
      }
    }
  }

  const payToAddress = async ({
    amount,
    address,
    targetConfirmations,
    description,
  }: PayToAddressArgs): Promise<OnChainTxHash | OnChainServiceError> => {
    try {
      const { id } = await sendToChainAddress({
        lnd,
        address,
        tokens: amount,
        utxo_confirmations: 1,
        target_confirmations: targetConfirmations,
        description,
      })

      return id as OnChainTxHash
    } catch (err) {
      const errDetails = parseLndErrorDetails(err)
      const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errDetails)
      switch (true) {
        case match(KnownLndErrorDetails.InsufficientFunds):
          return new InsufficientOnChainFundsError()
        case match(KnownLndErrorDetails.DustAmount):
          return new UnexpectedDustAmountError()
        case match(KnownLndErrorDetails.CPFPAncestorLimitReached):
          return new CPFPAncestorLimitReachedError()
        default:
          return handleCommonOnChainServiceErrors(err)
      }
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.lnd.onchain",
    fns: {
      listActivePubkeys,
      getBalance,
      getBalanceAmount,
      getPendingBalance,
      listIncomingTransactions,
      lookupOnChainFee,
      createOnChainAddress,
      getOnChainFeeEstimate,
      payToAddress,
    },
  })
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
  const cachedHeight = await LocalCacheService().get<number>({
    key: CacheKeys.BlockHeight,
  })
  if (cachedHeight instanceof Error) return 0
  return cachedHeight
}

const handleCommonOnChainServiceErrors = (err: Error) => {
  const errDetails = parseLndErrorDetails(err)
  const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errDetails)
  switch (true) {
    case match(KnownLndErrorDetails.ConnectionDropped):
    case match(KnownLndErrorDetails.NoConnectionEstablished):
      return new OnChainServiceUnavailableError()
    case match(KnownLndErrorDetails.ConnectionRefused):
      return new OnChainServiceBusyError()
    default:
      return new UnknownOnChainServiceError(msgForUnknown(err))
  }
}

const msgForUnknown = (err: Error) =>
  JSON.stringify({
    parsedLndErrorDetails: parseLndErrorDetails(err),
    detailsFromLnd: err,
  })
