import EventEmitter from "events"

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
import express from "express"
import debounce from "lodash.debounce"

import { BTC_NETWORK, getSwapConfig, ONCHAIN_MIN_CONFIRMATIONS } from "@config"

import {
  Payments,
  Prices as PricesWithSpans,
  Swap as SwapWithSpans,
  Wallets as WalletWithSpans,
} from "@app"
import * as Wallets from "@app/wallets"
import { uploadBackup } from "@app/admin/backup"
import { lnd1LoopConfig, lnd2LoopConfig } from "@app/swap/get-active-loopd"

import {
  CouldNotFindWalletFromOnChainAddressError,
  CouldNotFindWalletInvoiceError,
} from "@domain/errors"
import { CacheKeys } from "@domain/cache"
import { SwapTriggerError } from "@domain/swap/errors"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { ErrorLevel, paymentAmountFromNumber, WalletCurrency } from "@domain/shared"
import { checkedToDisplayCurrency } from "@domain/fiat"

import { WalletInvoicesRepository } from "@services/mongoose"
import { LndService } from "@services/lnd"
import { baseLogger } from "@services/logger"
import { LoopService } from "@services/loopd"
import { BriaSubscriber } from "@services/bria"
import { LedgerService } from "@services/ledger"
import { RedisCacheService } from "@services/cache"
import { onChannelUpdated } from "@services/lnd/utils"
import { setupMongoConnection } from "@services/mongodb"
import { NotificationsService } from "@services/notifications"
import { activateLndHealthCheck, lndStatusEvent } from "@services/lnd/health"
import { recordExceptionInCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"

import healthzHandler from "./middlewares/healthz"
import { SubscriptionInterruptedError } from "./errors"
import { briaEventHandler } from "./event-handlers/bria"

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

  const outs = TxDecoder(BTC_NETWORK).decode(tx.transaction).outs
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

export const publishCurrentPrices = async () => {
  const currencies = await PricesWithSpans.listCurrencies()
  if (currencies instanceof Error) {
    return logger.error(
      { err: currencies },
      "can't query currencies and publish the price",
    )
  }

  for (const { code } of currencies) {
    const displayCurrency = checkedToDisplayCurrency(code)
    if (displayCurrency instanceof Error) continue

    const pricePerSat = await PricesWithSpans.getCurrentSatPrice({
      currency: displayCurrency,
    })
    if (pricePerSat instanceof Error) {
      return logger.error({ err: pricePerSat }, "can't publish the price")
    }

    const pricePerUsdCent = await PricesWithSpans.getCurrentUsdCentPrice({
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
      error: new SubscriptionInterruptedError((err && err.message) || "subInvoice"),
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subInvoice" },
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
      error: new SubscriptionInterruptedError((err && err.message) || "subInvoices"),
      level: ErrorLevel.Warn,
      attributes: { ["error.subscription"]: "subInvoices" },
    })
    subInvoices.removeAllListeners()
  })

  listenerExistingHodlInvoices({ lnd, pubkey })
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
  } catch (err) {
    return new SwapTriggerError(err)
  }
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

  if (getSwapConfig().feeAccountingEnabled) listenerSwapMonitor()

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
