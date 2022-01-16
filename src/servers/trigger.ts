import { Prices } from "@app"
import * as Wallets from "@app/wallets"
import { ONCHAIN_MIN_CONFIRMATIONS, SECS_PER_5_MINS } from "@config/app"
import { toSats } from "@domain/bitcoin"
import { Storage } from "@google-cloud/storage"
import { LedgerService } from "@services/ledger"
import { activateLndHealthCheck, lndStatusEvent } from "@services/lnd/health"
import { onChannelUpdated } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { ledger, setupMongoConnection } from "@services/mongodb"
import { WalletsRepository } from "@services/mongoose"
import { NotificationsService } from "@services/notifications"
import { updatePriceHistory } from "@services/price/update-price-history"
import { Dropbox } from "dropbox"
import express from "express"
import {
  GetInvoiceResult,
  subscribeToBackups,
  subscribeToBlocks,
  subscribeToChannels,
  subscribeToInvoices,
  subscribeToTransactions,
  SubscribeToTransactionsChainTransactionEvent,
} from "lightning"

import healthzHandler from "./middlewares/healthz"

const logger = baseLogger.child({ module: "trigger" })

export const uploadBackup = async ({ backup, pubkey }) => {
  logger.debug({ backup }, "updating scb on dbx")
  const filename = `${process.env.NETWORK}_lnd_scb_${pubkey}_${Date.now()}`

  try {
    const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN })
    await dbx.filesUpload({ path: `/${filename}`, contents: backup })
    logger.info({ backup }, "scb backed up on dbx successfully")
  } catch (error) {
    logger.error({ error }, "scb backup to dbx failed")
  }

  logger.debug({ backup }, "updating scb on gcs")
  try {
    const storage = new Storage({ keyFilename: process.env.GCS_APPLICATION_CREDENTIALS })
    const bucket = storage.bucket("lnd-static-channel-backups")
    const file = bucket.file(`${filename}`)
    await file.save(backup)
    logger.info({ backup }, "scb backed up on gcs successfully")
  } catch (error) {
    logger.error({ error }, "scb backup to gcs failed")
  }
}

export async function onchainTransactionEventHandler(
  tx: SubscribeToTransactionsChainTransactionEvent,
) {
  logger.info({ tx }, "received new onchain tx event")
  const onchainLogger = logger.child({
    topic: "payment",
    protocol: "onchain",
    tx,
    onUs: false,
  })

  const fee = tx.fee || 0
  const txHash = tx.id as OnChainTxHash

  if (tx.is_outgoing) {
    if (!tx.is_confirmed) {
      return
      // FIXME
      // we have to return here because we will not know whose user the the txid belong to
      // this is because of limitation for lnd onchain wallet. we only know the txid after the
      // transaction has been sent. and this events is trigger before
    }

    const settled = await ledger.settleOnchainPayment(txHash)

    if (!settled) {
      return
    }

    onchainLogger.info(
      { success: true, pending: false, transactionType: "payment" },
      "payment completed",
    )

    const walletId = await LedgerService().getWalletIdByTransactionHash(tx.id)
    if (walletId instanceof Error) {
      logger.info({ tx, walletId }, "impossible to find wallet id")
      return
    }

    const price = await Prices.getCurrentPrice()
    const usdPerSat = price instanceof Error ? undefined : price

    await NotificationsService(onchainLogger).onChainTransactionPayment({
      walletId,
      amount: toSats(Number(tx.tokens) - fee),
      txHash,
      usdPerSat,
    })
  } else {
    // incoming transaction

    const walletsRepo = WalletsRepository()

    const outputAddresses = tx.output_addresses as OnChainAddress[]

    const wallets = await walletsRepo.listByAddresses(outputAddresses)
    if (wallets instanceof Error) return

    // we only handle pending notification here because we wait more than 1 block
    if (!tx.is_confirmed) {
      onchainLogger.info(
        { transactionType: "receipt", pending: true },
        "mempool appearance",
      )

      const price = await Prices.getCurrentPrice()
      const usdPerSat = price instanceof Error ? undefined : price

      wallets.forEach((wallet) =>
        NotificationsService(onchainLogger).onChainTransactionReceivedPending({
          walletId: wallet.id,
          // TODO: tx.tokens represent the total sum, need to segregate amount by address
          amount: toSats(Number(tx.tokens)),
          txHash,
          usdPerSat,
        }),
      )
    }
  }
}

export async function onchainBlockEventhandler({ height }) {
  const scanDepth = ONCHAIN_MIN_CONFIRMATIONS + 1
  const txNumber = await Wallets.updateOnChainReceipt({ scanDepth, logger })
  if (txNumber instanceof Error) {
    logger.error(
      { error: txNumber },
      `error updating onchain receipt for block ${height}`,
    )
    return
  }
  logger.info(`finish block ${height} handler with ${txNumber} transactions`)
}

export const onInvoiceUpdate = async (invoice: GetInvoiceResult) => {
  logger.debug({ invoice }, "onInvoiceUpdate")

  if (!invoice.is_confirmed) {
    return
  }

  const paymentHash = invoice.id as PaymentHash

  await Wallets.updatePendingInvoiceByPaymentHash({ paymentHash, logger })
}

const publishCurrentPrice = () => {
  const interval = 1000 * 30
  const notificationsService = NotificationsService(logger)
  return setInterval(async () => {
    try {
      const usdPerSat = await Prices.getCurrentPrice()
      if (usdPerSat instanceof Error) throw usdPerSat

      notificationsService.priceUpdate(usdPerSat)
    } catch (err) {
      logger.error({ err }, "can't publish the price")
    }
  }, interval)
}

const updatePriceForChart = () => {
  const interval = 1000 * SECS_PER_5_MINS
  return setInterval(async () => {
    try {
      await updatePriceHistory()
    } catch (err) {
      logger.error({ err }, "can't update the price")
    }
  }, interval)
}

const listenerOnchain = ({ lnd }) => {
  const subTransactions = subscribeToTransactions({ lnd })
  subTransactions.on("chain_transaction", onchainTransactionEventHandler)

  subTransactions.on("error", (err) => {
    baseLogger.error({ err }, "error subTransactions")
  })

  const subBlocks = subscribeToBlocks({ lnd })
  subBlocks.on("block", async ({ height }) => {
    await onchainBlockEventhandler({ height })
  })

  subBlocks.on("error", (err) => {
    baseLogger.error({ err }, "error subBlocks")
  })
}

const listenerOffchain = ({ lnd, pubkey }) => {
  const subInvoices = subscribeToInvoices({ lnd })
  subInvoices.on("invoice_updated", onInvoiceUpdate)
  subInvoices.on("error", (err) => {
    baseLogger.info({ err }, "error subInvoices")
    subInvoices.removeAllListeners()
  })

  const subChannels = subscribeToChannels({ lnd })
  subChannels.on("channel_opened", (channel) =>
    onChannelUpdated({ channel, lnd, stateChange: "opened" }),
  )
  subChannels.on("channel_closed", (channel) =>
    onChannelUpdated({ channel, lnd, stateChange: "closed" }),
  )
  subChannels.on("error", (err) => {
    baseLogger.info({ err }, "error subChannels")
    subChannels.removeAllListeners()
  })

  const subBackups = subscribeToBackups({ lnd })
  subBackups.on("backup", ({ backup }) => uploadBackup({ backup, pubkey }))
  subBackups.on("error", (err) => {
    baseLogger.info({ err }, "error subBackups")
    subBackups.removeAllListeners()
  })
}

const main = () => {
  lndStatusEvent.on("started", ({ lnd, pubkey, socket, type }) => {
    baseLogger.info({ socket }, "lnd started")

    if (type.indexOf("onchain") !== -1) {
      listenerOnchain({ lnd })
    }

    if (type.indexOf("offchain") !== -1) {
      listenerOffchain({ lnd, pubkey })
    }
  })

  lndStatusEvent.on("stopped", ({ socket }) => {
    baseLogger.info({ socket }, "lnd stopped")
  })

  activateLndHealthCheck()
  updatePriceForChart()
  publishCurrentPrice()
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
