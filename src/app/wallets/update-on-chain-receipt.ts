import {
  BTC_NETWORK,
  ONCHAIN_MIN_CONFIRMATIONS,
  ONCHAIN_SCAN_DEPTH,
  SECS_PER_10_MINS,
} from "@config"

import { getCurrentPriceAsDisplayPriceRatio } from "@app/prices"

import { toSats } from "@domain/bitcoin"
import { OnChainError, TxDecoder } from "@domain/bitcoin/onchain"
import { CacheKeys } from "@domain/cache"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"
import { CouldNotFindWalletFromOnChainAddressesError } from "@domain/errors"
import { DisplayCurrency } from "@domain/fiat"

import { RedisCacheService } from "@services/cache"
import { ColdStorageService } from "@services/cold-storage"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/lnd/onchain-service"
import { LockService } from "@services/lock"
import { WalletsRepository } from "@services/mongoose"

import { addSettledTransaction } from "./add-settled-on-chain-transaction"

const redisCache = RedisCacheService()

export const updateOnChainReceipt = async ({
  scanDepth = ONCHAIN_SCAN_DEPTH,
  logger,
}: {
  scanDepth?: ScanDepth
  logger: Logger
}): Promise<number | ApplicationError> => {
  const onChain = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChain instanceof OnChainError) {
    return onChain
  }

  const onChainTxs = await onChain.listIncomingTransactions(scanDepth)
  if (onChainTxs instanceof Error) return onChainTxs

  redisCache.set({
    key: CacheKeys.LastOnChainTransactions,
    value: onChainTxs,
    ttlSecs: SECS_PER_10_MINS,
  })

  const walletRepo = WalletsRepository()
  const logError = ({
    walletId,
    txHash,
    error,
  }: {
    walletId: WalletId | undefined
    txHash: OnChainTxHash
    error: RepositoryError
  }) => {
    logger.error(
      { walletId, txHash, error },
      "Could not updateOnChainReceipt from updateOnChainReceiptForWallet",
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
          "Could not updateOnChainReceipt for rebalance tx",
        )
      }
      continue
    }

    if (wallets instanceof Error) {
      logError({ walletId: undefined, txHash, error: wallets })
      continue
    }

    for (const wallet of wallets) {
      const walletId = wallet.id
      logger.trace({ walletId, txHash }, "updating onchain receipt")

      const result = await processTxForWallet({ tx, logger })
      if (result instanceof Error) {
        logError({ walletId, txHash, error: result })
      }
    }
  }

  logger.info(`finish updating onchain receipts with ${onChainTxs.length} transactions`)

  return onChainTxs.length
}

const processTxForWallet = async ({
  tx,
  logger,
}: {
  tx: IncomingOnChainTransaction
  logger: Logger
}): Promise<void | ApplicationError> => {
  for (const { sats, address, vout } of tx.rawTx.outs) {
    const satoshis = paymentAmountFromNumber({
      amount: sats,
      currency: WalletCurrency.Btc,
    })
    if (satoshis instanceof Error) {
      logger.error({ error: satoshis }, "")
      continue
    }

    if (address === null) continue

    await addSettledTransaction({
      txId: tx.rawTx.txHash,
      vout,
      satoshis,
      address,
    })
  }
}

const processTxForHotWallet = async ({
  tx,
  logger,
}: {
  tx: IncomingOnChainTransaction
  logger: Logger
}): Promise<void | ApplicationError> => {
  const coldStorageService = await ColdStorageService()
  if (coldStorageService instanceof Error) return coldStorageService

  const isFromColdStorage = await coldStorageService.isWithdrawalTransaction(
    tx.rawTx.txHash,
  )
  if (isFromColdStorage instanceof Error) return isFromColdStorage

  if (!isFromColdStorage) return

  const ledger = LedgerService()

  const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
    currency: DisplayCurrency.Usd,
  })
  if (displayPriceRatio instanceof Error) return displayPriceRatio

  const lockService = LockService()
  return lockService.lockOnChainTxHash(tx.rawTx.txHash, async () => {
    const recorded = await ledger.isToHotWalletTxRecorded(tx.rawTx.txHash)
    if (recorded instanceof Error) {
      logger.error({ error: recorded }, "Could not query ledger")
      return recorded
    }

    if (recorded) return

    for (const { sats, address } of tx.rawTx.outs) {
      const satsAmount = paymentAmountFromNumber({
        amount: sats,
        currency: WalletCurrency.Btc,
      })
      if (satsAmount instanceof Error) return satsAmount

      if (address) {
        const isColdStorageAddress = await coldStorageService.isDerivedAddress(address)
        if (isColdStorageAddress instanceof Error || isColdStorageAddress) continue

        // we can't trust the lnd decoded tx fee because it sets the fee to zero when it's a deposit
        let fee =
          tx.fee || (await coldStorageService.lookupTransactionFee(tx.rawTx.txHash))

        if (fee instanceof Error) fee = toSats(0)
        const feeAmount = paymentAmountFromNumber({
          amount: fee,
          currency: WalletCurrency.Btc,
        })
        if (feeAmount instanceof Error) return feeAmount

        const amountDisplayCurrencyAmount =
          displayPriceRatio.convertFromWallet(satsAmount)
        const feeDisplayCurrencyAmount = displayPriceRatio.convertFromWallet(feeAmount)

        const description = `deposit to hot wallet of ${sats} sats from the cold storage wallet`

        const journal = await ledger.addColdStorageTxSend({
          txHash: tx.rawTx.txHash,
          description,
          sats,
          fee,
          amountDisplayCurrency: amountDisplayCurrencyAmount,
          feeDisplayCurrency: feeDisplayCurrencyAmount,
          payeeAddress: address,
        })

        if (journal instanceof Error) {
          logger.error({ error: journal }, "Could not record to hot wallet tx in ledger")
        }
      }
    }
  })
}
