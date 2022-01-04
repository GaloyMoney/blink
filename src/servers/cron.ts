import { getSpecterWalletConfig } from "@config/app"

import {
  deleteExpiredInvoiceUser,
  deleteFailedPaymentsAttemptAllLnds,
  updateEscrows,
  updateRoutingFees,
} from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"

import {
  updatePendingLightningTransactions,
  updateUsersPendingPayment,
} from "@core/balance-sheet"
import { SpecterWallet } from "@core/specter-wallet"
import { activateLndHealthCheck } from "@services/lnd/health"

const main = async () => {
  const mongoose = await setupMongoConnection()

  const rebalance = () => {
    const specterWalletConfig = getSpecterWalletConfig()
    const specterWallet = new SpecterWallet({
      logger: baseLogger,
      config: specterWalletConfig,
    })
    return specterWallet.tentativelyRebalance()
  }

  const updatePendingOnChainPayments = () =>
    updateUsersPendingPayment({ onchainOnly: true })

  const tasks = [
    updateEscrows,
    updatePendingLightningTransactions,
    deleteExpiredInvoiceUser,
    deleteFailedPaymentsAttemptAllLnds,
    rebalance,
    updateRoutingFees,
    updatePendingOnChainPayments,
  ]

  const results: Array<boolean> = []
  for (const task of tasks) {
    try {
      baseLogger.info(`starting ${task.name}`)
      await task()
      results.push(true)
    } catch (error) {
      baseLogger.error({ error }, `issue with task ${task.name}`)
      results.push(false)
    }
  }

  await mongoose.connection.close()

  // FIXME: we need to exit because we may have some pending promise
  process.exit(results.every((r) => r) ? 0 : 99)
}

try {
  activateLndHealthCheck()
  main()
} catch (err) {
  baseLogger.warn({ err }, "error in the cron job")
}
