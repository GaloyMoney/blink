import { PartialResult } from "@app/partial-result"
import { getCurrentPrice } from "@app/prices"
import { BTC_NETWORK, ONCHAIN_MIN_CONFIRMATIONS } from "@config"
import { OnChainError, TxDecoder } from "@domain/bitcoin/onchain"
import { WalletTransactionHistory } from "@domain/wallets"
import { OnChainService } from "@services/lnd/onchain-service"
import { baseLogger } from "@services/logger"
import { wrapToRunInSpan } from "@services/tracing"

export const filterTxs = async ({ walletId, addresses, ledgerTransactions, filter }) => {
  const confirmedHistory = WalletTransactionHistory.fromLedger(ledgerTransactions)

  const onChain = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChain instanceof OnChainError) {
    baseLogger.warn({ onChain }, "impossible to create OnChainService")
    return PartialResult.partial(confirmedHistory.transactions, onChain)
  }

  // we are getting both the transactions in the mempool and the transaction that
  // have been mined by not yet credited because they haven't reached enough confirmations
  const onChainTxs = await onChain.listIncomingTransactions(ONCHAIN_MIN_CONFIRMATIONS)
  if (onChainTxs instanceof OnChainError) {
    baseLogger.warn({ onChainTxs }, "impossible to get listIncomingTransactions")
    return PartialResult.partial(confirmedHistory.transactions, onChainTxs)
  }

  const pendingTxs = wrapToRunInSpan({
    namespace: `domain.bitcoin`,
    fn: () => filter.apply(onChainTxs),
  })()

  let price = await getCurrentPrice()
  if (price instanceof Error) {
    price = NaN as DisplayCurrencyPerSat
  }

  return PartialResult.ok(
    confirmedHistory.addPendingIncoming(walletId, pendingTxs, addresses, price)
      .transactions,
  )
}
