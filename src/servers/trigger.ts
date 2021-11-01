import { Storage } from "@google-cloud/storage"
import crypto from "crypto"
import { Dropbox } from "dropbox"
import express from "express"
import {
  subscribeToBackups,
  subscribeToBlocks,
  subscribeToChannels,
  subscribeToInvoices,
  subscribeToTransactions,
} from "lightning"
import { PriceService } from "@services/price"
import { activateLndHealthCheck, lndStatusEvent } from "@services/lnd/health"
import { onChannelUpdated } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { ledger, setupMongoConnection } from "@services/mongodb"
import { User } from "@services/mongoose/schema"
import { transactionNotification } from "@services/notifications/payment"
import { updatePriceHistory } from "@services/price/update-price-history"
import { ONCHAIN_MIN_CONFIRMATIONS, SAT_USDCENT_PRICE } from "@config/app"
import * as Wallets from "@app/wallets"
import pubsub from "@services/pubsub"
import { PriceService } from "@services/price"
import { NotificationsService } from "@services/notifications"
import { toSats } from "@domain/bitcoin"

const logger = baseLogger.child({ module: "trigger" })

const txsReceived = new Set()

export const uploadBackup = async ({ backup, pubkey }) => {
  logger.debug({ backup }, "updating scb on dbx")
  const filename = `${process.env.NETWORK}_lnd_scb_${pubkey}`

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

export async function onchainTransactionEventHandler(tx) {
  // workaround for https://github.com/lightningnetwork/lnd/issues/2267
  const hash = crypto.createHash("sha256").update(JSON.stringify(tx)).digest("base64")
  if (txsReceived.has(hash)) {
    return
  }
  txsReceived.add(hash)

  logger.info({ tx }, "received new onchain tx event")
  const onchainLogger = logger.child({
    topic: "payment",
    protocol: "onchain",
    tx,
    onUs: false,
  })

  if (tx.is_outgoing) {
    if (!tx.is_confirmed) {
      return
      // FIXME
      // we have to return here because we will not know whose user the the txid belong to
      // this is because of limitation for lnd onchain wallet. we only know the txid after the
      // transaction has been sent. and this events is trigger before
    }

    const settled = await ledger.settleOnchainPayment(tx.id)

    if (!settled) {
      return
    }

    onchainLogger.info(
      { success: true, pending: false, transactionType: "payment" },
      "payment completed",
    )

    const accountPath = await ledger.getAccountByTransactionHash(tx.id)
    const userId = ledger.resolveAccountId(accountPath)

    if (!userId) {
      return
    }

    const user = await User.findOne({ _id: userId }, { lastIPs: 0, lastConnection: 0 })
    const price = await PriceService().getCurrentPrice()
    const usdPerSat = price instanceof Error ? undefined : price
    await NotificationsService(onchainLogger).onChainTransactionPayment({
      walletId: user.id,
      amount: toSats(Number(tx.tokens) - tx.fee),
      txId: tx.id,
      usdPerSat,
    })
  } else {
    // incoming transaction

    let user
    try {
      user = await User.findOne(
        { "onchain.address": { $in: tx.output_addresses } },
        { lastIPs: 0, lastConnection: 0 },
      )
      if (!user) {
        //FIXME: Log the onchain address, need to first find which of the tx.output_addresses belongs to us
        onchainLogger.fatal(`No user associated with the onchain address`)
        return
      }
    } catch (error) {
      onchainLogger.error(
        { error },
        "issue in onchainTransactionEventHandler to get User id attached to output_addresses",
      )
      throw error
    }

    // we only handle pending notification here because we wait more than 1 block
    if (!tx.is_confirmed) {
      onchainLogger.info(
        { transactionType: "receipt", pending: true },
        "mempool appearence",
      )

      const price = await PriceService().getCurrentPrice()
      const usdPerSat = price instanceof Error ? undefined : price
      await NotificationsService(onchainLogger).onChainTransactionReceivedPending({
        walletId: user.id,
        amount: toSats(Number(tx.tokens)),
        txId: tx.id,
        usdPerSat,
      })
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

export const onInvoiceUpdate = async (invoice) => {
  logger.debug({ invoice }, "onInvoiceUpdate")

  if (!invoice.is_confirmed) {
    return
  }

  await Wallets.updatePendingInvoiceByPaymentHash({ paymentHash: invoice.id, logger })
}

const publishCurrentPrice = async () => {
  const satsPrice = await PriceService().getCurrentPrice()
  if (satsPrice instanceof Error) return

  pubsub.publish(SAT_USDCENT_PRICE, { satUsdCentPrice: 100 * satsPrice })
}

const updatePriceForChart = () => {
  const interval = 1000 * 30
  return setInterval(async function () {
    try {
      await updatePriceHistory()
      await publishCurrentPrice()
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
}

const healthCheck = () => {
  const app = express()
  const port = 8888
  app.get("/healthz", (req, res) => res.sendStatus(200))
  app.listen(port, () => logger.info(`Health check listening on port ${port}!`))
}

// only execute if it is the main module
if (require.main === module) {
  healthCheck()
  setupMongoConnection()
    .then(main)
    .catch((err) => logger.error(err))
}
