import { AmountCalculator, WalletCurrency, ZERO_CENTS } from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

const calc = AmountCalculator()

export const calculateLimitsInUsd = async ({
  limitName,
  limitAmount,
  priceRatio,

  amount,
  walletVolumes,
}: {
  limitName:
    | "checkIntraledger"
    | "checkWithdrawal"
    | "checkTradeIntraAccount"
    | "checkTwoFA"
    | "volumesIntraledger"
    | "volumesWithdrawal"
    | "volumesTradeIntraAccount"
    | "volumesTwoFA"
  limitAmount: UsdPaymentAmount
  priceRatio: PriceRatio
} & LimiterCheckInputs): Promise<{
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
    "txVolume.amountInBase": `${amount.amount}`,
    "txVolume.limitCheck": limitName,
  })

  return {
    volumeTotalLimit: limitAmount,
    volumeUsed: volumeInUsdAmount,
    volumeRemaining: calc.sub(limitAmount, volumeInUsdAmount),
  }
}
