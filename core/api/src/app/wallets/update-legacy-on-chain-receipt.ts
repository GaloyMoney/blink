import { addSettledTransaction } from "./add-settled-on-chain-transaction"

import {
  NETWORK,
  ONCHAIN_MIN_CONFIRMATIONS,
  ONCHAIN_SCAN_DEPTH,
  SECS_PER_10_MINS,
} from "@/config"

import { getCurrentPriceAsDisplayPriceRatio } from "@/app/prices"

import { TxDecoder } from "@/domain/bitcoin/onchain"
import { CacheKeys } from "@/domain/cache"
import { paymentAmountFromNumber, WalletCurrency } from "@/domain/shared"
import {
  CouldNotFindWalletFromOnChainAddressError,
  CouldNotFindWalletFromOnChainAddressesError,
} from "@/domain/errors"
import { UsdDisplayCurrency } from "@/domain/fiat"

import { LockService } from "@/services/lock"
import { LedgerService } from "@/services/ledger"
import { RedisCacheService } from "@/services/cache"
import { WalletsRepository } from "@/services/mongoose"
import { LndService } from "@/services/lnd"
import { recordExceptionInCurrentSpan } from "@/services/tracing"

const redisCache = RedisCacheService()

export const updateLegacyOnChainReceipt = async ({
  scanDepth = ONCHAIN_SCAN_DEPTH,
  logger,
}: {
  scanDepth?: ScanDepth
  logger: Logger
}): Promise<number | ApplicationError> => {
  const offChain = LndService()
  if (offChain instanceof Error) {
    return offChain
  }

  const onChainTxs = await offChain.listIncomingOnChainTransactions({
    decoder: TxDecoder(NETWORK),
    scanDepth,
  })
  if (onChainTxs instanceof Error) return onChainTxs

  redisCache.set({
    key: CacheKeys.LastOnChainTransactions,
    value: onChainTxs,
    ttlSecs: SECS_PER_10_MINS,
  })

  const walletRepo = WalletsRepository()
  const logError = ({
    txHash,
    error,
  }: {
    txHash: OnChainTxHash
    error: RepositoryError
  }) => {
    logger.error(
      { txHash, error },
      "Could not updateLegacyOnChainReceipt from updateOnChainReceiptForWallet",
    )
  }

  for (const tx of onChainTxs) {
    if (tx.confirmations < ONCHAIN_MIN_CONFIRMATIONS) continue

    const txHash = tx.rawTx.txHash
    const addresses = tx.uniqueAddresses()
    const wallets = await walletRepo.listByAddresses(addresses)

    if (wallets instanceof CouldNotFindWalletFromOnChainAddressesError) {
      const result = await processTxForHotWallet({ tx, logger })
      if (result instanceof Error) {
        logger.error(
          { txHash, error: result },
          "Could not updateLegacyOnChainReceipt for rebalance tx",
        )
      }
      continue
    }

    if (wallets instanceof Error) {
      logError({ txHash, error: wallets })
      continue
    }

    logger.trace({ txHash }, "updating onchain receipt")

    const briaAddresses = wallets
      .flatMap((wallet) => wallet.onChainAddressIdentifiers)
      .filter((identifier) => !identifier.pubkey)
      .map((identifier) => identifier.address)

    const result = await processTxForWallet({ tx, briaAddresses, logger })
    if (result instanceof Error) {
      logError({ txHash, error: result })
    }
  }

  logger.info(`finish updating onchain receipts with ${onChainTxs.length} transactions`)

  return onChainTxs.length
}

const processTxForWallet = async ({
  tx,
  briaAddresses,
  logger,
}: {
  tx: IncomingOnChainTransaction
  briaAddresses: OnChainAddress[]
  logger: Logger
}): Promise<void | ApplicationError> => {
  for (const { sats, address, vout } of tx.rawTx.outs) {
    if (!address || briaAddresses.includes(address)) continue

    const satoshis = paymentAmountFromNumber({
      amount: sats,
      currency: WalletCurrency.Btc,
    })
    if (satoshis instanceof Error) {
      logger.error({ error: satoshis }, "Invalid amount")
      continue
    }

    const result = await addSettledTransaction({
      txId: tx.rawTx.txHash,
      vout,
      satoshis,
      address,
    })
    if (
      result instanceof Error &&
      !(result instanceof CouldNotFindWalletFromOnChainAddressError)
    ) {
      logger.error({ error: result }, "Error adding settled transaction")
      recordExceptionInCurrentSpan({ error: result })
    }
  }
}

const processTxForHotWallet = async ({
  tx,
  logger,
}: {
  tx: IncomingOnChainTransaction
  logger: Logger
}): Promise<void | ApplicationError> => {
  const ledger = LedgerService()

  const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
    currency: UsdDisplayCurrency,
  })
  if (displayPriceRatio instanceof Error) return displayPriceRatio

  const lockService = LockService()
  return lockService.lockOnChainTxHash(tx.rawTx.txHash, async () => {
    const recorded = await ledger.isToHotWalletTxRecorded(tx.rawTx.txHash)
    if (recorded instanceof Error) {
      logger.error({ error: recorded }, "Could not query ledger")
      return recorded
    }
  })
}
