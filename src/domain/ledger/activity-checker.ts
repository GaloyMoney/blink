import { toSats } from "@domain/bitcoin"

const MS_PER_HOUR = (60 * 60 * 1000) as MilliSeconds
const MS_PER_DAY = (24 * MS_PER_HOUR) as MilliSeconds
const MS_PER_30_DAYS = (30 * MS_PER_DAY) as MilliSeconds

export const ActivityChecker = ({
  getVolumeFn,
  monthlyVolumeThreshold,
}: ActivityCheckerConfig): ActivityChecker => {
  const aboveThreshold = async (walletIds: WalletId[]) => {
    const timestamp30DaysAgo = new Date(Date.now() - MS_PER_30_DAYS)

    const volumeCum: TxVolume = {
      outgoingSats: toSats(0),
      incomingSats: toSats(0),
    }

    for (const walletId of walletIds) {
      const volume = await getVolumeFn({
        timestamp: timestamp30DaysAgo,
        walletId,
      })
      if (volume instanceof Error) return volume
      volumeCum.incomingSats = toSats(volume.incomingSats + volumeCum.incomingSats)
      volumeCum.outgoingSats = toSats(volume.outgoingSats + volumeCum.outgoingSats)
    }

    return (
      volumeCum.outgoingSats > monthlyVolumeThreshold ||
      volumeCum.incomingSats > monthlyVolumeThreshold
    )
  }

  return {
    aboveThreshold,
  }
}
