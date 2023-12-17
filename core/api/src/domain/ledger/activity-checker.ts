import { AmountCalculator, WalletCurrency, ZERO_CENTS } from "@/domain/shared"

const MS_PER_HOUR = (60 * 60 * 1000) as MilliSeconds
const MS_PER_DAY = (24 * MS_PER_HOUR) as MilliSeconds
const MS_PER_30_DAYS = (30 * MS_PER_DAY) as MilliSeconds

const calc = AmountCalculator()

export const ActivityChecker = ({
  getVolumeAmountFn,
  monthlyVolumeThreshold,
  priceRatio,
}: ActivityCheckerConfig): ActivityChecker => {
  const aboveThreshold = async (wallets: Wallet[]) => {
    const timestamp30DaysAgo = new Date(Date.now() - MS_PER_30_DAYS)

    const volumeCum = {
      outgoingUsdAmount: ZERO_CENTS,
      incomingUsdAmount: ZERO_CENTS,
    }

    for (const wallet of wallets) {
      const walletVolume = await getVolumeAmountFn({
        timestamp: timestamp30DaysAgo,
        walletDescriptor: wallet,
      })
      if (walletVolume instanceof Error) return walletVolume

      let outgoingUsdAmount = walletVolume.outgoingBaseAmount as UsdPaymentAmount
      let incomingUsdAmount = walletVolume.incomingBaseAmount as UsdPaymentAmount
      if (walletVolume.outgoingBaseAmount.currency === WalletCurrency.Btc) {
        outgoingUsdAmount = priceRatio.convertFromBtc(
          walletVolume.outgoingBaseAmount as BtcPaymentAmount,
        )

        incomingUsdAmount = priceRatio.convertFromBtc(
          walletVolume.incomingBaseAmount as BtcPaymentAmount,
        )
      }

      volumeCum.incomingUsdAmount = calc.add(
        volumeCum.incomingUsdAmount,
        incomingUsdAmount,
      )
      volumeCum.outgoingUsdAmount = calc.add(
        volumeCum.outgoingUsdAmount,
        outgoingUsdAmount,
      )
    }

    return (
      volumeCum.outgoingUsdAmount.amount > monthlyVolumeThreshold ||
      volumeCum.incomingUsdAmount.amount > monthlyVolumeThreshold
    )
  }

  return {
    aboveThreshold,
  }
}
