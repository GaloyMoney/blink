import { timestampDaysAgo } from "@utils"

import { TxVolumeAmountSinceFactory } from "../volume"

const VolumesForAccountWalletsFactory = () => {
  const create =
    (txnGroup: TxnGroup) =>
    async ({
      accountWalletDescriptors,
      period,
    }: {
      accountWalletDescriptors: AccountWalletDescriptors
      period: Days
    }): Promise<TxBaseVolumeAmount<WalletCurrency>[] | ApplicationError> => {
      const timestamp1Day = timestampDaysAgo(period)
      if (timestamp1Day instanceof Error) return timestamp1Day

      const volumeAmountSince = TxVolumeAmountSinceFactory().create(txnGroup)

      const btcWalletVolumeAmount = await volumeAmountSince({
        walletDescriptor: accountWalletDescriptors.BTC,
        timestamp: timestamp1Day,
      })
      if (btcWalletVolumeAmount instanceof Error) return btcWalletVolumeAmount

      const usdWalletVolumeAmount = await volumeAmountSince({
        walletDescriptor: accountWalletDescriptors.USD,
        timestamp: timestamp1Day,
      })
      if (usdWalletVolumeAmount instanceof Error) return usdWalletVolumeAmount

      return [btcWalletVolumeAmount, usdWalletVolumeAmount]
    }

  return { create }
}

const volumesFactory = VolumesForAccountWalletsFactory()

export const externalPaymentVolumeAmountForAccountSince = volumesFactory.create(
  "externalPaymentVolumeSince",
)

export const intraledgerTxBaseVolumeAmountForAccountSince = volumesFactory.create(
  "intraledgerTxBaseVolumeSince",
)

export const tradeIntraAccountTxBaseVolumeAmountForAccountSince = volumesFactory.create(
  "tradeIntraAccountTxBaseVolumeSince",
)
