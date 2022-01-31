import { getCurrentPrice } from "@app/prices"
import { BTC_NETWORK, getColdStorageConfig, ONCHAIN_SCAN_DEPTH_OUTGOING } from "@config"
import { toSats } from "@domain/bitcoin"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { RebalanceChecker } from "@domain/cold-storage"
import { DisplayCurrencyConversionRate } from "@domain/fiat/display-currency"
import { ColdStorageService } from "@services/cold-storage"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/lnd/onchain-service"
import { lndsBalances } from "@services/lnd/utils"
import { addAttributesToCurrentSpan } from "@services/tracing"

export const rebalanceToColdWallet = async (): Promise<boolean | ApplicationError> => {
  const coldStorageConfig = getColdStorageConfig()
  const ledgerService = LedgerService()

  const coldStorageService = await ColdStorageService()
  if (coldStorageService instanceof Error) return coldStorageService

  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const usdPerSat = await getCurrentPrice()
  if (usdPerSat instanceof Error) return usdPerSat

  const { offChain, onChain } = await lndsBalances()

  const rebalanceAmount = RebalanceChecker(
    coldStorageConfig,
  ).getWithdrawFromHotWalletAmount({
    onChainHotWalletBalance: onChain,
    offChainHotWalletBalance: offChain,
  })

  addAttributesToCurrentSpan({
    "rebalance.offChainBalance": offChain,
    "rebalance.onChainBalance": onChain,
    "rebalance.amount": rebalanceAmount,
  })

  if (rebalanceAmount <= 0) return false

  const address = await coldStorageService.createOnChainAddress()
  if (address instanceof Error) return address

  const txHash = await onChainService.payToAddress({
    address,
    amount: rebalanceAmount,
    targetConfirmations: coldStorageConfig.targetConfirmations,
  })
  if (txHash instanceof Error) return txHash

  let fee = await onChainService.lookupOnChainFee({
    txHash,
    scanDepth: ONCHAIN_SCAN_DEPTH_OUTGOING,
  })

  if (fee instanceof Error) fee = toSats(0)

  const description = `deposit of ${rebalanceAmount} sats to the cold storage wallet`

  const amountDisplayCurrency = DisplayCurrencyConversionRate(usdPerSat)(rebalanceAmount)
  const feeDisplayCurrency = DisplayCurrencyConversionRate(usdPerSat)(fee)

  const journal = await ledgerService.addColdStorageTxReceive({
    txHash,
    description,
    sats: rebalanceAmount,
    fee,
    amountDisplayCurrency,
    feeDisplayCurrency,
    payeeAddress: address,
  })

  if (journal instanceof Error) return journal

  return true
}
