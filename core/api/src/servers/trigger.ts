import EventEmitter from "events"

import express from "express"
import {
  GetInvoiceResult,
  subscribeToBackups,
  subscribeToBlocks,
  SubscribeToBlocksBlockEvent,
  subscribeToChannels,
  subscribeToInvoice,
  SubscribeToInvoiceInvoiceUpdatedEvent,
  subscribeToInvoices,
  SubscribeToInvoicesInvoiceUpdatedEvent,
  subscribeToPayments,
  SubscribeToPaymentsPaymentEvent,
  subscribeToTransactions,
  SubscribeToTransactionsChainTransactionEvent,
} from "lightning"
import debounce from "lodash.debounce"

import { SubscriptionInterruptedError } from "./errors"

import { briaEventHandler } from "./event-handlers/bria"

import healthzHandler from "./middlewares/healthz"

import { MS_PER_5_MINS, NETWORK, ONCHAIN_MIN_CONFIRMATIONS, TRIGGER_PORT } from "@/config"

import { Lightning, Payments, Wallets as WalletWithSpans } from "@/app"
import { uploadBackup } from "@/app/admin/backup"
import * as Prices from "@/app/prices"
import * as Wallets from "@/app/wallets"

import { TxDecoder } from "@/domain/bitcoin/onchain"
import { CacheKeys } from "@/domain/cache"
import { CouldNotFindWalletFromOnChainAddressError } from "@/domain/errors"
import { checkedToDisplayCurrency } from "@/domain/fiat"
import { DEFAULT_EXPIRATIONS } from "@/domain/bitcoin/lightning/invoice-expiration"
import { ErrorLevel, paymentAmountFromNumber, WalletCurrency } from "@/domain/shared"

import { BriaSubscriber } from "@/services/bria"
import { RedisCacheService } from "@/services/cache"
import { LedgerService } from "@/services/ledger"
import { LndService } from "@/services/lnd"
import { activateLndHealthCheck, lndStatusEvent } from "@/services/lnd/health"
import { onChannelUpdated } from "@/services/lnd/utils"
import { baseLogger } from "@/services/logger"
import { setupMongoConnection } from "@/services/mongodb"
import { NotificationsService } from "@/services/notifications"
import { recordExceptionInCurrentSpan, wrapAsyncToRunInSpan } from "@/services/tracing"

const redisCache = RedisCacheService()
const logger = baseLogger.child({ module: "trigger" })

const handleLndPendingIncomingOnChainTx = async ({
  tx,
  logger,
}: {
  tx: SubscribeToTransactionsChainTransactionEvent
  logger: Logger
}) => {
  if (!tx.transaction) return

  const txHash = tx.id as OnChainTxHash
  const recorded = await LedgerService().isOnChainTxHashRecorded(txHash)
  if (recorded) {
    if (recorded instanceof Error) {
      logger.error({ error: recorded }, "Could not query ledger")
      return recorded
    }
    return
  }

  const outs = TxDecoder(NETWORK).decode(tx.transaction).outs
  for (const { vout, sats, address } of outs) {
    const satoshis = paymentAmountFromNumber({
      amount: sats,
      currency: WalletCurrency.Btc,
    })
    if (satoshis instanceof Error || address === null) continue

    const res = await Wallets.addPendingTransaction({
      txId: txHash,
      vout,
      satoshis,
      address,
    })

    if (res instanceof CouldNotFindWalletFromOnChainAddressError) {
      continue
    }
    if (res instanceof Error) {
      logger.error(
        { error: res },
        `error adding txid:vout "${tx.id}:${vout}" to pending txns repository`,
      )
    }
  }
}

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

  if (!tx.is_outgoing) {
    redisCache.clear({ key: CacheKeys.LastOnChainTransactions })
    if (!tx.is_confirmed) {
      await handleLndPendingIncomingOnChainTx({ tx, logger: onchainLogger })
    }
  }
}

export const onchainBlockEventHandler = async (height: number) => {
  const scanDepth = (ONCHAIN_MIN_CONFIRMATIONS + 1) as ScanDepth
  const txNumber = await WalletWithSpans.updateLegacyOnChainReceipt({ scanDepth, logger })
  if (txNumber instanceof Error) {
    logger.error(
      { error: txNumber },
      `error updating onchain receipt for block ${height}`,
    )
    return
  }
  logger.info(`finish block ${height} handler with ${txNumber} transactions`)
}

export const publishCurrentPrices = async () => {
  const currencies = await Prices.listCurrencies()
  if (currencies instanceof Error) {
    return logger.error(
      { err: currencies },
      "can't query currencies and publish the price",
    )
  }

  for (const { code } of currencies) {
    const displayCurrency = checkedToDisplayCurrency(code)
    if (displayCurrency instanceof Error) continue

    const pricePerSat = await Prices.getCurrentSatPrice({
      currency: displayCurrency,
    })
    if (pricePerSat instanceof Error) {
      return logger.error({ err: pricePerSat }, "can't publish the price")
    }

    const pricePerUsdCent = await Prices.getCurrentUsdCentPrice({
      currency: displayCurrency,
    })
    if (pricePerUsdCent instanceof Error) {
      return logger.error({ err: pricePerUsdCent }, "can't publish the price")
    }

    NotificationsService().priceUpdate({ pricePerSat, pricePerUsdCent })
  }
}

const publishCurrentPrice = () => {
  const interval: Seconds = (1000 * 30) as Seconds
  return setInterval(async () => {
    await publishCurrentPrices()
  }, interval)
}

const watchHeldInvoices = () => {
  return setInterval(async () => {
    const heldInvoicesCount = await Lightning.getHeldInvoicesCount()
    if (heldInvoicesCount instanceof Error) return
    if (heldInvoicesCount > 0) {
      await Wallets.handleHeldInvoices(logger)
    }
  }, MS_PER_5_MINS)
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
      error: new SubscriptionInterruptedError((err && err.message) || "subTransactions"),
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subTransactions" },
    })
  })

  const subBlocks = subscribeToBlocks({ lnd })
  const onChainBlockHandler = wrapAsyncToRunInSpan({
    root: true,
    namespace: "servers.trigger",
    fnName: "onchainBlockEventHandler",
    fn: ({ height }: SubscribeToBlocksBlockEvent) => onchainBlockEventHandler(height),
  })
  const debouncedOnChainBlockHandler = debounce(onChainBlockHandler, 1000, {
    leading: true,
    trailing: false,
  })
  subBlocks.on("block", debouncedOnChainBlockHandler)

  subBlocks.on("error", (err) => {
    baseLogger.error({ err }, "error subBlocks")
    recordExceptionInCurrentSpan({
      error: new SubscriptionInterruptedError((err && err.message) || "subBlocks"),
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subBlocks" },
    })
  })
}

const invoiceUpdateHandler = wrapAsyncToRunInSpan({
  root: true,
  namespace: "servers.trigger",
  fn: async (
    invoice: SubscribeToInvoiceInvoiceUpdatedEvent | GetInvoiceResult,
  ): Promise<boolean | ApplicationError> => {
    logger.info({ invoice }, "invoiceUpdateEventHandler")
    return invoice.is_held
      ? WalletWithSpans.handleHeldInvoiceByPaymentHash({
          paymentHash: invoice.id as PaymentHash,
          logger,
        })
      : false
  },
})

const setupListenerForHodlInvoice = ({
  lnd,
  paymentHash,
}: {
  lnd: AuthenticatedLnd
  paymentHash: PaymentHash
}) => {
  const subInvoice = subscribeToInvoice({ lnd, id: paymentHash })

  subInvoice.on(
    "invoice_updated",
    async (
      invoice: SubscribeToInvoiceInvoiceUpdatedEvent,
    ): Promise<boolean | ApplicationError> => {
      if (invoice.is_confirmed || invoice.is_canceled) {
        subInvoice.removeAllListeners()
        return true
      }

      return invoiceUpdateHandler(invoice)
    },
  )

  subInvoice.on("error", (err) => {
    baseLogger.info({ err }, "error subChannels")
    recordExceptionInCurrentSpan({
      error: new SubscriptionInterruptedError((err && err.message) || "subInvoice"),
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subInvoice" },
    })
    subInvoice.removeAllListeners()
  })
}

const setupListenersForExistingHodlInvoices = async ({
  lnd,
  pubkey,
}: {
  lnd: AuthenticatedLnd
  pubkey: Pubkey
}) => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const { delay } = DEFAULT_EXPIRATIONS[WalletCurrency.Btc]
  const createdAfter = new Date(new Date().getTime() - delay * 2 * 1000)

  const invoices = lndService.listInvoices({ pubkey, createdAfter })
  if (invoices instanceof Error) return invoices

  for await (const lnInvoice of invoices) {
    if (lnInvoice.isSettled || lnInvoice.isCanceled) {
      continue
    }

    if (lnInvoice.isHeld) {
      await Wallets.handleHeldInvoiceByPaymentHash({
        paymentHash: lnInvoice.paymentHash,
        logger,
      })
      continue
    }

    setupListenerForHodlInvoice({ lnd, paymentHash: lnInvoice.paymentHash })
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
  // Setup listener that sets up a new listener for each new invoice created
  subInvoices.on("invoice_updated", (invoice: SubscribeToInvoicesInvoiceUpdatedEvent) =>
    // Note: canceled and expired invoices don't come in here, only confirmed check req'd
    !invoice.is_confirmed
      ? setupListenerForHodlInvoice({ lnd, paymentHash: invoice.id as PaymentHash })
      : undefined,
  )
  subInvoices.on("error", (err) => {
    baseLogger.info({ err }, "error subInvoices")
    recordExceptionInCurrentSpan({
      error: new SubscriptionInterruptedError((err && err.message) || "subInvoices"),
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subInvoices" },
    })
    subInvoices.removeAllListeners()
  })

  // Setup listeners for existing invoices
  setupListenersForExistingHodlInvoices({ lnd, pubkey })

  // Update existing held invoices
  Wallets.handleHeldInvoices(logger)
}

export const setupPaymentSubscribe = async ({
  subPayments,
}: {
  subPayments: EventEmitter
}) => {
  const paymentUpdateHandler = wrapAsyncToRunInSpan({
    root: true,
    namespace: "servers.trigger",
    fnName: "paymentUpdateEventHandler",
    fn: async (payment: SubscribeToPaymentsPaymentEvent) => {
      logger.info({ payment }, "paymentUpdateEventHandler")

      const paymentHash = payment.id as PaymentHash
      return Payments.updatePendingPaymentByHash({ paymentHash, logger })
    },
  })

  subPayments.on("confirmed", paymentUpdateHandler)
  subPayments.on("failed", paymentUpdateHandler)
  subPayments.on("error", (err) => {
    baseLogger.info({ err }, "error subPayments")
    recordExceptionInCurrentSpan({
      error: new SubscriptionInterruptedError((err && err.message) || "subPayments"),
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subPayments" },
    })
    subPayments.removeAllListeners()
  })

  // Update existing pending payments
  Payments.updatePendingPayments(logger)
}

const listenerOffchain = ({ lnd, pubkey }: { lnd: AuthenticatedLnd; pubkey: Pubkey }) => {
  const subInvoices = subscribeToInvoices({ lnd })
  setupInvoiceSubscribe({ lnd, pubkey, subInvoices })

  const subPayments = subscribeToPayments({ lnd })
  setupPaymentSubscribe({ subPayments })

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
      error: new SubscriptionInterruptedError((err && err.message) || "subChannels"),
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
      error: new SubscriptionInterruptedError((err && err.message) || "subBackups"),
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subBackups" },
    })
    subBackups.removeAllListeners()
  })
}

const listenerBria = async () => {
  const wrappedBriaEventHandler = wrapAsyncToRunInSpan({
    namespace: "servers.trigger",
    fn: briaEventHandler,
  })

  const subBria = await BriaSubscriber().subscribeToAll(wrappedBriaEventHandler)
  if (subBria instanceof Error) {
    baseLogger.error({ err: subBria }, "error initializing bria subscriber")
    return
  }

  baseLogger.info("bria listener started")
}

const main = () => {
  listenerBria()

  lndStatusEvent.on("started", ({ lnd, pubkey, socket, type }: LndConnect) => {
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
  watchHeldInvoices()

  console.log("trigger server ready")
}

const healthCheck = () => {
  const app = express()
  const port = TRIGGER_PORT
  app.get(
    "/healthz",
    healthzHandler({
      checkDbConnectionStatus: true,
      checkRedisStatus: true,
      checkLndsStatus: true,
      checkBriaStatus: false,
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
