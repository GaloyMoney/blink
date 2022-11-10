import { getCurrentPrice } from "@app/prices"

import { BTC_NETWORK, getColdStorageConfig, ONCHAIN_SCAN_DEPTH_OUTGOING } from "@config"

import { toSats } from "@domain/bitcoin"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { RebalanceChecker } from "@domain/cold-storage"
import { DisplayCurrencyConverter } from "@domain/fiat/display-currency"

import { LndService } from "@services/lnd"
import { LedgerService } from "@services/ledger"
import { ColdStorageService } from "@services/cold-storage"
import { OnChainService } from "@services/lnd/onchain-service"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { getOffChainBalance } from "../lightning/get-balances"

export const rebalanceToColdWallet = async (): Promise<boolean | ApplicationError> => {
  const coldStorageConfig = getColdStorageConfig()
  const ledgerService = LedgerService()

  const coldStorageService = await ColdStorageService()
  if (coldStorageService instanceof Error) return coldStorageService

  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const offChainService = LndService()
  if (offChainService instanceof Error) return offChainService

  const displayCurrencyPerSat = await getCurrentPrice()
  if (displayCurrencyPerSat instanceof Error) return displayCurrencyPerSat

  // we only need active node onchain balance, otherwise we would not be able to rebalance
  const onChainBalance = await onChainService.getBalance()
  if (onChainBalance instanceof Error) return onChainBalance

  const offChainBalance = await getOffChainBalance()
  if (offChainBalance instanceof Error) return offChainBalance

  const rebalanceAmount = RebalanceChecker(
    coldStorageConfig,
  ).getWithdrawFromHotWalletAmount({
    onChainHotWalletBalance: onChainBalance,
    offChainHotWalletBalance: offChainBalance,
  })

  addAttributesToCurrentSpan({
    "rebalance.offChainBalance": offChainBalance,
    "rebalance.onChainBalance": onChainBalance,
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

  const converter = DisplayCurrencyConverter(displayCurrencyPerSat)
  const amountDisplayCurrency = converter.fromSats(rebalanceAmount)
  const feeDisplayCurrency = converter.fromSats(fee)

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
