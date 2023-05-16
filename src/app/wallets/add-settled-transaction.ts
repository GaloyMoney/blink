import { getCurrentPriceAsDisplayPriceRatio, usdFromBtcMidPriceFn } from "@app/prices"
import { WalletAddressReceiver } from "@domain/wallet-on-chain/wallet-address-receiver"
import { NewDepositFeeCalculator } from "@domain/wallets"
import { displayAmountFromNumber } from "@domain/fiat"

import { DealerPriceService } from "@services/dealer-price"
import { LedgerService } from "@services/ledger"
import { LockService } from "@services/lock"
import {
  AccountsRepository,
  UsersRepository,
  WalletOnChainPendingReceiveRepository,
  WalletsRepository,
} from "@services/mongoose"
import * as LedgerFacade from "@services/ledger/facade"
import { baseLogger } from "@services/logger"
import { NotificationsService } from "@services/notifications"

import { getLastOnChainAddress } from "./get-last-on-chain-address"
import { createOnChainAddressByWallet } from "./create-on-chain-address"

const dealer = DealerPriceService()

const ledger = LedgerService()

const notifications = NotificationsService()

const logger = baseLogger

export const addSettledTransaction = async ({
  txId: txHash,
  vout,
  satoshis: amount,
  address,
}: {
  txId: OnChainTxHash
  vout: OnChainTxVout
  satoshis: BtcPaymentAmount
  address: OnChainAddress
}): Promise<true | ApplicationError> => {
  const wallet = await WalletsRepository().findByAddress(address)
  if (wallet instanceof Error) return wallet

  return LockService().lockOnChainTxHashAndVout({ txHash, vout }, async () => {
    const recorded = await ledger.isOnChainTxRecorded({
      walletId: wallet.id,
      txHash,
      vout,
    })
    if (recorded) {
      if (recorded instanceof Error) {
        logger.error({ error: recorded }, "Could not query ledger")
      }
      return recorded
    }

    const account = await AccountsRepository().findById(wallet.accountId)
    if (account instanceof Error) return account

    const fee = NewDepositFeeCalculator().onChainDepositFee({
      amount,
      ratio: account.depositFeeRatio,
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
    })

    const result = await LedgerFacade.recordReceive({
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

    await notifications.onChainTxReceived({
      recipientAccountId: wallet.accountId,
      recipientWalletId: wallet.id,
      paymentAmount: amount,
      displayPaymentAmount: displayAmount,
      txHash,
      recipientDeviceTokens: user.deviceTokens,
      recipientLanguage: user.language,
    })

    const currentAddress = await getLastOnChainAddress(wallet.id)
    if (address === currentAddress) {
      const newAddress = await createOnChainAddressByWallet(wallet)
      if (newAddress instanceof Error) return newAddress
    }
    const res = await WalletOnChainPendingReceiveRepository().remove({
      walletId: wallet.id,
      transactionHash: txHash,
      vout,
    })
    if (res instanceof Error) return res
    return true
  })
}
