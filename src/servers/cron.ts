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
import { ColdStorage, Lightning, Wallets, Payments, Swap } from "@app"
import { getCronConfig, TWO_MONTHS_IN_MS, BTC_NETWORK } from "@config"
import { BtcNetwork } from "@domain/bitcoin"

import { rebalancingInternalChannels, reconnectNodes } from "@services/lnd/utils-bos"
import { extendSessions } from "@app/auth"

const logger = baseLogger.child({ module: "cron" })

const rebalance = async () => {
  const result = await ColdStorage.rebalanceToColdWallet()
  if (result instanceof Error) throw result
}

const updatePendingLightningInvoices = () => Wallets.handleHeldInvoices(logger)

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

const deleteLndPaymentsBefore2Months = async () => {
  const timestamp2Months = new Date(Date.now() - TWO_MONTHS_IN_MS)
  const result = await Lightning.deleteLnPaymentsBefore(timestamp2Months)
  if (result instanceof Error) throw result
}

const swapOutJob = async () => {
  const swapResult = await Swap.swapOut()
  if (swapResult instanceof Error) throw swapResult
}

const main = async () => {
  console.log("cronjob started")

  const cronConfig = getCronConfig()
  const results: Array<boolean> = []
  const mongoose = await setupMongoConnection()

  const tasks = [
    // bitcoin related tasks
    reconnectNodes,
    ...(BTC_NETWORK != BtcNetwork.signet ? [rebalancingInternalChannels] : []),
    updateEscrows,
    updatePendingLightningInvoices,
    updatePendingLightningPayments,
    updateLnPaymentsCollection,
    updateRoutingRevenues,
    updateOnChainReceipt,
    ...(cronConfig.rebalanceEnabled ? [rebalance] : []),
    ...(cronConfig.swapEnabled ? [swapOutJob] : []),
    deleteExpiredPaymentFlows,
    deleteExpiredInvoices,
    deleteLndPaymentsBefore2Months,
    deleteFailedPaymentsAttemptAllLnds,

    // auth related tasks
    extendSessions,
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
