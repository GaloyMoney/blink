import { BitcoindClient, getBalance as getBitcoindBalance } from "@services/bitcoind"
import { lndsBalances } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { User } from "@services/mongoose/schema"
import { ledger } from "@services/mongodb"

import { WalletFactory } from "./wallet-factory"

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

  const bitcoindClient = new BitcoindClient()
  const bitcoind = await getBitcoindBalance({ bitcoindClient })

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
