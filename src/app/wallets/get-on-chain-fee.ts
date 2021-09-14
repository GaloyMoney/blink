import { checkedToSats, checkedToTargetConfs } from "@domain/bitcoin"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { WalletsRepository } from "@services/mongoose"
import { OnChainService } from "@services/lnd/onchain-service"
import { BTC_NETWORK, getOnChainWalletConfig } from "@config/app"
import { CouldNotFindError, LessThanDustThresholdError } from "@domain/errors"

const { dustThreshold } = getOnChainWalletConfig()

export const getOnChainFee = async ({
  wallet,
  amount,
  address,
  targetConfirmations,
}: GetOnChainFeeArgs): Promise<Satoshis | ApplicationError> => {
  const walletsRepo = WalletsRepository()
  const payeeWallet = await walletsRepo.findByAddress(address)
  if (payeeWallet instanceof CouldNotFindError) {
    if (amount < dustThreshold) {
      return new LessThanDustThresholdError(
        `Use lightning to send amounts less than ${dustThreshold}`,
      )
    }

    const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
    if (onChainService instanceof Error) return onChainService

    const onChainFee = await onChainService.getOnChainFeeEstimate(
      amount,
      address,
      targetConfirmations,
    )
    if (onChainFee instanceof Error) return onChainFee

    return (onChainFee + wallet.withdrawFee) as Satoshis
  }

  if (payeeWallet instanceof Error) return payeeWallet

  return 0 as Satoshis
}

export const getOnChainFeeByWalletId = async ({
  walletId,
  amount,
  address,
  targetConfirmations,
}: GetOnChainFeeByWalletIdArgs): Promise<Satoshis | ApplicationError> => {
  const sats = checkedToSats(amount)
  if (sats instanceof Error) return sats

  const targetConfs = checkedToTargetConfs(targetConfirmations)
  if (targetConfs instanceof Error) return targetConfs

  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof Error) return wallet

  return getOnChainFee({
    wallet,
    amount: sats,
    address,
    targetConfirmations: targetConfs,
  })
}

export const getOnChainFeeByWalletName = async ({
  walletName,
  amount,
  address,
  targetConfirmations,
}: GetOnChainFeeByWalletNameArgs): Promise<Satoshis | ApplicationError> => {
  const sats = checkedToSats(amount)
  if (sats instanceof Error) return sats

  const targetConfs = checkedToTargetConfs(targetConfirmations)
  if (targetConfs instanceof Error) return targetConfs

  const wallets = WalletsRepository()
  const wallet = await wallets.findByWalletName(walletName)
  if (wallet instanceof Error) return wallet

  return getOnChainFee({
    wallet,
    amount: sats,
    address,
    targetConfirmations: targetConfs,
  })
}
