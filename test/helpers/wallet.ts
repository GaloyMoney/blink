import { Wallets } from "@app"
import { getTwoFALimits, getUserLimits, MS_PER_DAY } from "@config"
import { toSats } from "@domain/bitcoin"
import { LedgerService } from "@services/ledger"
import { baseLogger } from "@services/logger"

export const getBTCBalance = async (walletId: WalletId): Promise<Satoshis> => {
  const balanceSats = await Wallets.getBalanceForWallet({
    walletId,
    logger: baseLogger,
  })
  if (balanceSats instanceof Error) throw balanceSats
  return balanceSats
}

export const getRemainingIntraledgerLimit = async ({
  walletId,
  accountLevel,
}: {
  walletId: WalletId
  accountLevel: AccountLevel
}): Promise<Satoshis | ApplicationError> => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await LedgerService().intraledgerTxVolumeSince({
    walletId,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  const intraledgerLimit = getUserLimits({ level: accountLevel }).onUsLimit
  const remainingLimit = toSats(intraledgerLimit - walletVolume.outgoingSats)
  return remainingLimit > 0 ? remainingLimit : toSats(0)
}

export const getRemainingWithdrawalLimit = async ({
  walletId,
  accountLevel,
}: {
  walletId: WalletId
  accountLevel: AccountLevel
}): Promise<Satoshis | ApplicationError> => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await LedgerService().externalPaymentVolumeSince({
    walletId,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  const withdrawalLimit = getUserLimits({ level: accountLevel }).withdrawalLimit
  const remainingLimit = toSats(withdrawalLimit - walletVolume.outgoingSats)
  return remainingLimit > 0 ? remainingLimit : toSats(0)
}

export const getRemainingTwoFALimit = async (
  walletId,
): Promise<Satoshis | ApplicationError> => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await LedgerService().externalPaymentVolumeSince({
    walletId,
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  const twoFALimit = getTwoFALimits().threshold
  const remainingLimit = toSats(twoFALimit - walletVolume.outgoingSats)
  return remainingLimit > 0 ? remainingLimit : toSats(0)
}
