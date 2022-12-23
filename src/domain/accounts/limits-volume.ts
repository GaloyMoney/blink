import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_CENTS,
} from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { AccountLimitsType } from "./primitives"

const calc = AmountCalculator()

export const calculateLimitsInUsd = async ({
  limitName,
  limitAmount,
  priceRatio,

  walletVolumes,
}: {
  limitName: AccountLimitsType
  limitAmount: UsdPaymentAmount
  priceRatio: PriceRatio
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
        ? await priceRatio.convertFromBtc(
            walletVolume.outgoingBaseAmount as BtcPaymentAmount,
          )
        : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)

    volumeInUsdAmount = calc.add(volumeInUsdAmount, outgoingUsdAmount)
  }

  addAttributesToCurrentSpan({
    "txVolume.outgoingInBase": `${volumeInUsdAmount.amount}`,
    "txVolume.threshold": `${limitAmount.amount}`,
    "txVolume.limitCheck": limitName,
  })

  return {
    volumeTotalLimit: limitAmount,
    volumeUsed: volumeInUsdAmount,
    volumeRemaining: calc.sub(limitAmount, volumeInUsdAmount),
  }
}

const volumesForLimit =
  ({
    limitName,
    limitAmount,
    priceRatio,
  }: {
    limitName: AccountLimitsType
    limitAmount: UsdPaymentAmount
    priceRatio: PriceRatio
  }) =>
  async (walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]) =>
    calculateLimitsInUsd({
      limitName,
      limitAmount,
      priceRatio,

      walletVolumes,
    })

export const AccountLimitsVolumes = ({
  accountLimits,
  priceRatio,
}: {
  accountLimits: IAccountLimits
  priceRatio: PriceRatio
}): AccountLimitsVolumes => {
  const accountLimitAmounts = {} as IAccountLimitAmounts
  for (const rawKey of Object.keys(accountLimits)) {
    const key = rawKey as keyof IAccountLimits
    const limitAmount = paymentAmountFromNumber({
      amount: accountLimits[key],
      currency: WalletCurrency.Usd,
    })
    if (limitAmount instanceof Error) return limitAmount
    accountLimitAmounts[key] = limitAmount
  }

  return {
    volumesIntraledger: volumesForLimit({
      limitName: AccountLimitsType.IntraLedger,
      limitAmount: accountLimitAmounts.intraLedgerLimit,
      priceRatio,
    }),
    volumesWithdrawal: volumesForLimit({
      limitName: AccountLimitsType.Withdrawal,
      limitAmount: accountLimitAmounts.withdrawalLimit,
      priceRatio,
    }),
    volumesTradeIntraAccount: volumesForLimit({
      limitName: AccountLimitsType.SelfTrade,
      limitAmount: accountLimitAmounts.tradeIntraAccountLimit,
      priceRatio,
    }),
  }
}
