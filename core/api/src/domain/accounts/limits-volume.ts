import { AccountLimitsType } from "./primitives"

import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_CENTS,
} from "@/domain/shared"
import { addAttributesToCurrentSpan } from "@/services/tracing"

const calc = AmountCalculator()

const WalletVolumesAggregator = ({
  walletVolumes,
  priceRatio,
}: {
  walletVolumes: PaymentAmount<WalletCurrency>[]
  priceRatio: WalletPriceRatio
}) => {
  const aggregate = (): UsdPaymentAmount => {
    let volumeInUsdAmount = ZERO_CENTS
    for (const walletVolume of walletVolumes) {
      const usdAmount =
        walletVolume.currency === WalletCurrency.Btc
          ? priceRatio.convertFromBtc(walletVolume as BtcPaymentAmount)
          : (walletVolume as UsdPaymentAmount)

      volumeInUsdAmount = calc.add(volumeInUsdAmount, usdAmount)
    }

    return volumeInUsdAmount
  }

  return { aggregate }
}

export const AccountTxVolumeRemaining = (
  accountLimits: IAccountLimits,
): IAccountTxVolumeRemaining => {
  const intraLedger = async ({
    priceRatio,
    outWalletVolumes,
  }: {
    priceRatio: WalletPriceRatio
    outWalletVolumes: PaymentAmount<WalletCurrency>[]
  }): Promise<UsdPaymentAmount | ValidationError> => {
    const { intraLedgerLimit: limit } = accountLimits
    const limitAmount = paymentAmountFromNumber({
      amount: limit,
      currency: WalletCurrency.Usd,
    })
    if (limitAmount instanceof Error) return limitAmount

    const outUsdVolumeAmount = WalletVolumesAggregator({
      walletVolumes: outWalletVolumes,
      priceRatio,
    }).aggregate()

    addAttributesToCurrentSpan({
      "txVolume.inUsd": `${outUsdVolumeAmount.amount}`,
      "txVolume.threshold": `${limitAmount.amount}`,
      "txVolume.limitCheck": AccountLimitsType.IntraLedger,
    })

    const volumeRemaining = calc.sub(limitAmount, outUsdVolumeAmount)
    return calc.max(ZERO_CENTS, volumeRemaining)
  }

  const withdrawal = async ({
    priceRatio,
    netOutWalletVolumes,
  }: {
    priceRatio: WalletPriceRatio
    netOutWalletVolumes: PaymentAmount<WalletCurrency>[]
  }): Promise<UsdPaymentAmount | ValidationError> => {
    const { withdrawalLimit: limit } = accountLimits
    const limitAmount = paymentAmountFromNumber({
      amount: limit,
      currency: WalletCurrency.Usd,
    })
    if (limitAmount instanceof Error) return limitAmount

    const netUsdVolumeAmount = WalletVolumesAggregator({
      walletVolumes: netOutWalletVolumes,
      priceRatio,
    }).aggregate()

    addAttributesToCurrentSpan({
      "txVolume.inUsd": `${netUsdVolumeAmount.amount}`,
      "txVolume.threshold": `${limitAmount.amount}`,
      "txVolume.limitCheck": AccountLimitsType.Withdrawal,
    })

    const volumeRemaining = calc.sub(limitAmount, netUsdVolumeAmount)
    return calc.max(ZERO_CENTS, volumeRemaining)
  }

  const tradeIntraAccount = async ({
    priceRatio,
    outWalletVolumes,
  }: {
    priceRatio: WalletPriceRatio
    outWalletVolumes: PaymentAmount<WalletCurrency>[]
  }): Promise<UsdPaymentAmount | ValidationError> => {
    const { tradeIntraAccountLimit: limit } = accountLimits
    const limitAmount = paymentAmountFromNumber({
      amount: limit,
      currency: WalletCurrency.Usd,
    })
    if (limitAmount instanceof Error) return limitAmount

    const outUsdVolumeAmount = WalletVolumesAggregator({
      walletVolumes: outWalletVolumes,
      priceRatio,
    }).aggregate()

    addAttributesToCurrentSpan({
      "txVolume.inUsd": `${outUsdVolumeAmount.amount}`,
      "txVolume.threshold": `${limitAmount.amount}`,
      "txVolume.limitCheck": AccountLimitsType.SelfTrade,
    })

    const rawVolumeRemaining = calc.sub(limitAmount, outUsdVolumeAmount)
    return calc.max(ZERO_CENTS, rawVolumeRemaining)
  }

  return {
    intraLedger,
    withdrawal,
    tradeIntraAccount,
  }
}
