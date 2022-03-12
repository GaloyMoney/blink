import { BTC_NETWORK, getFeesConfig, getOnChainWalletConfig } from "@config"
import { checkedToSats, checkedToTargetConfs, toSats } from "@domain/bitcoin"
import { TxDecoder } from "@domain/bitcoin/onchain"
import {
  CouldNotFindError,
  CouldNotFindWalletFromOnChainAddressError,
  InsufficientBalanceError,
  LessThanDustThresholdError,
  UnknownRepositoryError,
} from "@domain/errors"
import { ImbalanceCalculator } from "@domain/ledger/imbalance-calculator"
import {
  checkedToWalletId,
  WithdrawalFeeCalculator,
  WithdrawalFeePriceMethod,
} from "@domain/wallets"
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

  const minBankFee = toSats(account.withdrawFee)

  const withdrawFeeCalculator = WithdrawalFeeCalculator({
    feeRatio: getFeesConfig().withdrawRatio,
    thresholdImbalance: getFeesConfig().withdrawThreshold,
  })

  const payeeWallet = await walletsRepo.findByAddress(address)
  if (payeeWallet instanceof UnknownRepositoryError) return payeeWallet

  const isIntraLedger = !(
    payeeWallet instanceof CouldNotFindWalletFromOnChainAddressError
  )
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

  const imbalanceCalculator = ImbalanceCalculator({
    volumeLightningFn: LedgerService().lightningTxBaseVolumeSince,
    volumeOnChainFn: LedgerService().onChainTxBaseVolumeSince,
    sinceDaysAgo: getFeesConfig().withdrawDaysLookback,
  })

  const fees = await withdrawFeeCalculator.onChainWithdrawalFee({
    minerFee,
    minBankFee,
    method: WithdrawalFeePriceMethod.flat,
    imbalanceCalculatorFn: () => imbalanceCalculator.getSwapOutImbalance(walletId),
  })
  if (fees instanceof Error) return fees
  return fees.totalFee
}
