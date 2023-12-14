import {
  waitUntilChannelBalanceSyncE2e,
  waitUntilChannelBalanceSyncIntegration,
} from "./lightning"

import { getBriaBalance } from "./bria"

import { updatePendingPayments } from "@/app/payments"
import { handleHeldInvoices, updateLegacyOnChainReceipt } from "@/app/wallets"
import { baseLogger } from "@/services/logger"

import { ledgerAdmin } from "@/services/mongodb"
import { lndsBalances } from "@/services/lnd/utils"

const logger = baseLogger.child({ module: "test" })

export const checkIsBalanced = async () => {
  await Promise.all([
    handleHeldInvoices(logger),
    updatePendingPayments(logger),
    updateLegacyOnChainReceipt({ logger }),
  ])
  // wait for balance updates because invoice event
  // arrives before wallet balances updates in lnd
  await waitUntilChannelBalanceSyncIntegration()

  const { assetsLiabilitiesDifference, bookingVersusRealWorldAssets } =
    await balanceSheetIsBalanced()
  expect(assetsLiabilitiesDifference).toBe(0)

  // TODO: need to go from sats to msats to properly account for every msats spent
  expect(Math.abs(bookingVersusRealWorldAssets)).toBe(0)
}

export const checkIsBalancedE2e = async () => {
  await Promise.all([
    handleHeldInvoices(logger),
    updatePendingPayments(logger),
    updateLegacyOnChainReceipt({ logger }),
  ])
  // wait for balance updates because invoice event
  // arrives before wallet balances updates in lnd
  await waitUntilChannelBalanceSyncE2e()

  const { assetsLiabilitiesDifference, bookingVersusRealWorldAssets } =
    await balanceSheetIsBalanced()
  expect(assetsLiabilitiesDifference).toBe(0)

  // TODO: need to go from sats to msats to properly account for every msats spent
  expect(Math.abs(bookingVersusRealWorldAssets)).toBe(0)
}

const getLedgerAccounts = async () => {
  const [assets, liabilities, lightning, bitcoin, bankOwnerBalance, onChain] =
    await Promise.all([
      ledgerAdmin.getAssetsBalance(),
      ledgerAdmin.getLiabilitiesBalance(),
      ledgerAdmin.getLndBalance(),
      ledgerAdmin.getBitcoindBalance(),
      ledgerAdmin.getBankOwnerBalance(),
      ledgerAdmin.getOnChainBalance(),
    ])

  return { assets, liabilities, lightning, bitcoin, bankOwnerBalance, onChain }
}

const balanceSheetIsBalanced = async () => {
  const { assets, liabilities, lightning, bitcoin, bankOwnerBalance, onChain } =
    await getLedgerAccounts()
  const { total: lnd } = await lndsBalances() // doesnt include escrow amount

  const bria = await getBriaBalance()

  const assetsLiabilitiesDifference =
    assets /* assets is ___ */ + liabilities /* liabilities is ___ */

  const bookingVersusRealWorldAssets =
    lnd + // physical assets
    bria + // physical assets
    (lightning + bitcoin + onChain) // value in accounting

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
        bitcoin,
        bria,
        onChain,
      },
      `not balanced`,
    )
  }

  return { assetsLiabilitiesDifference, bookingVersusRealWorldAssets }
}
