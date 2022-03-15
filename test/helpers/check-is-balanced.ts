import {
  updatePendingInvoices,
  updatePendingPayments,
  updateOnChainReceipt,
} from "@app/wallets"
import { balanceSheetIsBalanced } from "@core/balance-sheet"
import { baseLogger } from "@services/logger"

import { waitUntilChannelBalanceSyncAll } from "./lightning"

const logger = baseLogger.child({ module: "test" })

export const checkIsBalanced = async () => {
  await Promise.all([
    updatePendingInvoices(logger),
    updatePendingPayments(logger),
    updateOnChainReceipt({ logger }),
  ])
  // wait for balance updates because invoice event
  // arrives before wallet balances updates in lnd
  await waitUntilChannelBalanceSyncAll()

  const { assetsLiabilitiesDifference, bookingVersusRealWorldAssets } =
    await balanceSheetIsBalanced()
  expect(assetsLiabilitiesDifference).toBe(0)

  // TODO: need to go from sats to msats to properly account for every msats spent
  expect(Math.abs(bookingVersusRealWorldAssets)).toBe(0)
}
