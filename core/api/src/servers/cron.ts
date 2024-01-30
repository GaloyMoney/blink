import { OnChain, Lightning, Wallets, Payments } from "@/app"

import { getCronConfig, TWO_MONTHS_IN_MS } from "@/config"

import { ErrorLevel } from "@/domain/shared"
import { OperationInterruptedError } from "@/domain/errors"

import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
  wrapAsyncToRunInSpan,
} from "@/services/tracing"
import {
  deleteExpiredLightningPaymentFlows,
  deleteFailedPaymentsAttemptAllLnds,
  updateEscrows,
  updateRoutingRevenues,
} from "@/services/lnd/utils"
import { baseLogger } from "@/services/logger"
import { setupMongoConnection } from "@/services/mongodb"
import { activateLndHealthCheck, checkAllLndHealth } from "@/services/lnd/health"

import { elapsedSinceTimestamp, sleep } from "@/utils"
import { rebalancingInternalChannels } from "@/services/lnd/rebalancing"

const logger = baseLogger.child({ module: "cron" })

const rebalance = async () => {
  const result = await OnChain.rebalanceToColdWallet()
  if (result instanceof Error) throw result
}

const updatePendingLightningInvoices = () => Wallets.handleHeldInvoices(logger)

const updatePendingLightningPayments = () => Payments.updatePendingPayments(logger)

const updateLegacyOnChainReceipt = async () => {
  const txNumber = await Wallets.updateLegacyOnChainReceipt({ logger })
  if (txNumber instanceof Error) throw txNumber
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

const main = async () => {
  console.log("cronjob started")
  const start = new Date()
  await checkAllLndHealth()

  const cronConfig = getCronConfig()
  const results: Array<boolean> = []
  const mongoose = await setupMongoConnection()

  const tasks = [
    // bitcoin related tasks
    rebalancingInternalChannels,
    updateEscrows,
    updatePendingLightningInvoices,
    updatePendingLightningPayments,
    updateLnPaymentsCollection,
    updateRoutingRevenues,
    updateLegacyOnChainReceipt,
    ...(cronConfig.rebalanceEnabled ? [rebalance] : []),
    deleteExpiredPaymentFlows,
    deleteLndPaymentsBefore2Months,
    deleteFailedPaymentsAttemptAllLnds,
  ]

  const PROCESS_KILL_EVENTS = ["SIGTERM", "SIGINT"]
  for (const task of tasks) {
    const taskStart = new Date()

    try {
      logger.info(`starting ${task.name}`)

      const wrappedTask = wrapAsyncToRunInSpan({
        namespace: "cron",
        fnName: task.name,
        fn: async () => {
          const span = addAttributesToCurrentSpan({ jobCompleted: "false" })

          // Same function reference must be passed to process.on & process.removeListener. Listeners
          // aren't removed if an anonymous function or different functions are used
          const signalHandler = async (eventName: string) => {
            const finishDelay = 5_000

            logger.info(`Received ${eventName} signal. Finishing span...`)
            const elapsed = elapsedSinceTimestamp(start)
            recordExceptionInCurrentSpan({
              error: new OperationInterruptedError(
                `Operation was interrupted by '${eventName}' signal after ${elapsed.toLocaleString()}s`,
              ),
              level: ErrorLevel.Critical,
              attributes: { killSignal: eventName, elapsedBeforeKillInSeconds: elapsed },
            })
            span?.end()
            await sleep(finishDelay)
            logger.info(`Finished span with '${finishDelay}'ms delay to flush.`)

            process.exit()
          }

          for (const event of PROCESS_KILL_EVENTS) {
            process.on(event, signalHandler)
          }

          // Always remove listener on loop continue, else signalHandler could target incorrect span
          try {
            const res = await task()

            for (const event of PROCESS_KILL_EVENTS) {
              process.removeListener(event, signalHandler)
            }

            addAttributesToCurrentSpan({ jobCompleted: "true" })

            return res
          } catch (error) {
            for (const event of PROCESS_KILL_EVENTS) {
              process.removeListener(event, signalHandler)
            }
            addAttributesToCurrentSpan({ jobCompleted: "true" })

            throw error
          }
        },
      })

      await wrappedTask()

      logger.info(
        `finished ${task.name} in ${elapsedSinceTimestamp(taskStart)}s (success: true)`,
      )
      results.push(true)
    } catch (error) {
      logger.error({ error }, `issue with task ${task.name}`)

      logger.info(
        `finished ${task.name} in ${elapsedSinceTimestamp(taskStart)}s (success: false)`,
      )
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
