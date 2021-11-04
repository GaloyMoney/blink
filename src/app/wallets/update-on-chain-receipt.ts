import { WalletsRepository } from "@services/mongoose"
import { OnChainService } from "@services/lnd/onchain-service"
import { PriceService } from "@services/price"
import { NotificationsService } from "@services/notifications"
import { LedgerService } from "@services/ledger"
import { OnChainError, TxDecoder } from "@domain/bitcoin/onchain"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { DepositFeeCalculator } from "@domain/wallets"
import { LockService } from "@services/lock"
import { ONCHAIN_LOOK_BACK, ONCHAIN_MIN_CONFIRMATIONS, BTC_NETWORK } from "@config/app"

export const updateOnChainReceipt = async ({
  scanDepth = ONCHAIN_LOOK_BACK,
  logger,
}: {
  scanDepth?: number
  logger: Logger
}): Promise<number | ApplicationError> => {
  const onChain = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChain instanceof OnChainError) {
    return onChain
  }

  const onChainTxs = await onChain.getIncomingTransactions(scanDepth)
  if (onChainTxs instanceof OnChainError) {
    return onChainTxs
  }

  const walletRepo = WalletsRepository()
  const logError = ({ walletId, txHash, error }) => {
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
    if (wallets instanceof Error) {
      logError({ walletId: null, txHash, error: wallets })
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

  return onChainTxs.length
}

const processTxForWallet = async (
  wallet: Wallet,
  tx: SubmittedTransaction,
  logger: Logger,
): Promise<void | ApplicationError> => {
  const notifications = NotificationsService(
    logger.child({
      topic: "payment",
      protocol: "onchain",
      transactionType: "receipt",
      onUs: false,
    }),
  )
  const ledger = LedgerService()

  const walletAddresses = wallet.onChainAddresses()

  const usdPerSat = await PriceService().getCurrentPrice()
  if (usdPerSat instanceof Error) return usdPerSat

  const liabilitiesAccountId = toLiabilitiesAccountId(wallet.id)

  const lockService = LockService()
  return lockService.lockWalletId({ walletId: wallet.id, logger }, async () => {
    const recorded = await ledger.isOnChainTxRecorded(
      liabilitiesAccountId,
      tx.rawTx.txHash,
    )
    if (recorded instanceof Error) {
      logger.error({ error: recorded }, "Could not query ledger")
      return recorded
    }

    if (!recorded) {
      for (const { sats, address } of tx.rawTx.outs) {
        if (address !== null && walletAddresses.includes(address)) {
          const fee = DepositFeeCalculator().onChainDepositFee({
            amount: sats,
            ratio: wallet.depositFeeRatio,
          })
          const usd = sats * usdPerSat
          const usdFee = fee * usdPerSat

          const result = await ledger.addOnChainTxReceive({
            liabilitiesAccountId,
            txHash: tx.rawTx.txHash,
            sats,
            fee,
            usd,
            usdFee,
            receivingAddress: address,
          })
          if (result instanceof Error) {
            logger.error({ error: result }, "Could not record onchain tx in ledger")
            return result
          }

          await notifications.onChainTransactionReceived({
            walletId: wallet.id,
            amount: sats,
            txHash: tx.rawTx.txHash,
            usdPerSat,
          })
        }
      }
    }
  })
}
