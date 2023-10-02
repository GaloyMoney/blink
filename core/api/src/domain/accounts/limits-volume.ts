import {
  AmountCalculator,
  paymentAmountFromNumber,
  UsdPaymentAmount,
  WalletCurrency,
  ZERO_CENTS,
} from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { AccountLimitsType } from "./primitives"

const calc = AmountCalculator()

const WalletVolumesAggregator = ({
  walletVolumes,
  priceRatio,
}: {
  walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
  priceRatio: WalletPriceRatio
}) => {
  const outgoingUsdAmount = (): UsdPaymentAmount => {
    let volumeInUsdAmount = ZERO_CENTS
    for (const walletVolume of walletVolumes) {
      const outgoingUsdAmount =
        walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc
          ? priceRatio.convertFromBtc(walletVolume.outgoingBaseAmount as BtcPaymentAmount)
          : (walletVolume.outgoingBaseAmount as UsdPaymentAmount)

      volumeInUsdAmount = calc.add(volumeInUsdAmount, outgoingUsdAmount)
    }

    return volumeInUsdAmount
  }

  return { outgoingUsdAmount }
}

export const AccountTxVolumeRemaining = (
  accountLimits: IAccountLimits,
): IAccountTxVolumeRemaining => {
  const intraLedger = async ({
    priceRatio,
    walletVolumes,
  }: {
    priceRatio: WalletPriceRatio
    walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
  }): Promise<UsdPaymentAmount | ValidationError> => {
    const outgoingUsdVolumeAmount = WalletVolumesAggregator({
      walletVolumes,
      priceRatio,
    }).outgoingUsdAmount()

    const { intraLedgerLimit: limit } = accountLimits
    const limitAmount = paymentAmountFromNumber({
      amount: limit,
      currency: WalletCurrency.Usd,
    })
    if (limitAmount instanceof Error) return limitAmount

    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${outgoingUsdVolumeAmount.amount}`,
      "txVolume.threshold": `${limitAmount.amount}`,
      "txVolume.limitCheck": AccountLimitsType.IntraLedger,
    })

    return calc.sub(limitAmount, outgoingUsdVolumeAmount)
  }

  const withdrawal = async ({
    priceRatio,
    walletVolumes,
  }: {
    priceRatio: WalletPriceRatio
    walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
  }): Promise<UsdPaymentAmount | ValidationError> => {
    const outgoingUsdVolumeAmount = WalletVolumesAggregator({
      walletVolumes,
      priceRatio,
    }).outgoingUsdAmount()

    const { withdrawalLimit: limit } = accountLimits
    const limitAmount = paymentAmountFromNumber({
      amount: limit,
      currency: WalletCurrency.Usd,
    })
    if (limitAmount instanceof Error) return limitAmount

    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${outgoingUsdVolumeAmount.amount}`,
      "txVolume.threshold": `${limitAmount.amount}`,
      "txVolume.limitCheck": AccountLimitsType.Withdrawal,
    })

    return calc.sub(limitAmount, outgoingUsdVolumeAmount)
  }

  const tradeIntraAccount = async ({
    priceRatio,
    walletVolumes,
  }: {
    priceRatio: WalletPriceRatio
    walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
  }): Promise<UsdPaymentAmount | ValidationError> => {
    const outgoingUsdVolumeAmount = WalletVolumesAggregator({
      walletVolumes,
      priceRatio,
    }).outgoingUsdAmount()

    const { tradeIntraAccountLimit: limit } = accountLimits
    const limitAmount = paymentAmountFromNumber({
      amount: limit,
      currency: WalletCurrency.Usd,
    })
    if (limitAmount instanceof Error) return limitAmount

    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${outgoingUsdVolumeAmount.amount}`,
      "txVolume.threshold": `${limitAmount.amount}`,
      "txVolume.limitCheck": AccountLimitsType.SelfTrade,
    })

    return calc.sub(limitAmount, outgoingUsdVolumeAmount)
  }

  return {
    intraLedger,
    withdrawal,
    tradeIntraAccount,
  }
}
