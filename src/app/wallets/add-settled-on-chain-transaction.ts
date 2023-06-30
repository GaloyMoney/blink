import crypto from "crypto"

import { getFeesConfig, getOnChainWalletConfig } from "@config"

import { removeDeviceTokens } from "@app/users/remove-device-tokens"
import { getCurrentPriceAsDisplayPriceRatio, usdFromBtcMidPriceFn } from "@app/prices"

import { DepositFeeCalculator } from "@domain/wallets"
import { displayAmountFromNumber } from "@domain/fiat"
import { CouldNotFindError, LessThanDustThresholdError } from "@domain/errors"
import { WalletAddressReceiver } from "@domain/wallet-on-chain/wallet-address-receiver"
import { DeviceTokensNotRegisteredNotificationsServiceError } from "@domain/notifications"

import {
  AccountsRepository,
  UsersRepository,
  WalletOnChainPendingReceiveRepository,
  WalletsRepository,
} from "@services/mongoose"
import { LockService } from "@services/lock"
import { baseLogger } from "@services/logger"
import { LedgerService } from "@services/ledger"
import * as LedgerFacade from "@services/ledger/facade"
import { DealerPriceService } from "@services/dealer-price"
import { NotificationsService } from "@services/notifications"

import { getLastOnChainAddress } from "./get-last-on-chain-address"
import { createOnChainAddressByWallet } from "./create-on-chain-address"

const ledger = LedgerService()
const dealer = DealerPriceService()
const { dustThreshold } = getOnChainWalletConfig()
const feesConfig = getFeesConfig()

const logger = baseLogger

const addSettledTransactionBeforeFinally = async ({
  txId: txHash,
  vout,
  satoshis: amount,
  address,
}: {
  txId: OnChainTxHash
  vout: OnChainTxVout
  satoshis: BtcPaymentAmount
  address: OnChainAddress
}): Promise<
  | {
      walletDescriptor: WalletDescriptor<WalletCurrency>
      newAddressRequestId: OnChainAddressRequestId | undefined
    }
  | ApplicationError
> => {
  if (amount.amount < dustThreshold) {
    return new LessThanDustThresholdError(`${dustThreshold}`)
  }

  const wallet = await WalletsRepository().findByAddress(address)
  if (wallet instanceof Error) return wallet

  return LockService().lockOnChainTxHashAndVout({ txHash, vout }, async () => {
    const recordedResult = await ledger.isOnChainReceiptTxRecordedForWallet({
      walletId: wallet.id,
      txHash,
      vout,
    })
    if (recordedResult instanceof Error) {
      logger.error({ error: recordedResult }, "Could not query ledger")
      return recordedResult
    }
    const { recorded, newAddressRequestId: recordedAddressRequestId } = recordedResult
    if (recorded) {
      return {
        walletDescriptor: wallet,
        newAddressRequestId: recordedAddressRequestId,
      }
    }

    const account = await AccountsRepository().findById(wallet.accountId)
    if (account instanceof Error) return account

    const fee = DepositFeeCalculator().onChainDepositFee({
      amount,
      minBankFee: feesConfig.depositDefaultMin,
      minBankFeeThreshold: feesConfig.depositThreshold,
      ratio: feesConfig.depositRatioAsBasisPoints,
    })
    if (fee instanceof Error) return fee

    const walletAddressReceiver = await WalletAddressReceiver({
      walletAddress: {
        address,
        recipientWalletDescriptor: wallet,
      },
      receivedBtc: amount,
      satsFee: fee,
      usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
      usdFromBtcMidPrice: usdFromBtcMidPriceFn,
    })
    if (walletAddressReceiver instanceof Error) return walletAddressReceiver

    const { displayCurrency } = account

    const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
      currency: displayCurrency,
    })
    if (displayPriceRatio instanceof Error) {
      return displayPriceRatio
    }
    const amountDisplayCurrency = Number(
      displayPriceRatio.convertFromWallet(walletAddressReceiver.btcToCreditReceiver)
        .amountInMinor,
    ) as DisplayCurrencyBaseAmount

    const feeDisplayCurrency = Number(
      displayPriceRatio.convertFromWalletToCeil(walletAddressReceiver.btcBankFee)
        .amountInMinor,
    ) as DisplayCurrencyBaseAmount

    let newAddressRequestId: OnChainAddressRequestId | undefined = undefined
    const currentAddress = await getLastOnChainAddress(wallet.id)
    if (address === currentAddress) {
      newAddressRequestId = crypto.randomUUID() as OnChainAddressRequestId
    }

    const {
      metadata,
      creditAccountAdditionalMetadata,
      internalAccountsAdditionalMetadata,
    } = LedgerFacade.OnChainReceiveLedgerMetadata({
      onChainTxHash: txHash,
      onChainTxVout: vout,
      paymentAmounts: {
        btcPaymentAmount: walletAddressReceiver.btcToCreditReceiver,
        usdPaymentAmount: walletAddressReceiver.usdToCreditReceiver,
        btcProtocolAndBankFee: walletAddressReceiver.btcBankFee,
        usdProtocolAndBankFee: walletAddressReceiver.usdBankFee,
      },
      feeDisplayCurrency,
      amountDisplayCurrency,
      displayCurrency,

      payeeAddresses: [address],
      newAddressRequestId,
    })

    const result = await LedgerFacade.recordReceiveOnChain({
      description: "",
      recipientWalletDescriptor: wallet,
      amountToCreditReceiver: {
        usd: walletAddressReceiver.usdToCreditReceiver,
        btc: walletAddressReceiver.btcToCreditReceiver,
      },
      bankFee: {
        usd: walletAddressReceiver.usdBankFee,
        btc: walletAddressReceiver.btcBankFee,
      },
      metadata,
      additionalCreditMetadata: creditAccountAdditionalMetadata,
      additionalInternalMetadata: internalAccountsAdditionalMetadata,
    })

    if (result instanceof Error) {
      logger.error({ error: result }, "Could not record onchain tx in ledger")
      return result
    }

    const user = await UsersRepository().findById(account.kratosUserId)
    if (user instanceof Error) return user

    const displayAmount = displayAmountFromNumber({
      amount: creditAccountAdditionalMetadata.displayAmount,
      currency: creditAccountAdditionalMetadata.displayCurrency,
    })
    if (displayAmount instanceof Error) return displayAmount

    const notificationResult = await NotificationsService().onChainTxReceived({
      recipientAccountId: wallet.accountId,
      recipientWalletId: wallet.id,
      paymentAmount: amount,
      displayPaymentAmount: displayAmount,
      txHash,
      recipientDeviceTokens: user.deviceTokens,
      recipientLanguage: user.language,
    })

    if (
      notificationResult instanceof DeviceTokensNotRegisteredNotificationsServiceError
    ) {
      await removeDeviceTokens({
        userId: user.id,
        deviceTokens: notificationResult.tokens,
      })
    }

    return {
      walletDescriptor: wallet,
      newAddressRequestId,
    }
  })
}

export const addSettledTransaction = async (args: {
  txId: OnChainTxHash
  vout: OnChainTxVout
  satoshis: BtcPaymentAmount
  address: OnChainAddress
}): Promise<true | ApplicationError> => {
  const res = await addSettledTransactionBeforeFinally(args)
  if (res instanceof Error) return res

  const { newAddressRequestId, walletDescriptor } = res

  const removed = await WalletOnChainPendingReceiveRepository().remove({
    walletId: walletDescriptor.id,
    transactionHash: args.txId,
    vout: args.vout,
  })
  if (removed instanceof Error && !(removed instanceof CouldNotFindError)) {
    return removed
  }

  if (newAddressRequestId) {
    const newAddress = await createOnChainAddressByWallet({
      wallet: walletDescriptor,
      requestId: newAddressRequestId,
    })
    if (newAddress instanceof Error) return newAddress
  }

  return true
}
