import { TxDecoder } from "@domain/bitcoin/onchain"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { WithdrawalFeeCalculator } from "@domain/wallets"
import { OnChainService } from "@services/lnd/onchain-service"
import { BTC_NETWORK, getOnChainWalletConfig } from "@config/app"
import { checkedToSats, checkedToTargetConfs, toSats } from "@domain/bitcoin"
import {
  CouldNotFindError,
  LessThanDustThresholdError,
  InsufficientBalanceError,
} from "@domain/errors"
import { LedgerService } from "@services/ledger"

const { dustThreshold } = getOnChainWalletConfig()

export const getOnChainFee = async ({
  wallet,
  amount,
  address,
  targetConfirmations,
}: GetOnChainFeeArgs): Promise<Satoshis | ApplicationError> => {
  const withdrawalFeeCalculator = WithdrawalFeeCalculator()
  const walletsRepo = WalletsRepository()
  const payeeWallet = await walletsRepo.findByAddress(address)

  const isIntraLedger = !(payeeWallet instanceof Error)
  if (isIntraLedger) return withdrawalFeeCalculator.onChainIntraLedgerFee()

  const isError = !(payeeWallet instanceof CouldNotFindError)
  if (isError) return payeeWallet

  if (amount < dustThreshold)
    return new LessThanDustThresholdError(
      `Use lightning to send amounts less than ${dustThreshold}`,
    )

  const balance = await LedgerService().getWalletBalance(wallet.id)
  if (balance instanceof Error) return balance

  // avoids lnd balance sniffing attack
  if (balance < amount) return new InsufficientBalanceError("Balance is too low")

  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const onChainFee = await onChainService.getOnChainFeeEstimate({
    amount,
    address,
    targetConfirmations,
  })
  if (onChainFee instanceof Error) return onChainFee

  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account

  const fee = toSats(account.withdrawFee)

  return withdrawalFeeCalculator.onChainWithdrawalFee({
    onChainFee,
    walletFee: fee,
  })
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
