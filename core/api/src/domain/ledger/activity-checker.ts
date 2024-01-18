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

    let allWalletsVolume = ZERO_CENTS

    for (const wallet of wallets) {
      const walletVolume = await getVolumeAmountFn({
        timestamp: timestamp30DaysAgo,
        walletDescriptor: wallet,
      })
      if (walletVolume instanceof Error) return walletVolume

      let usdAmount = walletVolume as UsdPaymentAmount
      if (walletVolume.currency === WalletCurrency.Btc) {
        usdAmount = priceRatio.convertFromBtc(walletVolume as BtcPaymentAmount)
      }

      allWalletsVolume = calc.add(allWalletsVolume, usdAmount)
    }

    return allWalletsVolume.amount > monthlyVolumeThreshold
  }

  return {
    aboveThreshold,
  }
}
