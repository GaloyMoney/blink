import { getBalance as getBitcoindBalance } from "../bitcoind"
import { lndsBalances } from "../lndUtils"
import { baseLogger } from "../logger"
import { MainBook } from "../mongodb"
import { User } from "../schema"
import { WalletFactory } from "../walletFactory"
import { bankOwnerMediciPath, bitcoindAccountingPath, lndAccountingPath } from "./ledger"

const logger = baseLogger.child({ module: "balanceSheet" })

export const updateUsersPendingPayment = async ({
  onchainOnly,
}: { onchainOnly?: boolean } = {}) => {
  let userWallet

  for await (const user of User.find({})) {
    logger.trace("updating user %o", user._id)

    // A better approach would be to just loop over pending: true invoice/payment
    userWallet = await WalletFactory({ user, logger })

    if (onchainOnly) {
      await userWallet.updateOnchainReceipt()
    } else {
      await userWallet.updatePending()
    }
  }
}

export const getLedgerAccounts = async () => {
  const { balance: assets } = await MainBook.balance({
    account_path: "Assets",
    currency: "BTC",
  })
  const { balance: liabilities } = await MainBook.balance({
    account_path: "Liabilities",
    currency: "BTC",
  })
  const { balance: lightning } = await MainBook.balance({
    accounts: lndAccountingPath,
    currency: "BTC",
  })
  const { balance: bitcoin } = await MainBook.balance({
    accounts: bitcoindAccountingPath,
    currency: "BTC",
  })

  const bankOwnerPath = await bankOwnerMediciPath()

  const { balance: bankOwnerBalance } = await MainBook.balance({
    accounts: bankOwnerPath,
    currency: "BTC",
  })

  return { assets, liabilities, lightning, bankOwnerBalance, bitcoin }
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
