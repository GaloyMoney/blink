import { getBalanceForWallet } from "@app/wallets"
import { getTwoFALimits, MS_PER_DAY } from "@config"
import { toSats } from "@domain/bitcoin"
import { sub, toCents } from "@domain/fiat"
import { LedgerService } from "@services/ledger"
import { baseLogger } from "@services/logger"

export const getBalanceHelper = async (
  walletId: WalletId,
): Promise<CurrencyBaseAmount> => {
  const balance = await getBalanceForWallet({
    walletId,
    logger: baseLogger,
  })
  if (balance instanceof Error) throw balance
  return balance
}

// TODO: currently assuming a bitcoin wallet
// make it generic
export const getRemainingTwoFALimit = async ({
  walletId,
  satsToCents,
}: {
  walletId: WalletId
  satsToCents
}): Promise<UsdCents> => {
  const timestamp1DayAgo = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await LedgerService().allPaymentVolumeSince({
    walletId,
    timestamp: timestamp1DayAgo,
  })
  if (walletVolume instanceof Error) throw walletVolume

  const twoFALimit = getTwoFALimits().threshold
  const outgoing = toSats(walletVolume.outgoingBaseAmount)

  const remainingLimit = sub(twoFALimit, satsToCents(outgoing))
  if (remainingLimit instanceof Error) throw remainingLimit
  return remainingLimit > 0 ? remainingLimit : toCents(0)
}
