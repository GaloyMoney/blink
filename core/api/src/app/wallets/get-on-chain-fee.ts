import { validateIsBtcWallet, validateIsUsdWallet } from "./validate"

import { btcFromUsdMidPriceFn, usdFromBtcMidPriceFn } from "@/app/prices"

import { getOnChainWalletConfig, NETWORK } from "@/config"

import { checkedToOnChainAddress, PayoutSpeed } from "@/domain/bitcoin/onchain"
import { CouldNotFindError } from "@/domain/errors"
import { OnChainPaymentFlowBuilder } from "@/domain/payments/onchain-payment-flow-builder"
import {
  WalletCurrency,
  checkedToBtcPaymentAmount,
  checkedToUsdPaymentAmount,
} from "@/domain/shared"
import { checkedToWalletId } from "@/domain/wallets"

import { DealerPriceService } from "@/services/dealer-price"
import { LedgerService } from "@/services/ledger"
import * as LedgerFacade from "@/services/ledger/facade"
import { AccountsRepository, WalletsRepository } from "@/services/mongoose"
import { addAttributesToCurrentSpan } from "@/services/tracing"

import { OnChainService } from "@/services/bria"

const { dustThreshold } = getOnChainWalletConfig()
const dealer = DealerPriceService()

const getOnChainFee = async <S extends WalletCurrency>({
  walletId,
  account: senderAccount,
  amount,
  amountCurrency,
  address,
  speed,
}: GetOnChainFeeArgs): Promise<PaymentAmount<S> | ApplicationError> => {
  const amountChecked =
    amountCurrency === WalletCurrency.Btc
      ? checkedToBtcPaymentAmount(amount)
      : checkedToUsdPaymentAmount(amount)
  if (amountChecked instanceof Error) return amountChecked

  const walletIdChecked = checkedToWalletId(walletId)
  if (walletIdChecked instanceof Error) return walletIdChecked

  const walletsRepo = WalletsRepository()
  const senderWallet = await walletsRepo.findById(walletIdChecked)
  if (senderWallet instanceof Error) return senderWallet

  const checkedAddress = checkedToOnChainAddress({
    network: NETWORK,
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
    netInVolumeAmountLightningFn: LedgerFacade.netInLightningTxBaseVolumeAmountSince,
    netInVolumeAmountOnChainFn: LedgerFacade.netInOnChainTxBaseVolumeAmountSince,
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

    const accountWallets = await WalletsRepository().findAccountWalletsByAccountId(
      recipientWallet.accountId,
    )
    if (accountWallets instanceof Error) return accountWallets

    const recipientAccount = await AccountsRepository().findById(
      recipientWallet.accountId,
    )
    if (recipientAccount instanceof Error) return recipientAccount

    const paymentFlow = await withSenderBuilder
      .withRecipientWallet({
        defaultWalletCurrency: recipientWallet.currency,
        recipientWalletDescriptors: accountWallets,
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
    .withAmount(amountChecked)
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
    speed,
  })
  if (paymentFlow instanceof Error) return paymentFlow
  addAttributesToCurrentSpan({
    "payOnChainByWalletId.estimatedMinerFee": `${paymentFlow.btcMinerFee}`,
  })

  return paymentFlow.protocolAndBankFeeInSenderWalletCurrency()
}

export const getMinerFeeAndPaymentFlow = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  builder,
  speed,
}: {
  builder: OPFBWithConversion<S, R>
  speed: PayoutSpeed
}): Promise<OnChainPaymentFlow<S, R> | ValidationError | DealerPriceServiceError> => {
  const onChainService = OnChainService()

  const proposedBtcAmount = await builder.btcProposedAmount()
  if (proposedBtcAmount instanceof Error) return proposedBtcAmount

  const address = await builder.addressForFlow()
  if (address instanceof Error) return address

  const minerFee = await onChainService.estimateFeeForPayout({
    amount: proposedBtcAmount,
    address,
    speed,
  })
  if (minerFee instanceof Error) return minerFee

  return builder.withMinerFee(minerFee)
}

export const getOnChainFeeForBtcWallet = async <S extends WalletCurrency>(
  args: GetOnChainFeeWithoutCurrencyArgs,
): Promise<PaymentAmount<S> | ApplicationError> => {
  const validated = await validateIsBtcWallet(args.walletId)
  return validated instanceof Error
    ? validated
    : getOnChainFee({ ...args, amountCurrency: WalletCurrency.Btc })
}

export const getOnChainFeeForUsdWallet = async <S extends WalletCurrency>(
  args: GetOnChainFeeWithoutCurrencyArgs,
): Promise<PaymentAmount<S> | ApplicationError> => {
  const validated = await validateIsUsdWallet(args.walletId)
  return validated instanceof Error
    ? validated
    : getOnChainFee({ ...args, amountCurrency: WalletCurrency.Usd })
}

export const getOnChainFeeForUsdWalletAndBtcAmount = async <S extends WalletCurrency>(
  args: GetOnChainFeeWithoutCurrencyArgs,
): Promise<PaymentAmount<S> | ApplicationError> => {
  const validated = await validateIsUsdWallet(args.walletId)
  return validated instanceof Error
    ? validated
    : getOnChainFee({ ...args, amountCurrency: WalletCurrency.Btc })
}
