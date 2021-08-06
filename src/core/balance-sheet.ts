import { getBalance as getBitcoindBalance } from "@services/bitcoind"
import { lndsBalances } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { InvoiceUser, User } from "@services/mongoose/schema"
import { ledger } from "@services/mongodb"

import { WalletFactory } from "./wallet-factory"

const logger = baseLogger.child({ module: "balanceSheet" })

export const updatePendingLightningTransactions = async () => {
  let user, userWallet

  // select distinct user ids from pending invoices
  const usersWithPendingInvoices = InvoiceUser.aggregate([
    { $match: { paid: false } },
    { $group: { _id: "$uid" } },
  ])
    .cursor({ batchSize: 100 })
    .exec()

  for await (const { _id } of usersWithPendingInvoices) {
    logger.trace("updating pending invoices for user %o", _id)
    user = await User.findOne({ _id })
    userWallet = await WalletFactory({ user, logger })
    await userWallet.updatePendingInvoices()
  }

  const accounts = ledger.getAccountsWithPendingTransactions({ type: "payment" })
  for await (const account of accounts) {
    logger.trace("updating pending payments for account %o", account)
    user = await User.findOne({ _id: ledger.resolveAccountId(account) })
    userWallet = await WalletFactory({ user, logger })
    await userWallet.updatePendingPayments()
  }
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
