import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_CENTS,
} from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { AccountLimitsType } from "./primitives"

const calc = AmountCalculator()

export const LimitTimeframe = {
  "24h": "24h",
  "30d": "30d",
} as const

export const calculateLimitsInUsd = async ({
  limitTimeframe,
  limitName,
  limitAmount,
  priceRatio,

  walletVolumes,
}: {
  limitTimeframe: LimitTimeframe
  limitName: AccountLimitsType
  limitAmount: UsdPaymentAmount
  priceRatio: WalletPriceRatio
  walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
}): Promise<{
  volumeTotalLimit: UsdPaymentAmount
  volumeUsed: UsdPaymentAmount
  volumeRemaining: UsdPaymentAmount
}> => {
  let volumeInUsdAmount = ZERO_CENTS
  for (const walletVolume of walletVolumes) {
    const outgoingUsdAmount =
      walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
        ? priceRatio.convertFromBtc(walletVolume.outgoingBaseAmount as BtcPaymentAmount)
        : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)

    volumeInUsdAmount = calc.add(volumeInUsdAmount, outgoingUsdAmount)
  }

  addAttributesToCurrentSpan({
    [`txVolume.outgoingInBase.${limitTimeframe}`]: `${volumeInUsdAmount.amount}`,
    [`txVolume.threshold.${limitTimeframe}`]: `${limitAmount.amount}`,
    [`txVolume.limitCheck.${limitTimeframe}`]: limitName,
  })

  return {
    volumeTotalLimit: limitAmount,
    volumeUsed: volumeInUsdAmount,
    volumeRemaining: calc.sub(limitAmount, volumeInUsdAmount),
  }
}

const volumesForLimit =
  ({
    limitTimeframe,
    limitName,
    limitAmount,
    priceRatio,
  }: {
    limitTimeframe: LimitTimeframe
    limitName: AccountLimitsType
    limitAmount: UsdPaymentAmount
    priceRatio: WalletPriceRatio
  }) =>
  async (walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]) =>
    calculateLimitsInUsd({
      limitTimeframe,
      limitName,
      limitAmount,
      priceRatio,

      walletVolumes,
    })

export const AccountLimitsVolumes = ({
  limitTimeframe,
  accountLimits,
  priceRatio,
}: {
  limitTimeframe: LimitTimeframe
  accountLimits: IAccountLimits
  priceRatio: WalletPriceRatio
}): AccountLimitsVolumes => {
  const accountLimitAmounts = {} as IAccountLimitAmounts
  for (const rawKey of Object.keys(accountLimits)) {
    const key = rawKey as TypeLimits
    const amount = accountLimits[key][limitTimeframe]
    const limitAmount = paymentAmountFromNumber({
      amount,
      currency: WalletCurrency.Usd,
    })
    if (limitAmount instanceof Error) return limitAmount
    accountLimitAmounts[key] = limitAmount
  }

  return {
    volumesIntraledger: volumesForLimit({
      limitTimeframe,
      limitName: AccountLimitsType.IntraLedger,
      limitAmount: accountLimitAmounts.intraLedgerLimit,
      priceRatio,
    }),
    volumesWithdrawal: volumesForLimit({
      limitTimeframe,
      limitName: AccountLimitsType.Withdrawal,
      limitAmount: accountLimitAmounts.withdrawalLimit,
      priceRatio,
    }),
    volumesTradeIntraAccount: volumesForLimit({
      limitTimeframe,
      limitName: AccountLimitsType.SelfTrade,
      limitAmount: accountLimitAmounts.tradeIntraAccountLimit,
      priceRatio,
    }),
  }
}
