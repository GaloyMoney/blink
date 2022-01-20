import { wrapAsyncToRunInSpan } from "@services/tracing"

import {
  deleteExpiredWalletInvoice,
  deleteFailedPaymentsAttemptAllLnds,
  updateEscrows,
  updateRoutingFees,
} from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"

import { activateLndHealthCheck } from "@services/lnd/health"
import { ColdStorage, Lightning, Wallets } from "@app"

const logger = baseLogger.child({ module: "cron" })

const main = async () => {
  const results: Array<boolean> = []
  const mongoose = await setupMongoConnection()

  const rebalance = async () => {
    const result = await ColdStorage.rebalanceToColdWallet()
    if (result instanceof Error) throw result
  }

  const updatePendingLightningInvoices = () => Wallets.updatePendingInvoices(logger)

  const updatePendingLightningPayments = () => Wallets.updatePendingPayments(logger)

  const updateOnChainReceipt = async () => {
    const txNumber = await Wallets.updateOnChainReceipt({ logger })
    if (txNumber instanceof Error) throw txNumber
  }

  const deleteExpiredInvoices = async () => {
    await deleteExpiredWalletInvoice()
  }

  const updateLnPaymentsCollection = async () => {
    const result = await Lightning.updateLnPayments()
    if (result instanceof Error) throw result
  }

  const tasks = [
    updateEscrows,
    updatePendingLightningInvoices,
    updatePendingLightningPayments,
    deleteExpiredInvoices,
    deleteFailedPaymentsAttemptAllLnds,
    updateRoutingFees,
    updateOnChainReceipt,
    rebalance,
    updateLnPaymentsCollection,
  ]

  for (const task of tasks) {
    try {
      logger.info(`starting ${task.name}`)
      const wrappedTask = wrapAsyncToRunInSpan({ namespace: "cron", fn: task })
      await wrappedTask()
      results.push(true)
    } catch (error) {
      logger.error({ error }, `issue with task ${task.name}`)
      results.push(false)
    }
  }

  await mongoose.connection.close()

  process.exit(results.every((r) => r) ? 0 : 99)
}

try {
  activateLndHealthCheck()
  main()
} catch (err) {
  logger.warn({ err }, "error in the cron job")
}
