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

import { activateLndHealthCheck, lndStatusEvent } from "@services/lnd/health"
import { onChannelUpdated } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { ledger, setupMongoConnection } from "@services/mongodb"
import { InvoiceUser, User } from "@services/mongoose/schema"

import { transactionNotification } from "@core/notifications/payment"
import { Price } from "@core/price-impl"
import { WalletFactory } from "@core/wallet-factory"
import { getOnChainTransactions } from "@core/on-chain"
import { runInParallel } from "@core/utils"
import { ONCHAIN_MIN_CONFIRMATIONS } from "@config/app"

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

    const user = await User.findOne({ _id: userId })
    await transactionNotification({
      type: "onchain_payment",
      user,
      amount: Number(tx.tokens) - tx.fee,
      txid: tx.id,
      logger: onchainLogger,
    })
  } else {
    // incoming transaction

    let user
    try {
      user = await User.findOne({ "onchain.address": { $in: tx.output_addresses } })
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

      await transactionNotification({
        type: "onchain_receipt_pending",
        user,
        logger: onchainLogger,
        amount: Number(tx.tokens),
        txid: tx.id,
      })
    }
  }
}

export async function onchainBlockEventhandler({ lnd, height }) {
  const lookBack = ONCHAIN_MIN_CONFIRMATIONS + 1
  const onchainTxns = await getOnChainTransactions({ lnd, lookBack, incoming: true })
  const hasTransactions = onchainTxns && onchainTxns.length

  if (!hasTransactions) {
    logger.info(`no transaction to handle, skipping block ${height}`)
    return
  }

  await runInParallel({
    iterator: onchainTxns.values(),
    logger,
    workers: 5,
    processor: async (tx, index) => {
      logger.trace("updating onchain tx %o in worker %d", tx.id, index)

      const user = await User.findOne({ "onchain.address": { $in: tx.output_addresses } })

      if (user && tx.is_confirmed) {
        logger.trace("updating onchain receipt for user %o in worker %d", user._id, index)

        const wallet = await WalletFactory({ user, logger })
        await wallet.updateOnchainReceipt()
      }
    },
  })

  logger.info(`finish block ${height} handler with ${onchainTxns.length} transactions`)
}

export const onInvoiceUpdate = async (invoice) => {
  logger.debug({ invoice }, "onInvoiceUpdate")

  if (!invoice.is_confirmed) {
    return
  }

  const invoiceUser = await InvoiceUser.findOne({ _id: invoice.id })
  if (invoiceUser) {
    const uid = invoiceUser.uid
    const hash = invoice.id

    const user = await User.findOne({ _id: uid })
    const wallet = await WalletFactory({ user, logger })
    await wallet.updatePendingInvoice({ hash, pubkey: invoiceUser.pubkey })
    await transactionNotification({
      type: "paid-invoice",
      amount: invoice.received,
      hash,
      user,
      logger,
    })
  } else {
    logger.fatal({ invoice }, "we received an invoice but had no user attached to it")
  }
}

const updatePriceForChart = () => {
  const price = new Price({ logger: baseLogger })
  const interval = 1000 * 30
  return setInterval(async function () {
    try {
      await price.update()
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
    await onchainBlockEventhandler({ lnd, height })
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
