import { getBalanceForWallet } from "@app/wallets"
import { getTwoFALimits, MS_PER_DAY } from "@config"
import { toSats } from "@domain/bitcoin"
import { sub, toCents } from "@domain/fiat"
import { LedgerService } from "@services/ledger"
import { baseLogger } from "@services/logger"

export const getBTCBalance = async (walletId: WalletId): Promise<Satoshis> => {
  const balanceSats = await getBalanceForWallet({
    walletId,
    logger: baseLogger,
  })
  if (balanceSats instanceof Error) throw balanceSats
  return balanceSats
}

// TODO: currently assuming a bitcoin wallet
// make it generic
export const getRemainingTwoFALimit = async ({
  walletId,
  dCConverter,
}: {
  walletId: WalletId
  dCConverter: DisplayCurrencyConverter
}): Promise<UsdCents> => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await LedgerService().allPaymentVolumeSince({
    walletId,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) throw walletVolume

  const twoFALimit = getTwoFALimits().threshold
  const outgoing = toSats(walletVolume.outgoingBaseAmount)

  const remainingLimit = sub(twoFALimit, dCConverter.fromSatsToCents(outgoing))
  return remainingLimit > 0 ? remainingLimit : toCents(0)
}
