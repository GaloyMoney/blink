import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"

const MS_PER_HOUR = (60 * 60 * 1000) as MilliSeconds
const MS_PER_DAY = (24 * MS_PER_HOUR) as MilliSeconds
const MS_PER_30_DAYS = (30 * MS_PER_DAY) as MilliSeconds

export const ActivityChecker = ({
  dCConverter,
  getVolumeFn,
  monthlyVolumeThreshold,
}: ActivityCheckerConfig): ActivityChecker => {
  const aboveThreshold = async (wallets: Wallet[]) => {
    const timestamp30DaysAgo = new Date(Date.now() - MS_PER_30_DAYS)

    const volumeCum: TxCentsVolume = {
      outgoingCents: toCents(0),
      incomingCents: toCents(0),
    }

    let incomingCents: UsdCents
    let outgoingCents: UsdCents

    for (const wallet of wallets) {
      const volume = await getVolumeFn({
        timestamp: timestamp30DaysAgo,
        walletId: wallet.id,
      })
      if (volume instanceof Error) return volume

      if (wallet.currency === WalletCurrency.Btc) {
        incomingCents = dCConverter.fromSatsToCents(toSats(volume.incomingBaseAmount))
        outgoingCents = dCConverter.fromSatsToCents(toSats(volume.outgoingBaseAmount))
      } else {
        incomingCents = toCents(volume.incomingBaseAmount)
        outgoingCents = toCents(volume.outgoingBaseAmount)
      }

      volumeCum.incomingCents = toCents(volumeCum.incomingCents + incomingCents)
      volumeCum.outgoingCents = toCents(volumeCum.outgoingCents + outgoingCents)
    }

    return (
      volumeCum.outgoingCents > monthlyVolumeThreshold ||
      volumeCum.incomingCents > monthlyVolumeThreshold
    )
  }

  return {
    aboveThreshold,
  }
}
