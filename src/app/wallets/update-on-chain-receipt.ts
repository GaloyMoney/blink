import {
  ONCHAIN_SCAN_DEPTH,
  ONCHAIN_MIN_CONFIRMATIONS,
  BTC_NETWORK,
  SECS_PER_10_MINS,
} from "@config"

import { getCurrentPrice } from "@app/prices"

import { toSats } from "@domain/bitcoin"
import { CacheKeys } from "@domain/cache"
import { DisplayCurrency } from "@domain/fiat"
import { DepositFeeCalculator } from "@domain/wallets"
import { OnChainError, TxDecoder } from "@domain/bitcoin/onchain"
import { DisplayCurrencyConverter } from "@domain/fiat/display-currency"
import { CouldNotFindWalletFromOnChainAddressesError } from "@domain/errors"

import { LockService } from "@services/lock"
import { LedgerService } from "@services/ledger"
import { RedisCacheService } from "@services/cache"
import { ColdStorageService } from "@services/cold-storage"
import { OnChainService } from "@services/lnd/onchain-service"
import { NotificationsService } from "@services/notifications"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"

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

      const result = await processTxForWallet(wallet, tx, logger)
      if (result instanceof Error) {
        logError({ walletId, txHash, error: result })
      }
    }
  }

  logger.info(`finish updating onchain receipts with ${onChainTxs.length} transactions`)

  return onChainTxs.length
}

const processTxForWallet = async (
  wallet: Wallet,
  tx: IncomingOnChainTransaction,
  logger: Logger,
): Promise<void | ApplicationError> => {
  const notifications = NotificationsService()
  const ledger = LedgerService()

  const walletAddresses = wallet.onChainAddresses()

  const displayCurrencyPerSat = await getCurrentPrice()
  if (displayCurrencyPerSat instanceof Error) return displayCurrencyPerSat

  const lockService = LockService()
  return lockService.lockOnChainTxHash(tx.rawTx.txHash, async () => {
    const recorded = await ledger.isOnChainTxRecorded({
      walletId: wallet.id,
      txHash: tx.rawTx.txHash,
    })
    if (recorded instanceof Error) {
      logger.error({ error: recorded }, "Could not query ledger")
      return recorded
    }

    const account = await AccountsRepository().findById(wallet.accountId)
    if (account instanceof Error) return account

    if (!recorded) {
      for (const { sats, address } of tx.rawTx.outs) {
        if (address !== null && walletAddresses.includes(address)) {
          const fee = DepositFeeCalculator().onChainDepositFee({
            amount: sats,
            ratio: account.depositFeeRatio,
          })

          const converter = DisplayCurrencyConverter(displayCurrencyPerSat)
          const amountDisplayCurrency = converter.fromSats(sats)
          const feeDisplayCurrency = converter.fromSats(fee)

          const result = await ledger.addOnChainTxReceive({
            walletId: wallet.id,
            walletCurrency: wallet.currency,
            txHash: tx.rawTx.txHash,
            sats,
            fee,
            amountDisplayCurrency,
            feeDisplayCurrency,
            receivingAddress: address,
          })
          if (result instanceof Error) {
            logger.error({ error: result }, "Could not record onchain tx in ledger")
            return result
          }

          const recipientAccount = await AccountsRepository().findById(wallet.accountId)
          if (recipientAccount instanceof Error) return recipientAccount

          const recipientUser = await UsersRepository().findById(recipientAccount.ownerId)
          if (recipientUser instanceof Error) return recipientUser

          await notifications.onChainTxReceived({
            recipientAccountId: wallet.accountId,
            recipientWalletId: wallet.id,
            paymentAmount: { amount: BigInt(sats), currency: wallet.currency },
            displayPaymentAmount: {
              amount: amountDisplayCurrency,
              currency: DisplayCurrency.Usd,
            },
            txHash: tx.rawTx.txHash,
            recipientDeviceTokens: recipientUser.deviceTokens,
            recipientLanguage: recipientUser.language,
          })
        }
      }
    }
  })
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

  const displayCurrencyPerSat = await getCurrentPrice()
  if (displayCurrencyPerSat instanceof Error) return displayCurrencyPerSat

  const lockService = LockService()
  return lockService.lockOnChainTxHash(tx.rawTx.txHash, async () => {
    const recorded = await ledger.isToHotWalletTxRecorded(tx.rawTx.txHash)
    if (recorded instanceof Error) {
      logger.error({ error: recorded }, "Could not query ledger")
      return recorded
    }

    if (recorded) return

    for (const { sats, address } of tx.rawTx.outs) {
      if (address) {
        const isColdStorageAddress = await coldStorageService.isDerivedAddress(address)
        if (isColdStorageAddress instanceof Error || isColdStorageAddress) continue

        // we can't trust the lnd decoded tx fee because it sets the fee to zero when it's a deposit
        let fee =
          tx.fee || (await coldStorageService.lookupTransactionFee(tx.rawTx.txHash))

        if (fee instanceof Error) fee = toSats(0)

        const converter = DisplayCurrencyConverter(displayCurrencyPerSat)
        const amountDisplayCurrency = converter.fromSats(sats)
        const feeDisplayCurrency = converter.fromSats(fee)

        const description = `deposit to hot wallet of ${sats} sats from the cold storage wallet`

        const journal = await ledger.addColdStorageTxSend({
          txHash: tx.rawTx.txHash,
          description,
          sats,
          fee,
          amountDisplayCurrency,
          feeDisplayCurrency,
          payeeAddress: address,
        })

        if (journal instanceof Error) {
          logger.error({ error: journal }, "Could not record to hot wallet tx in ledger")
        }
      }
    }
  })
}
