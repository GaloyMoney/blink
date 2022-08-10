import { wrapAsyncToRunInSpan } from "@services/tracing"

import {
  deleteExpiredLightningPaymentFlows,
  deleteExpiredWalletInvoice,
  deleteFailedPaymentsAttemptAllLnds,
  getDirectChannels,
  getLnds,
  nodesPubKey,
  updateEscrows,
  updateRoutingRevenues,
} from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"

import { activateLndHealthCheck } from "@services/lnd/health"
import { ColdStorage, Lightning, Wallets, Payments } from "@app"
import { getCronConfig, TWO_MONTHS_IN_MS } from "@config"

import { reconnect, pushPayment } from "balanceofsatoshis/network"
import { LndService } from "@services/lnd"

const logger = baseLogger.child({ module: "cron" })

const main = async () => {
  const cronConfig = getCronConfig()
  const results: Array<boolean> = []
  const mongoose = await setupMongoConnection()

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

  const reconnectNodes = async () => {
    const lndService = LndService()
    if (lndService instanceof Error) throw lndService

    const lndsParamsAuth = getLnds({ type: "offchain" })
    for (const { lnd } of lndsParamsAuth) {
      await reconnect({ lnd })
    }
  }

  const rebalancingInternalChannels = async () => {
    const lndService = LndService()
    if (lndService instanceof Error) throw lndService

    const lnds = getLnds({ type: "offchain", active: true })

    if (lnds.length !== 2 || nodesPubKey.length !== 2) {
      // TODO: rebalancing for more nodes
      baseLogger.warn("rebalancing needs 2 active internal nodes")
      return
    }

    const selfLnd = lnds[0].lnd
    const otherLnd = lnds[1].lnd
    const selfPubkey = lnds[0].pubkey
    const otherPubkey = lnds[1].pubkey

    const { channels } = await getDirectChannels({ lnd: selfLnd, otherPubkey })
    for (const channel of channels) {
      const diff = channel.capacity / 2 /* half point */ - channel.local_balance
      if (diff > 0) {
        // there is more liquidity on the other node
        pushPayment({ lnd: otherLnd, amount: diff, destination: selfPubkey })
      } else {
        // there is more liquidity on the local node
        pushPayment({ lnd: selfLnd, amount: diff, destination: otherPubkey })
      }
    }
  }

  const tasks = [
    reconnectNodes,
    rebalancingInternalChannels,
    updateEscrows,
    updatePendingLightningInvoices,
    updatePendingLightningPayments,
    updateLnPaymentsCollection,
    updateRoutingRevenues,
    updateOnChainReceipt,
    ...(cronConfig.rebalanceEnabled ? [rebalance] : []),
    deleteExpiredPaymentFlows,
    deleteExpiredInvoices,
    deleteLndPaymentsBefore2Months,
    deleteFailedPaymentsAttemptAllLnds,
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
