import { wrapAsyncToRunInSpan } from "@services/tracing"

import {
  deleteExpiredLightningPaymentFlows,
  deleteExpiredWalletInvoice,
  deleteFailedPaymentsAttemptAllLnds,
  updateEscrows,
  updateRoutingRevenues,
} from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"

import { activateLndHealthCheck } from "@services/lnd/health"
import { ColdStorage, Lightning, Wallets, Payments } from "@app"
import { getCronConfig, TWO_WEEKS_IN_MS } from "@config"

const logger = baseLogger.child({ module: "cron" })

const main = async () => {
  const cronConfig = getCronConfig()
  const results: Array<boolean> = []
  const mongoose = await setupMongoConnection()

  const rebalance = async () => {
    const result = await ColdStorage.rebalanceToColdWallet()
    if (result instanceof Error) throw result
  }

  const updatePendingLightningInvoices = () => Wallets.updatePendingInvoices(logger)

  const updatePendingLightningPayments = () => Payments.updatePendingPayments(logger)

  const updateOnChainReceipt = async () => {
    const txNumber = await Wallets.updateOnChainReceipt({ logger })
    if (txNumber instanceof Error) throw txNumber
  }

  const deleteExpiredInvoices = async () => {
    await deleteExpiredWalletInvoice()
  }

  const deleteExpiredPaymentFlows = async () => {
    await deleteExpiredLightningPaymentFlows()
  }

  const updateLnPaymentsCollection = async () => {
    const result = await Lightning.updateLnPayments()
    if (result instanceof Error) throw result
  }

  const deleteLndPaymentsBefore2Weeks = async () => {
    const timestamp2Weeks = new Date(Date.now() - TWO_WEEKS_IN_MS)
    const result = Lightning.deleteLnPaymentsBefore(timestamp2Weeks)
    if (result instanceof Error) throw result
  }

  const tasks = [
    updateEscrows,
    updatePendingLightningInvoices,
    updatePendingLightningPayments,
    updateLnPaymentsCollection,
    deleteExpiredInvoices,
    deleteLndPaymentsBefore2Weeks,
    deleteFailedPaymentsAttemptAllLnds,
    updateRoutingRevenues,
    updateOnChainReceipt,
    ...(cronConfig.rebalanceEnabled ? [rebalance] : []),
    deleteExpiredPaymentFlows,
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
