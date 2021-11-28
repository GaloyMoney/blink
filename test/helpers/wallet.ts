import * as Wallets from "@app/wallets"
import { getTwoFALimits, getUserLimits, MS_PER_DAY } from "@config/app"
import { toSats } from "@domain/bitcoin"
import { toLiabilitiesAccountId } from "@domain/ledger"
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
  userLevel,
}: {
  walletId: WalletId
  userLevel: AccountLevel
}): Promise<Satoshis | ApplicationError> => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await LedgerService().intraledgerTxVolumeSince({
    liabilitiesAccountId: toLiabilitiesAccountId(walletId),
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  const intraledgerLimit = getUserLimits({ level: userLevel }).onUsLimit
  const remainingLimit = toSats(intraledgerLimit - walletVolume.outgoingSats)
  return remainingLimit > 0 ? remainingLimit : toSats(0)
}

export const getRemainingWithdrawalLimit = async ({
  walletId,
  userLevel,
}: {
  walletId: WalletId
  userLevel: AccountLevel
}): Promise<Satoshis | ApplicationError> => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await LedgerService().withdrawalTxVolumeSince({
    liabilitiesAccountId: toLiabilitiesAccountId(walletId),
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  const withdrawalLimit = getUserLimits({ level: userLevel }).withdrawalLimit
  const remainingLimit = toSats(withdrawalLimit - walletVolume.outgoingSats)
  return remainingLimit > 0 ? remainingLimit : toSats(0)
}

export const getRemainingTwoFALimit = async (
  walletId,
): Promise<Satoshis | ApplicationError> => {
  const timestamp1Day = new Date(Date.now() - MS_PER_DAY)
  const walletVolume = await LedgerService().withdrawalTxVolumeSince({
    liabilitiesAccountId: toLiabilitiesAccountId(walletId),
    timestamp: timestamp1Day,
  })
  if (walletVolume instanceof Error) return walletVolume

  const twoFALimit = getTwoFALimits().threshold
  const remainingLimit = toSats(twoFALimit - walletVolume.outgoingSats)
  return remainingLimit > 0 ? remainingLimit : toSats(0)
}
