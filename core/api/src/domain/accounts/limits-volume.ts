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

  const incomingUsdAmount = (): UsdPaymentAmount => {
    let volumeInUsdAmount = ZERO_CENTS
    for (const walletVolume of walletVolumes) {
      const incomingUsdAmount =
        walletVolume.incomingBaseAmount.currency === WalletCurrency.Btc
          ? priceRatio.convertFromBtc(walletVolume.incomingBaseAmount as BtcPaymentAmount)
          : (walletVolume.incomingBaseAmount as UsdPaymentAmount)

      volumeInUsdAmount = calc.add(volumeInUsdAmount, incomingUsdAmount)
    }

    return volumeInUsdAmount
  }

  return { outgoingUsdAmount, incomingUsdAmount }
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

    const rawVolumeRemaining = calc.sub(limitAmount, outgoingUsdVolumeAmount)
    return calc.max(ZERO_CENTS, rawVolumeRemaining)
  }

  const withdrawal = async ({
    priceRatio,
    walletVolumes,
  }: {
    priceRatio: WalletPriceRatio
    walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
  }): Promise<UsdPaymentAmount | ValidationError> => {
    const aggregator = WalletVolumesAggregator({
      walletVolumes,
      priceRatio,
    })

    const outgoingUsdVolumeAmount = aggregator.outgoingUsdAmount()
    const incomingUsdVolumeAmount = aggregator.incomingUsdAmount()

    const { withdrawalLimit: limit } = accountLimits
    const limitAmount = paymentAmountFromNumber({
      amount: limit,
      currency: WalletCurrency.Usd,
    })
    if (limitAmount instanceof Error) return limitAmount

    addAttributesToCurrentSpan({
      "txVolume.outgoingInBase": `${outgoingUsdVolumeAmount.amount}`,
      "txVolume.incomingInBase": `${incomingUsdVolumeAmount.amount}`,
      "txVolume.threshold": `${limitAmount.amount}`,
      "txVolume.limitCheck": AccountLimitsType.Withdrawal,
    })

    const netVolumeAmount = calc.sub(outgoingUsdVolumeAmount, incomingUsdVolumeAmount)
    const rawVolumeRemaining = calc.sub(limitAmount, netVolumeAmount)
    return calc.max(ZERO_CENTS, rawVolumeRemaining)
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

    const rawVolumeRemaining = calc.sub(limitAmount, outgoingUsdVolumeAmount)
    return calc.max(ZERO_CENTS, rawVolumeRemaining)
  }

  return {
    intraLedger,
    withdrawal,
    tradeIntraAccount,
  }
}
