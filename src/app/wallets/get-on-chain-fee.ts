import { TxDecoder } from "@domain/bitcoin/onchain"
import { WalletsRepository } from "@services/mongoose"
import { OnChainService } from "@services/lnd/onchain-service"
import { BTC_NETWORK, getOnChainWalletConfig } from "@config/app"
import { CouldNotFindError, InvalidOnChainAmount } from "@domain/errors"

const { dustThreshold } = getOnChainWalletConfig()

export const getOnChainFee = async (
  wallet: Wallet,
  amount: Satoshis,
  address: OnChainAddress,
): Promise<Satoshis | ApplicationError> => {
  if (amount <= 0) return new InvalidOnChainAmount("Invalid amount")

  const walletsRepo = WalletsRepository()
  const payeeWallet = await walletsRepo.findByAddress(address)
  if (payeeWallet instanceof CouldNotFindError) {
    if (amount < dustThreshold) {
      return new InvalidOnChainAmount(
        `Use lightning to send amounts less than ${dustThreshold}`,
      )
    }

    const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
    if (onChainService instanceof Error) return onChainService

    const onChainFee = await onChainService.getOnChainFeeEstimate(amount, address)
    if (onChainFee instanceof Error) return onChainFee

    return (onChainFee + wallet.withdrawFee) as Satoshis
  }

  if (payeeWallet instanceof Error) return payeeWallet

  return 0 as Satoshis
}

export const getOnChainFeeByWalletId = async (
  walletId: WalletId,
  amount: Satoshis,
  address: OnChainAddress,
): Promise<Satoshis | ApplicationError> => {
  const wallets = WalletsRepository()

  const wallet = await wallets.findById(walletId)
  if (wallet instanceof Error) return wallet

  return getOnChainFee(wallet, amount, address)
}

export const getOnChainFeeByWalletName = async (
  walletName: WalletName,
  amount: Satoshis,
  address: OnChainAddress,
): Promise<Satoshis | ApplicationError> => {
  const wallets = WalletsRepository()

  const wallet = await wallets.findByWalletName(walletName)
  if (wallet instanceof Error) return wallet

  return getOnChainFee(wallet, amount, address)
}
