import { getBalance as getBitcoindBalance } from "@services/bitcoind"
import { lndsBalances } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { ledger } from "@services/mongodb"
import { WalletInvoicesRepository } from "@services/mongoose"
import { User } from "@services/mongoose/schema"

import { WalletFactory } from "./wallet-factory"
import { runInParallel } from "./utils"

import * as Wallets from "@app/wallets"

const logger = baseLogger.child({ module: "balanceSheet" })

const updatePendingLightningInvoices = async () => {
  const walletInvoicesRepo = WalletInvoicesRepository()

  const walletIdsWithPendingInvoices =
    walletInvoicesRepo.listWalletIdsWithPendingInvoices()

  if (walletIdsWithPendingInvoices instanceof Error) {
    logger.error(
      { error: walletIdsWithPendingInvoices },
      "finish updating pending invoices with error",
    )
    return
  }

  await runInParallel({
    iterator: walletIdsWithPendingInvoices,
    logger,
    processor: async (walletId, index) => {
      logger.trace(
        "updating pending invoices for wallet %s in worker %d",
        walletId,
        index,
      )
      const user = await User.findOne({ _id: walletId })
      const userWallet = await WalletFactory({ user, logger })
      await userWallet.updatePendingInvoices()
    },
  })

  logger.info("finish updating pending invoices")
}

const updatePendingLightningPayments = async () => {
  const accountsWithPendingPayments = ledger.getAccountsWithPendingTransactions({
    type: "payment",
  })

  await runInParallel({
    iterator: accountsWithPendingPayments,
    logger,
    processor: async (account, index) => {
      logger.trace(
        "updating pending payments for account %s in worker %d",
        account,
        index,
      )
      const user = await User.findOne({ _id: ledger.resolveAccountId(account) })
      const userWallet = await WalletFactory({ user, logger })
      await userWallet.updatePendingPayments()
    },
  })

  logger.info("finish updating pending payments")
}

export const updatePendingLightningTransactions = async () => {
  await updatePendingLightningInvoices()
  await updatePendingLightningPayments()
}

export const updateUsersPendingPayment = async ({
  onchainOnly,
}: { onchainOnly?: boolean } = {}) => {
  if (!onchainOnly) {
    await updatePendingLightningTransactions()
  }

  const users = User.find({ onchain: { $exists: true, $not: { $size: 0 } } }).cursor({
    batchSize: 100,
  })

  await runInParallel({
    iterator: users,
    logger,
    workers: 3,
    processor: async (user, index) => {
      logger.trace("updating onchain receipt for user %o in worker %d", user._id, index)
      const result = await Wallets.updateOnChainReceipt(user.id, logger)
      if (result instanceof Error) {
        logger.error(
          { userId: user.id, index },
          "Could not updateOnChainReceipt from balance-sheet",
        )
      }
    },
  })

  logger.info("finish updating onchain receipt")
}

export const getLedgerAccounts = async () => {
  const [assets, liabilities, lightning, bitcoin, bankOwnerBalance] = await Promise.all([
    ledger.getAssetsBalance(),
    ledger.getLiabilitiesBalance(),
    ledger.getLndBalance(),
    ledger.getBitcoindBalance(),
    ledger.getBankOwnerBalance(),
  ])

  return { assets, liabilities, lightning, bitcoin, bankOwnerBalance }
}

export const balanceSheetIsBalanced = async () => {
  const { assets, liabilities, lightning, bitcoin, bankOwnerBalance } =
    await getLedgerAccounts()
  const { total: lnd } = await lndsBalances() // doesnt include escrow amount

  const bitcoind = await getBitcoindBalance()

  const assetsLiabilitiesDifference =
    assets /* assets is ___ */ + liabilities /* liabilities is ___ */

  const bookingVersusRealWorldAssets =
    lnd + // physical assets
    bitcoind + // physical assets
    (lightning + bitcoin) // value in accounting

  if (!!bookingVersusRealWorldAssets || !!assetsLiabilitiesDifference) {
    logger.warn(
      {
        assetsLiabilitiesDifference,
        bookingVersusRealWorldAssets,
        assets,
        liabilities,
        bankOwnerBalance,
        lnd,
        lightning,
        bitcoind,
        bitcoin,
      },
      `not balanced`,
    )
  }

  return { assetsLiabilitiesDifference, bookingVersusRealWorldAssets }
}
