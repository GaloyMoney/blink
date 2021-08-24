import { WalletsRepository } from "@services/mongoose"
import { toSats } from "@domain/bitcoin"
import { OnChainService } from "@services/lnd/onchain-service"
import { PriceService } from "@services/price"
import { NotificationsService } from "@services/notifications"
import { LedgerService } from "@services/ledger"
import { OnChainError, TxFilter, TxDecoder } from "@domain/bitcoin/onchain"
import { toLiabilitiesAccountId } from "@domain/ledger"

import { redlock } from "@core/lock"

import { LOOK_BACK } from "@core/utils"
import { ONCHAIN_MIN_CONFIRMATIONS, BTC_NETWORK } from "@config/app"

export const updateOnChainReceipt = async (
  walletId: WalletId,
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
  const onChain = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChain instanceof OnChainError) {
    return onChain
  }
  const onChainTxs = await onChain.getIncomingTransactions(LOOK_BACK)

  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof Error) return wallet

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

  return await redlock({ path: wallet.id, logger }, async () => {
    for (const tx of pendingTxs) {
      const recorded = await ledger.isOnChainTxRecorded(liabilitiesAccountId, tx.id)
      if (recorded instanceof Error) {
        logger.error({ error: recorded }, "Could not query ledger")
        return recorded
      }

      if (!recorded) {
        for (const { sats, address } of tx.rawTx.outs) {
          if (addresses.includes(address)) {
            const fee = toSats(Math.round(sats * wallet.depositFeeRatio))
            const usd = sats * price
            const usdFee = fee * price

            const result = await ledger.receiveOnChainTx({
              liabilitiesAccountId,
              txId: tx.id,
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
              walletId: walletId,
              amount: sats,
              txId: tx.id,
            })
          }
        }
      }
    }
  })
}
