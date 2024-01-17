import * as Lightning from "../lightning/get-balances"

import { getColdStorageConfig } from "@/config"

import { getCurrentPriceAsDisplayPriceRatio } from "@/app/prices"

import { toSats } from "@/domain/bitcoin"
import { UsdDisplayCurrency } from "@/domain/fiat"
import { RebalanceChecker } from "@/domain/bitcoin/onchain"
import { paymentAmountFromNumber, WalletCurrency } from "@/domain/shared"

import { LndService } from "@/services/lnd"
import { OnChainService } from "@/services/bria"
import { addAttributesToCurrentSpan } from "@/services/tracing"

export const rebalanceToColdWallet = async (): Promise<boolean | ApplicationError> => {
  const coldStorageConfig = getColdStorageConfig()

  const onChainService = OnChainService()

  const offChainService = LndService()
  if (offChainService instanceof Error) return offChainService

  const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
    currency: UsdDisplayCurrency,
  })
  if (displayPriceRatio instanceof Error) return displayPriceRatio

  const onChainBalance = await onChainService.getHotBalance()
  if (onChainBalance instanceof Error) return onChainBalance

  const offChainBalance = await Lightning.getTotalBalance()
  if (offChainBalance instanceof Error) return offChainBalance

  const rebalanceAmount = RebalanceChecker(
    coldStorageConfig,
  ).getWithdrawFromHotWalletAmount({
    onChainHotWalletBalance: toSats(onChainBalance.amount),
    offChainHotWalletBalance: offChainBalance,
  })

  addAttributesToCurrentSpan({
    "rebalance.offChainBalance": offChainBalance,
    "rebalance.onChainBalance": toSats(onChainBalance.amount),
    "rebalance.amount": rebalanceAmount,
  })

  if (rebalanceAmount <= 0) return false

  const amount = paymentAmountFromNumber({
    amount: rebalanceAmount,
    currency: WalletCurrency.Btc,
  })
  if (amount instanceof Error) return amount

  const payoutId = await onChainService.rebalanceToColdWallet(amount)
  if (payoutId instanceof Error) return payoutId

  return true
}
