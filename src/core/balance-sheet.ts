import { getBalance as getBitcoindBalance } from "@services/bitcoind"
import { lndsBalances } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { InvoiceUser, User } from "@services/mongoose/schema"
import { ledger } from "@services/mongodb"

import { WalletFactory } from "./wallet-factory"

const logger = baseLogger.child({ module: "balanceSheet" })

export const updatePendingLightningTransactions = async () => {
  // select distinct user ids from pending invoices
  const usersWithPendingInvoices = InvoiceUser.aggregate([
    { $match: { paid: false } },
    { $group: { _id: "$uid" } },
  ])
    .cursor({ batchSize: 100 })
    .exec()

  const updatePendingInvoices = async (userIds, index) => {
    let user, userWallet
    for await (const { _id } of userIds) {
      logger.trace("updating pending invoices for user %s in worker %d", _id, index)
      user = await User.findOne({ _id })
      userWallet = await WalletFactory({ user, logger })
      await userWallet.updatePendingInvoices()
    }
  }

  // starts 5 workers sharing the same iterator, i.e. update 5 users in parallel
  const invoiceWorkers = new Array(5)
    .fill(usersWithPendingInvoices)
    .map(updatePendingInvoices)

  await Promise.allSettled(invoiceWorkers)

  logger.trace("finish updating pending invoices")

  const accountsWithPendingPayments = ledger.getAccountsWithPendingTransactions({
    type: "payment",
  })

  const updatePendingPayments = async (accounts, index) => {
    let user, userWallet
    for await (const account of accounts) {
      logger.trace(
        "updating pending payments for account %s in worker %d",
        account,
        index,
      )
      user = await User.findOne({ _id: ledger.resolveAccountId(account) })
      userWallet = await WalletFactory({ user, logger })
      await userWallet.updatePendingPayments()
    }
  }

  // starts 5 workers sharing the same iterator, i.e. update 5 users in parallel
  const paymentWorkers = new Array(5)
    .fill(accountsWithPendingPayments)
    .map(updatePendingPayments)

  await Promise.allSettled(paymentWorkers)

  logger.trace("finish updating pending payments")
}

export const updateUsersPendingPayment = async ({
  onchainOnly,
}: { onchainOnly?: boolean } = {}) => {
  if (!onchainOnly) {
    await updatePendingLightningTransactions()
  }

  let userWallet
  const users = User.find({ onchain: { $exists: true, $not: { $size: 0 } } }).cursor({
    batchSize: 100,
  })
  for await (const user of users) {
    logger.trace("updating onchain receipt for user %o", user._id)
    userWallet = await WalletFactory({ user, logger })
    await userWallet.updateOnchainReceipt()
  }
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
