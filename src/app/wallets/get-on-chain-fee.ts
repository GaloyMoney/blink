import { BTC_NETWORK, getOnChainWalletConfig } from "@config"
import { checkedToSats, checkedToTargetConfs, toSats } from "@domain/bitcoin"
import { TxDecoder } from "@domain/bitcoin/onchain"
import {
  CouldNotFindError,
  InsufficientBalanceError,
  LessThanDustThresholdError,
} from "@domain/errors"
import { checkedToWalletId, WithdrawalFeeCalculator } from "@domain/wallets"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/lnd/onchain-service"
import { WalletsRepository } from "@services/mongoose"
import { addAttributesToCurrentSpan } from "@services/tracing"

const { dustThreshold } = getOnChainWalletConfig()

export const getOnChainFee = async ({
  walletId,
  account,
  amount,
  address,
  targetConfirmations,
}: GetOnChainFeeArgs): Promise<Satoshis | ApplicationError> => {
  const amountChecked = checkedToSats(amount)
  if (amountChecked instanceof Error) return amountChecked

  const targetConfsChecked = checkedToTargetConfs(targetConfirmations)
  if (targetConfsChecked instanceof Error) return targetConfsChecked

  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const walletsRepo = WalletsRepository()
  const wallet = await walletsRepo.findById(walletIdChecked)
  if (wallet instanceof Error) return wallet

  const withdrawFeeCalculator = WithdrawalFeeCalculator()
  const payeeWallet = await walletsRepo.findByAddress(address)

  const isIntraLedger = !(payeeWallet instanceof Error)
  if (isIntraLedger) return withdrawFeeCalculator.onChainIntraLedgerFee()

  const isError = !(payeeWallet instanceof CouldNotFindError)
  if (isError) return payeeWallet

  if (amountChecked < dustThreshold) {
    return new LessThanDustThresholdError(
      `Use lightning to send amounts less than ${dustThreshold}`,
    )
  }

  const balance = await LedgerService().getWalletBalance(wallet.id)
  if (balance instanceof Error) return balance

  // avoids lnd balance sniffing attack
  if (balance < amountChecked) return new InsufficientBalanceError("Balance is too low")

  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const minerFee = await onChainService.getOnChainFeeEstimate({
    amount: amountChecked,
    address,
    targetConfirmations: targetConfsChecked,
  })
  if (minerFee instanceof Error) return minerFee
  addAttributesToCurrentSpan({ "payOnChainByWalletId.estimatedMinerFee": `${minerFee}` })

  const bankFee = toSats(account.withdrawFee)

  return withdrawFeeCalculator.onChainWithdrawalFee({
    minerFee,
    bankFee,
  })
}
