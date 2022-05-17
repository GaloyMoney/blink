import { getBalance as getBitcoindBalance } from "@services/bitcoind"
import { lndsBalances } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { ledgerAdmin } from "@services/mongodb"

const logger = baseLogger.child({ module: "balanceSheet" })

export const getLedgerAccounts = async () => {
  const [assets, liabilities, lightning, bitcoin, bankOwnerBalance] = await Promise.all([
    ledgerAdmin.getAssetsBalance(),
    ledgerAdmin.getLiabilitiesBalance(),
    ledgerAdmin.getLndBalance(),
    ledgerAdmin.getBitcoindBalance(),
    ledgerAdmin.getBankOwnerBalance(),
  ])

  return { assets, liabilities, lightning, bitcoin, bankOwnerBalance }
}

export const getAssetsLiabilitiesDifference = async () => {
  const [assets, liabilities] = await Promise.all([
    ledgerAdmin.getAssetsBalance(),
    ledgerAdmin.getLiabilitiesBalance(),
  ])

  return assets + liabilities
}

export const getBookingVersusRealWorldAssets = async () => {
  const [lightning, bitcoin, lndBalances, bitcoind] = await Promise.all([
    ledgerAdmin.getLndBalance(),
    ledgerAdmin.getBitcoindBalance(),
    lndsBalances(),
    getBitcoindBalance(),
  ])

  const { total: lnd } = lndBalances

  return (
    lnd + // physical assets
    bitcoind + // physical assets
    (lightning + bitcoin)
  ) // value in accounting
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
