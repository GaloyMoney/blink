import { getCurrentPriceAsDisplayPriceRatio, usdFromBtcMidPriceFn } from "@app/prices"
import { WalletAddressReceiver } from "@domain/wallet-on-chain-addresses/wallet-address-receiver"
import { NewDepositFeeCalculator } from "@domain/wallets"
import { displayAmountFromNumber } from "@domain/fiat"

import { DealerPriceService } from "@services/dealer-price"
import { LedgerService } from "@services/ledger"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import * as LedgerFacade from "@services/ledger/facade"
import { baseLogger } from "@services/logger"
import { NotificationsService } from "@services/notifications"
import { PendingOnChainTransactionsRepository } from "@services/mongoose/pending-onchain-transactions"

import { getLastOnChainAddress } from "./get-last-on-chain-address"
import { createOnChainAddressByWallet } from "./create-on-chain-address"

const dealer = DealerPriceService()

const ledger = LedgerService()

const notifications = NotificationsService()

const logger = baseLogger

export const addSettledTransaction = async ({
  address,
  txHash,
  vout,
  amount,
}: {
  address: OnChainAddress
  txHash: OnChainTxHash
  vout: number
  amount: BtcPaymentAmount
  blockNumber: number
}) => {
  const walletId = "TODO" as WalletId

  // Do checks

  // Record in ledger
  // const lockService = LockService()
  const recorded = await ledger.newIsOnChainTxRecorded({
    walletId,
    txHash,
    vout,
  })
  if (recorded === true || recorded instanceof Error) {
    // logger.error({ error: recorded }, "Could not query ledger")
    return recorded
  }

  const processedTx = await processTxn({
    walletId,
    amount,
    address,
    txHash,
    vout,
  })
  if (processedTx instanceof Error) return processedTx

  // Remove from pending
  return PendingOnChainTransactionsRepository().remove({ txHash, vout })
}

// Note: temporarily separated for visibility. Can inline when fully implemented.
const processTxn = async ({
  walletId,
  amount,
  address,
  txHash,
  vout,
}: {
  walletId: WalletId
  amount: BtcPaymentAmount
  address: OnChainAddress
  txHash: OnChainTxHash
  vout: number
}) => {
  // QUES: do we need this check still?
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet
  const walletAddresses = wallet.onChainAddresses()
  if (!walletAddresses.includes(address)) {
    return new Error("Address for wallet check")
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

  const recipientAccount = await AccountsRepository().findById(wallet.accountId)
  if (recipientAccount instanceof Error) return recipientAccount
  const { displayCurrency } = recipientAccount

  const recipientDisplayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
    currency: displayCurrency,
  })
  if (recipientDisplayPriceRatio instanceof Error) {
    return recipientDisplayPriceRatio
  }
  const amountDisplayCurrency = Number(
    recipientDisplayPriceRatio.convertFromWallet(
      walletAddressReceiver.btcToCreditReceiver,
    ).amountInMinor,
  ) as DisplayCurrencyBaseAmount

  const feeDisplayCurrency = Number(
    recipientDisplayPriceRatio.convertFromWalletToCeil(walletAddressReceiver.btcBankFee)
      .amountInMinor,
  ) as DisplayCurrencyBaseAmount

  const {
    metadata,
    creditAccountAdditionalMetadata,
    internalAccountsAdditionalMetadata,
  } = LedgerFacade.OnChainReceiveLedgerMetadata({
    onChainTxHash: txHash,
    vout,
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

  const recipientUser = await UsersRepository().findById(recipientAccount.kratosUserId)
  if (recipientUser instanceof Error) return recipientUser

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
    recipientDeviceTokens: recipientUser.deviceTokens,
    recipientLanguage: recipientUser.language,
  })

  const currentAddress = await getLastOnChainAddress(wallet.id)
  if (address === currentAddress) {
    const newAddress = await createOnChainAddressByWallet(wallet)
    if (newAddress instanceof Error) return newAddress
  }
}
