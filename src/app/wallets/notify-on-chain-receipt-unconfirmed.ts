import { BTC_NETWORK, ONCHAIN_SCAN_DEPTH } from "@config"

import { getCurrentPrice } from "@app/prices"

import { CacheKeys } from "@domain/cache"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { DepositFeeCalculator } from "@domain/wallets"
import { DisplayCurrency, DisplayCurrencyConverter } from "@domain/fiat"
import { CouldNotFindWalletFromOnChainAddressesError } from "@domain/errors"

import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { RedisCacheService } from "@services/cache"
import { OnChainService } from "@services/lnd/onchain-service"
import { NotificationsService } from "@services/notifications"

export const notifyOnChainReceiptUnconfirmedByTxHash = async ({
  txHash,
  scanDepth = ONCHAIN_SCAN_DEPTH,
  logger,
}: {
  txHash: OnChainTxHash
  scanDepth?: ScanDepth
  logger: Logger
}): Promise<true | ApplicationError> => {
  RedisCacheService().clear({ key: CacheKeys.LastOnChainTransactions })

  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const tx = await onChainService.lookupOnChainReceipt({ txHash, scanDepth })
  if (tx instanceof Error) return tx
  // we only handle pending notification here because we wait more than 1 block
  if (tx.confirmations > 0) return true

  logger.info({ transactionType: "receipt", pending: true }, "mempool appearance")

  const addresses = tx.uniqueAddresses()
  const wallets = await WalletsRepository().listByAddresses(addresses)
  // we should not process hot wallet rebalances
  if (wallets instanceof CouldNotFindWalletFromOnChainAddressesError) return true
  if (wallets instanceof Error) return wallets

  for (const wallet of wallets) {
    const walletId = wallet.id
    logger.trace({ walletId, txHash }, "notifying onchain receipt")

    const result = await processTxForWallet({ wallet, tx })
    if (result instanceof Error) {
      logger.error({ walletId, txHash, error: result }, "error notifying onchain receipt")
    }
  }

  return true
}

const processTxForWallet = async ({
  wallet,
  tx,
}: {
  wallet: Wallet
  tx: IncomingOnChainTransaction
}): Promise<void | ApplicationError> => {
  const displayCurrencyPerSat = await getCurrentPrice()
  if (displayCurrencyPerSat instanceof Error) return displayCurrencyPerSat

  const converter = DisplayCurrencyConverter(displayCurrencyPerSat)
  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account

  const walletAddresses = wallet.onChainAddresses()
  for (const { sats, address } of tx.rawTx.outs) {
    if (address !== null && walletAddresses.includes(address)) {
      const fee = DepositFeeCalculator().onChainDepositFee({
        amount: sats,
        ratio: account.depositFeeRatio,
      })
      const amountDisplayCurrency = converter.fromSats(sats)
      const feeDisplayCurrency = converter.fromSats(fee)

      const recipientAccount = await AccountsRepository().findById(wallet.accountId)
      if (recipientAccount instanceof Error) return recipientAccount

      const recipientUser = await UsersRepository().findById(recipientAccount.ownerId)
      if (recipientUser instanceof Error) return recipientUser

      const result = await NotificationsService().onChainTxReceivedPending({
        recipientAccountId: wallet.accountId,
        recipientWalletId: wallet.id,
        paymentAmount: { amount: BigInt(sats - fee), currency: wallet.currency },
        displayPaymentAmount: {
          amount: amountDisplayCurrency - feeDisplayCurrency,
          currency: DisplayCurrency.Usd,
        },
        txHash: tx.rawTx.txHash,
        recipientDeviceTokens: recipientUser.deviceTokens,
        recipientLanguage: recipientUser.language,
      })
      if (result instanceof Error) return result
    }
  }
}
