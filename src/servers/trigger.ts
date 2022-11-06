import EventEmitter from "events"

import express from "express"

import {
  GetInvoiceResult,
  subscribeToBackups,
  subscribeToBlocks,
  subscribeToChannels,
  subscribeToInvoice,
  SubscribeToInvoiceInvoiceUpdatedEvent,
  subscribeToInvoices,
  SubscribeToInvoicesInvoiceUpdatedEvent,
  subscribeToTransactions,
  SubscribeToTransactionsChainTransactionEvent,
} from "lightning"

import { getCronConfig, ONCHAIN_MIN_CONFIRMATIONS } from "@config"

import {
  Prices as PricesWithSpans,
  Wallets as WalletWithSpans,
  Swap as SwapWithSpans,
} from "@app"
import * as Wallets from "@app/wallets"
import { uploadBackup } from "@app/admin/backup"

import { ErrorLevel, WalletCurrency } from "@domain/shared"
import { CouldNotFindWalletInvoiceError } from "@domain/errors"

import { baseLogger } from "@services/logger"
import { onChannelUpdated } from "@services/lnd/utils"
import { setupMongoConnection } from "@services/mongodb"
import { recordExceptionInCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"
import { NotificationsService } from "@services/notifications"
import { activateLndHealthCheck, lndStatusEvent } from "@services/lnd/health"
import { WalletInvoicesRepository } from "@services/mongoose"
import { LndService } from "@services/lnd"
import { LoopService } from "@services/loopd"
import { lnd1LoopConfig, lnd2LoopConfig } from "@app/swap/get-active-loopd"
import { SwapTriggerError } from "@domain/swap/errors"

import healthzHandler from "./middlewares/healthz"

const logger = baseLogger.child({ module: "trigger" })

export const onchainTransactionEventHandler = async (
  tx: SubscribeToTransactionsChainTransactionEvent,
) => {
  logger.info({ tx }, "received new onchain tx event")
  const onchainLogger = logger.child({
    topic: "payment",
    protocol: "onchain",
    tx,
    intraledger: false,
  })

  const txHash = tx.id as OnChainTxHash

  if (tx.is_outgoing) {
    const settled = await Wallets.updateOnChainPaymentsByTxHash({
      txHash,
      logger: onchainLogger,
    })
    if (settled instanceof Error) {
      onchainLogger.error(
        { error: settled, transactionType: "payment" },
        "payment settle fail",
      )
    }
    return
  }

  // incoming transaction
  const notified = await Wallets.notifyOnChainReceiptUnconfirmedByTxHash({
    txHash,
    logger: onchainLogger,
  })
  if (notified instanceof Error) {
    onchainLogger.error(
      { error: notified, transactionType: "receipt" },
      "receipt notification fail",
    )
  }
}

export const onchainBlockEventHandler = async (height: number) => {
  const scanDepth = (ONCHAIN_MIN_CONFIRMATIONS + 1) as ScanDepth
  const txNumber = await WalletWithSpans.updateOnChainReceipt({ scanDepth, logger })
  if (txNumber instanceof Error) {
    logger.error(
      { error: txNumber },
      `error updating onchain receipt for block ${height}`,
    )
    return
  }
  logger.info(`finish block ${height} handler with ${txNumber} transactions`)
}

export const invoiceUpdateEventHandler = async (
  invoice: SubscribeToInvoiceInvoiceUpdatedEvent | GetInvoiceResult,
): Promise<boolean | ApplicationError> => {
  logger.info({ invoice }, "invoiceUpdateEventHandler")
  return invoice.is_held
    ? WalletWithSpans.updatePendingInvoiceByPaymentHash({
        paymentHash: invoice.id as PaymentHash,
        logger,
      })
    : false
}

export const publishSingleCurrentPrice = async () => {
  const displayCurrencyPerSat = await PricesWithSpans.getCurrentPrice()
  if (displayCurrencyPerSat instanceof Error) {
    return logger.error({ err: displayCurrencyPerSat }, "can't publish the price")
  }
  NotificationsService().priceUpdate(displayCurrencyPerSat)
}

const publishCurrentPrice = () => {
  const interval: Seconds = (1000 * 30) as Seconds
  return setInterval(async () => {
    await publishSingleCurrentPrice()
  }, interval)
}

const listenerOnchain = (lnd: AuthenticatedLnd) => {
  const subTransactions = subscribeToTransactions({ lnd })
  const onChainTxHandler = wrapAsyncToRunInSpan({
    root: true,
    namespace: "servers.trigger",
    fn: onchainTransactionEventHandler,
  })
  subTransactions.on("chain_transaction", onChainTxHandler)

  subTransactions.on("error", (err) => {
    baseLogger.error({ err }, "error subTransactions")
    recordExceptionInCurrentSpan({
      error: err,
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subTransactions" },
    })
  })

  const subBlocks = subscribeToBlocks({ lnd })
  const onChainBlockHandler = wrapAsyncToRunInSpan({
    root: true,
    namespace: "servers.trigger",
    fnName: "onchainBlockEventHandler",
    fn: ({ height }: { height: number }) => onchainBlockEventHandler(height),
  })
  subBlocks.on("block", onChainBlockHandler)

  subBlocks.on("error", (err) => {
    baseLogger.error({ err }, "error subBlocks")
    recordExceptionInCurrentSpan({
      error: err,
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subBlocks" },
    })
  })
}

const listenerHodlInvoice = ({
  lnd,
  paymentHash,
}: {
  lnd: AuthenticatedLnd
  paymentHash: PaymentHash
}) => {
  const subInvoice = subscribeToInvoice({ lnd, id: paymentHash })
  const invoiceUpdateHandler = wrapAsyncToRunInSpan({
    root: true,
    namespace: "servers.trigger",
    fn: invoiceUpdateEventHandler,
  })
  subInvoice.on(
    "invoice_updated",
    async (invoice: SubscribeToInvoiceInvoiceUpdatedEvent) => {
      if (invoice.is_confirmed || invoice.is_canceled) {
        subInvoice.removeAllListeners()
      } else {
        await invoiceUpdateHandler(invoice)
      }
    },
  )
  subInvoice.on("error", (err) => {
    baseLogger.info({ err }, "error subChannels")
    recordExceptionInCurrentSpan({
      error: err,
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subChannels" },
    })
    subInvoice.removeAllListeners()
  })
}

const listenerExistingHodlInvoices = async ({
  lnd,
  pubkey,
}: {
  lnd: AuthenticatedLnd
  pubkey: Pubkey
}) => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const invoices = await lndService.listInvoices(lnd)
  if (invoices instanceof Error) return invoices

  for (const lnInvoice of invoices) {
    if (lnInvoice.isHeld) {
      const walletInvoice = await WalletInvoicesRepository().findByPaymentHash(
        lnInvoice.paymentHash,
      )
      const declineArgs = {
        pubkey,
        paymentHash: lnInvoice.paymentHash,
        logger: baseLogger,
      }
      if (walletInvoice instanceof CouldNotFindWalletInvoiceError) {
        Wallets.declineHeldInvoice(declineArgs)
        continue
      }
      if (walletInvoice instanceof Error) {
        continue
      }
      if (walletInvoice.recipientWalletDescriptor.currency !== WalletCurrency.Btc) {
        Wallets.declineHeldInvoice(declineArgs)
        continue
      }
    }

    if (lnInvoice.isSettled || lnInvoice.isCanceled) {
      continue
    }

    listenerHodlInvoice({ lnd, paymentHash: lnInvoice.paymentHash })
  }
}

export const setupInvoiceSubscribe = ({
  lnd,
  pubkey,
  subInvoices,
}: {
  lnd: AuthenticatedLnd
  pubkey: Pubkey
  subInvoices: EventEmitter
}) => {
  subInvoices.on("invoice_updated", (invoice: SubscribeToInvoicesInvoiceUpdatedEvent) =>
    // Note: canceled and expired invoices don't come in here, only confirmed check req'd
    !invoice.is_confirmed
      ? listenerHodlInvoice({ lnd, paymentHash: invoice.id as PaymentHash })
      : undefined,
  )
  subInvoices.on("error", (err) => {
    baseLogger.info({ err }, "error subInvoices")
    recordExceptionInCurrentSpan({
      error: err,
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subInvoices" },
    })
    subInvoices.removeAllListeners()
  })

  listenerExistingHodlInvoices({ lnd, pubkey })
}

const listenerOffchain = ({ lnd, pubkey }: { lnd: AuthenticatedLnd; pubkey: Pubkey }) => {
  const subInvoices = subscribeToInvoices({ lnd })

  setupInvoiceSubscribe({ lnd, pubkey, subInvoices })

  const subChannels = subscribeToChannels({ lnd })
  subChannels.on("channel_opened", (channel) =>
    onChannelUpdated({ channel, lnd, stateChange: "opened" }),
  )
  subChannels.on("channel_closed", (channel) =>
    onChannelUpdated({ channel, lnd, stateChange: "closed" }),
  )
  subChannels.on("error", (err) => {
    baseLogger.info({ err }, "error subChannels")
    recordExceptionInCurrentSpan({
      error: err,
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subChannels" },
    })
    subChannels.removeAllListeners()
  })

  const subBackups = subscribeToBackups({ lnd })
  const newBackupHandler = wrapAsyncToRunInSpan({
    root: true,
    namespace: "servers.trigger",
    fnName: "uploadBackup",
    fn: ({ backup }: { backup: string }) => uploadBackup(logger)({ backup, pubkey }),
  })
  subBackups.on("backup", newBackupHandler)

  subBackups.on("error", (err) => {
    baseLogger.info({ err }, "error subBackups")
    recordExceptionInCurrentSpan({
      error: err,
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subBackups" },
    })
    subBackups.removeAllListeners()
  })
}

const startSwapMonitor = async (swapService: ISwapService) => {
  const isSwapServerUp = await swapService.healthCheck()
  baseLogger.info({ isSwapServerUp }, "isSwapServerUp")
  if (isSwapServerUp) {
    const listener = swapService.swapListener()
    listener.on("data", (response) => {
      baseLogger.info({ response }, "Swap Listener Called")
      SwapWithSpans.handleSwapOutCompleted(response)
    })
  }
}

const listenerSwapMonitor = async () => {
  try {
    const loopServiceLnd1 = LoopService(lnd1LoopConfig())
    const loopServiceLnd2 = LoopService(lnd2LoopConfig())
    startSwapMonitor(loopServiceLnd1)
    startSwapMonitor(loopServiceLnd2)
  } catch (e) {
    return new SwapTriggerError(e)
  }
}

const main = () => {
  lndStatusEvent.on("started", ({ lnd, pubkey, socket, type }: LndParamsAuthed) => {
    baseLogger.info({ socket }, "lnd started")

    if (type.indexOf("onchain") !== -1) {
      listenerOnchain(lnd)
    }

    if (type.indexOf("offchain") !== -1) {
      listenerOffchain({ lnd, pubkey })
    }
  })

  lndStatusEvent.on("stopped", ({ socket }) => {
    baseLogger.info({ socket }, "lnd stopped")
  })

  activateLndHealthCheck()
  publishCurrentPrice()

  if (getCronConfig().swapEnabled) listenerSwapMonitor()

  console.log("trigger server ready")
}

const healthCheck = () => {
  const app = express()
  const port = process.env.PORT || 8888
  app.get(
    "/healthz",
    healthzHandler({
      checkDbConnectionStatus: true,
      checkRedisStatus: true,
      checkLndsStatus: true,
    }),
  )
  app.listen(port, () => logger.info(`Health check listening on port ${port}!`))
}

// only execute if it is the main module
if (require.main === module) {
  healthCheck()
  setupMongoConnection()
    .then(main)
    .catch((err) => logger.error(err))
}
