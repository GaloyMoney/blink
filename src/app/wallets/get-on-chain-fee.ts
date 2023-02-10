import { btcFromUsdMidPriceFn, usdFromBtcMidPriceFn } from "@app/prices"
import { BTC_NETWORK, getOnChainWalletConfig } from "@config"
import { checkedToSats, checkedToTargetConfs, toSats } from "@domain/bitcoin"
import { checkedToOnChainAddress, TxDecoder } from "@domain/bitcoin/onchain"
import { CouldNotFindError } from "@domain/errors"
import { OnChainPaymentFlowBuilder } from "@domain/payments/onchain-payment-flow-builder"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"
import { checkedToWalletId } from "@domain/wallets"
import { DealerPriceService } from "@services/dealer-price"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/lnd/onchain-service"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { validateIsBtcWallet, validateIsUsdWallet } from "./validate"

const { dustThreshold } = getOnChainWalletConfig()
const dealer = DealerPriceService()

const getOnChainFee = async <S extends WalletCurrency, R extends WalletCurrency>({
  walletId,
  account: senderAccount,
  amount,
  address,
  targetConfirmations,
}: GetOnChainFeeArgs): Promise<PaymentAmount<S> | ApplicationError> => {
  const amountChecked = checkedToSats(amount)
  if (amountChecked instanceof Error) return amountChecked

  const targetConfsChecked = checkedToTargetConfs(targetConfirmations)
  if (targetConfsChecked instanceof Error) return targetConfsChecked

  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const walletsRepo = WalletsRepository()
  const senderWallet = await walletsRepo.findById(walletIdChecked)
  if (senderWallet instanceof Error) return senderWallet

  const checkedAddress = checkedToOnChainAddress({
    network: BTC_NETWORK,
    value: address,
  })
  if (checkedAddress instanceof Error) return checkedAddress

  const recipientWallet = await walletsRepo.findByAddress(checkedAddress)
  if (
    recipientWallet instanceof Error &&
    !(recipientWallet instanceof CouldNotFindError)
  ) {
    return recipientWallet
  }

  const isExternalAddress = async () => recipientWallet instanceof CouldNotFindError

  const withSenderBuilder = OnChainPaymentFlowBuilder<S>({
    volumeLightningFn: LedgerService().lightningTxBaseVolumeSince,
    volumeOnChainFn: LedgerService().onChainTxBaseVolumeSince,
    isExternalAddress,
    sendAll: false,
    dustThreshold,
  })
    .withAddress(checkedAddress)
    .withSenderWalletAndAccount({
      wallet: {
        id: senderWallet.id,
        currency: senderWallet.currency as S,
        accountId: senderWallet.accountId,
      },
      account: senderAccount,
    })

  const withConversionArgs = {
    hedgeBuyUsd: {
      usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
      btcFromUsd: dealer.getSatsFromCentsForImmediateBuy,
    },
    hedgeSellUsd: {
      usdFromBtc: dealer.getCentsFromSatsForImmediateSell,
      btcFromUsd: dealer.getSatsFromCentsForImmediateSell,
    },
    mid: { usdFromBtc: usdFromBtcMidPriceFn, btcFromUsd: btcFromUsdMidPriceFn },
  }

  if (await withSenderBuilder.isIntraLedger()) {
    if (recipientWallet instanceof CouldNotFindError) return recipientWallet

    const recipientWalletDescriptor: WalletDescriptor<R> = {
      id: recipientWallet.id,
      currency: recipientWallet.currency as R,
      accountId: recipientWallet.accountId,
    }

    const recipientAccount = await AccountsRepository().findById(
      recipientWallet.accountId,
    )
    if (recipientAccount instanceof Error) return recipientAccount

    const paymentFlow = await withSenderBuilder
      .withRecipientWallet({
        ...recipientWalletDescriptor,
        userId: recipientAccount.kratosUserId,
        username: recipientAccount.username,
      })
      .withAmount(amountChecked)
      .withConversion(withConversionArgs)
      .withoutMinerFee()
    if (paymentFlow instanceof Error) return paymentFlow

    return paymentFlow.protocolAndBankFeeInSenderWalletCurrency()
  }

  const builder = withSenderBuilder
    .withoutRecipientWallet()
    .withAmount(amount)
    .withConversion(withConversionArgs)

  const btcPaymentAmount = await builder.btcProposedAmount()
  if (btcPaymentAmount instanceof Error) return btcPaymentAmount

  const balance = await LedgerService().getWalletBalanceAmount<S>({
    id: senderWallet.id,
    currency: senderWallet.currency as S,
    accountId: senderWallet.accountId,
  })
  if (balance instanceof Error) return balance

  const paymentFlow = await getMinerFeeAndPaymentFlow({
    builder,
    targetConfirmations: targetConfsChecked,
  })
  if (paymentFlow instanceof Error) return paymentFlow
  addAttributesToCurrentSpan({
    "payOnChainByWalletId.estimatedMinerFee": `${paymentFlow.btcMinerFee}`,
  })

  // avoids lnd balance sniffing attack
  const balanceCheck = paymentFlow.checkBalanceForSend(balance)
  if (balanceCheck instanceof Error) return balanceCheck

  return paymentFlow.protocolAndBankFeeInSenderWalletCurrency()
}

export const getMinerFeeAndPaymentFlow = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  builder,
  targetConfirmations,
}: {
  builder: OPFBWithConversion<S, R>
  targetConfirmations: TargetConfirmations
}): Promise<OnChainPaymentFlow<S, R> | ValidationError | DealerPriceServiceError> => {
  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const proposedBtcAmount = await builder.btcProposedAmount()
  if (proposedBtcAmount instanceof Error) return proposedBtcAmount

  const address = await builder.addressForFlow()
  if (address instanceof Error) return address

  const minerFee = await onChainService.getOnChainFeeEstimate({
    amount: toSats(proposedBtcAmount.amount),
    address,
    targetConfirmations,
  })
  if (minerFee instanceof Error) return minerFee
  const minerFeeAmount = paymentAmountFromNumber({
    amount: minerFee,
    currency: WalletCurrency.Btc,
  })
  if (minerFeeAmount instanceof Error) return minerFeeAmount
  return builder.withMinerFee(minerFeeAmount)
}

export const getOnChainFeeForBtcWallet = async <S extends WalletCurrency>(
  args: GetOnChainFeeArgs,
): Promise<PaymentAmount<S> | ApplicationError> => {
  const validated = await validateIsBtcWallet(args.walletId)
  return validated instanceof Error ? validated : getOnChainFee(args)
}

export const getOnChainFeeForUsdWallet = async <S extends WalletCurrency>(
  args: GetOnChainFeeArgs,
): Promise<PaymentAmount<S> | ApplicationError> => {
  const validated = await validateIsUsdWallet(args.walletId)
  return validated instanceof Error ? validated : getOnChainFee(args)
}
