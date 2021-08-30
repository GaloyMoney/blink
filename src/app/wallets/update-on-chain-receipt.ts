import { WalletsRepository } from "@services/mongoose"
import { toSats } from "@domain/bitcoin"
import { OnChainService } from "@services/lnd/onchain-service"
import { PriceService } from "@services/price"
import { NotificationsService } from "@services/notifications"
import { LedgerService } from "@services/ledger"
import { OnChainError, TxFilter, TxDecoder } from "@domain/bitcoin/onchain"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { redlock } from "@core/lock"
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
  const logError = ({ walletId, txId, error }) => {
    logger.error(
      { walletId, txId, error },
      "Could not updateOnChainReceipt from updateOnChainReceiptForWallet",
    )
  }

  for (const tx of onChainTxs) {
    const txId = tx.rawTx.id

    const addresses = tx.rawTx.outs.reduce<OnChainAddress[]>((a, o) => {
      if (o.address) a.push(o.address)
      return a
    }, [])

    const wallets = await walletRepo.findByAddresses(addresses)
    if (wallets instanceof Error) {
      logError({ walletId: null, txId, error: wallets })
      continue
    }

    for (const wallet of wallets) {
      const walletId = wallet.id
      logger.warn({ walletId, txId }, "updating onchain receipt")

      try {
        const result = await updateOnChainReceiptForWallet(wallet, [tx], logger)
        if (result instanceof Error) {
          logError({ walletId, txId, error: result })
        }
      } catch (error) {
        // TODO: handle redlock exceptions with the new return pattern
        logError({ walletId, txId, error })
      }
    }
  }

  return onChainTxs.length
}

export const updateOnChainReceiptForWallet = async (
  wallet: Wallet,
  onChainTxs: SubmittedTransaction[],
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

  const addresses = wallet.onChainAddresses()
  const filter = TxFilter({
    confirmationsGreaterThanOrEqual: ONCHAIN_MIN_CONFIRMATIONS,
    addresses,
  })
  const pendingTxs = filter.apply(onChainTxs)

  const price = await PriceService().getCurrentPrice()
  if (price instanceof Error) {
    return price
  }
  const liabilitiesAccountId = toLiabilitiesAccountId(wallet.id)

  return redlock({ path: wallet.id, logger }, async () => {
    for (const tx of pendingTxs) {
      const recorded = await ledger.isOnChainTxRecorded(liabilitiesAccountId, tx.rawTx.id)
      if (recorded instanceof Error) {
        logger.error({ error: recorded }, "Could not query ledger")
        return recorded
      }

      if (!recorded) {
        for (const { sats, address } of tx.rawTx.outs) {
          if (address !== null && addresses.includes(address)) {
            const fee = toSats(Math.round(sats * wallet.depositFeeRatio))
            const usd = sats * price
            const usdFee = fee * price

            const result = await ledger.receiveOnChainTx({
              liabilitiesAccountId,
              txId: tx.rawTx.id,
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
              txId: tx.rawTx.id,
            })
          }
        }
      }
    }
  })
}
