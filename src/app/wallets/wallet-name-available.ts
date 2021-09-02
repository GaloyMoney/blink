import { CouldNotFindError } from "@domain/errors"
import { checkedToWalletName } from "@domain/wallets"
import { WalletsRepository } from "@services/mongoose"

export const walletNameAvailable = async (
  walletName: string,
): Promise<boolean | ApplicationError> => {
  const checkedWalletName = checkedToWalletName(walletName)
  if (checkedWalletName instanceof Error) return checkedWalletName

  const walletsRepo = WalletsRepository()

  const wallet = await walletsRepo.findByWalletName(checkedWalletName)
  if (wallet instanceof CouldNotFindError) return true
  if (wallet instanceof Error) return wallet
  return false
}
