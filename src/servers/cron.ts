import { getSpecterWalletConfig } from "@config/app"
import {
  asyncRunInSpan,
  SemanticAttributes,
  shutdownTracing,
  wrapAsyncToRunInSpan,
} from "@services/tracing"

import {
  deleteExpiredInvoiceUser,
  deleteFailedPaymentsAttemptAllLnds,
  updateEscrows,
  updateRoutingFees,
} from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"

import { SpecterWallet } from "@core/specter-wallet"
import { activateLndHealthCheck } from "@services/lnd/health"
import { Wallets } from "@app"

const logger = baseLogger.child({ module: "cron" })

const main = async () => {
  const results: Array<boolean> = []
  await asyncRunInSpan(
    "cron.main",
    {
      [SemanticAttributes.CODE_FUNCTION]: "main",
      [SemanticAttributes.CODE_NAMESPACE]: "cron",
    },
    async () => {
      const mongoose = await setupMongoConnection()

      const rebalance = () => {
        const specterWalletConfig = getSpecterWalletConfig()
        const specterWallet = new SpecterWallet({
          logger,
          config: specterWalletConfig,
        })
        return specterWallet.tentativelyRebalance()
      }

      const updatePendingLightningInvoices = () => Wallets.updatePendingInvoices(logger)

      const updatePendingLightningPayments = () => Wallets.updatePendingPayments(logger)

      const updateOnChainReceipt = async () => {
        const txNumber = await Wallets.updateOnChainReceipt({ logger })
        if (txNumber instanceof Error) throw txNumber
      }

      const deleteExpiredInvoices = async () => {
        await deleteExpiredInvoiceUser()
      }

      const tasks = [
        updateEscrows,
        updatePendingLightningInvoices,
        updatePendingLightningPayments,
        deleteExpiredInvoices,
        deleteFailedPaymentsAttemptAllLnds,
        rebalance,
        updateRoutingFees,
        updateOnChainReceipt,
      ]

      for (const task of tasks) {
        const wrappedTask = wrapAsyncToRunInSpan({ namespace: "cron", fn: task })
        try {
          logger.info(`starting ${task.name}`)
          await wrappedTask()
          results.push(true)
        } catch (error) {
          logger.error({ error }, `issue with task ${task.name}`)
          results.push(false)
          return error
        }
      }

      await mongoose.connection.close()
    },
  )

  await shutdownTracing()

  process.exit(results.every((r) => r) ? 0 : 99)
}

try {
  activateLndHealthCheck()
  main()
} catch (err) {
  logger.warn({ err }, "error in the cron job")
}
