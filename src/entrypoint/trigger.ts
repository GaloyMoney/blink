import { Storage } from "@google-cloud/storage"
import { assert } from "console"
import crypto from "crypto"
import { Dropbox } from "dropbox"
import express from "express"
import {
  SubscribeToChannelsChannelClosedEvent,
  SubscribeToChannelsChannelOpenedEvent,
  AuthenticatedLnd,
  getChainTransactions,
  getHeight,
  getWalletInfo,
  subscribeToBackups,
  subscribeToBlocks,
  subscribeToChannels,
  subscribeToInvoices,
  subscribeToTransactions,
} from "lightning"
import { find } from "lodash"
import { updateUsersPendingPayment } from "../ledger/balanceSheet"
import { lndAccountingPath, lndFeePath } from "../ledger/ledger"
import { lnd } from "../lndConfig"
import { baseLogger } from "../logger"
import { MainBook, setupMongoConnection } from "../mongodb"
import { transactionNotification } from "../notifications/payment"
import { Price } from "../priceImpl"
import { InvoiceUser, Transaction, User } from "../schema"
import { LOOK_BACK } from "../utils"
import { WalletFactory } from "../walletFactory"

const logger = baseLogger.child({ module: "trigger" })

const txsReceived = new Set()

export const uploadBackup = async (backup) => {
  logger.debug({ backup }, "updating scb on dbx")
  try {
    const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN })
    await dbx.filesUpload({ path: `/${process.env.NETWORK}_lnd_scb`, contents: backup })
    logger.info({ backup }, "scb backed up on dbx successfully")
  } catch (error) {
    logger.error({ error }, "scb backup to dbx failed")
  }

  logger.debug({ backup }, "updating scb on gcs")
  try {
    const storage = new Storage({ keyFilename: process.env.GCS_APPLICATION_CREDENTIALS })
    const bucket = storage.bucket("lnd-static-channel-backups")
    const file = bucket.file(`${process.env.NETWORK}_lnd_scb`)
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

    await Transaction.updateMany({ hash: tx.id }, { pending: false })
    onchainLogger.info(
      { success: true, pending: false, transactionType: "payment" },
      "payment completed",
    )
    const entry = await Transaction.findOne({
      account_path: { $all: ["Liabilities", "Customer"] },
      hash: tx.id,
    })

    const user = await User.findOne({ _id: entry.account_path[2] })
    await transactionNotification({
      type: "onchain_payment",
      user,
      amount: Number(tx.tokens) - tx.fee,
      txid: tx.id,
      logger: onchainLogger,
    })
  } else {
    // incoming transaction

    // TODO: the same way Lightning is updating the wallet/accounting,
    // this event should update the onchain wallet/account of the associated user

    let user
    try {
      user = await User.findOne({ onchain_addresses: { $in: tx.output_addresses } })
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

    if (tx.is_confirmed === false) {
      onchainLogger.info(
        { transactionType: "receipt", pending: true },
        "mempool appearence",
      )
    } else {
      // onchain is currently only BTC
      const wallet = await WalletFactory({ user, logger: onchainLogger })
      await wallet.updateOnchainReceipt()
    }

    const type = tx.is_confirmed ? "onchain_receipt" : "onchain_receipt_pending"
    await transactionNotification({
      type,
      user,
      logger: onchainLogger,
      amount: Number(tx.tokens),
      txid: tx.id,
    })
  }
}

export const onInvoiceUpdate = async (invoice) => {
  logger.debug(invoice)

  if (!invoice.is_confirmed) {
    return
  }

  const invoiceUser = await InvoiceUser.findOne({ _id: invoice.id })
  if (invoiceUser) {
    const uid = invoiceUser.uid
    const hash = invoice.id as string

    const user = await User.findOne({ _id: uid })
    const wallet = await WalletFactory({ user, logger })
    await wallet.updatePendingInvoice({ hash })
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

export const onChannelUpdated = async ({
  channel,
  lnd,
  stateChange,
}: {
  channel: SubscribeToChannelsChannelClosedEvent | SubscribeToChannelsChannelOpenedEvent
  lnd: AuthenticatedLnd
  stateChange: "opened" | "closed"
}) => {
  logger.info({ channel, stateChange }, `channel update`)

  if (channel.is_partner_initiated) {
    return
  }

  if (stateChange === "closed") {
    // FIXME: need to account for channel closing
    return
  }

  let txid

  if (stateChange === "opened") {
    ;({ transaction_id: txid } = channel as SubscribeToChannelsChannelOpenedEvent)
  } else if (stateChange === "closed") {
    ;({ close_transaction_id: txid } = channel as SubscribeToChannelsChannelClosedEvent)
  }

  // TODO: dedupe from onchain
  const { current_block_height } = await getHeight({ lnd })
  const after = Math.max(0, current_block_height - LOOK_BACK) // this is necessary for tests, otherwise after may be negative
  const { transactions } = await getChainTransactions({ lnd, after })
  // end dedupe

  const tx = find(transactions, { id: txid })

  if (!tx?.fee) {
    logger.error({ transactions }, "fee doesn't exist")
    return
  }

  const fee = tx.fee

  // let tx
  // try {
  //   tx = await bitcoindDefaultClient.getRawTransaction(txid, true /* include_watchonly */ )
  // } catch (err) {
  //   logger.error({err}, "can't fetch fee for closing tx")
  // }

  // TODO: there is no fee currently given by bitcoind for raw transaction
  // either calculate it from the input, or use an indexer
  // const { fee } = tx.fee

  const metadata = { currency: "BTC", txid, type: "fee", pending: false }

  assert(fee > 0)

  await MainBook.entry(`channel ${stateChange} onchain fee`)
    .debit(lndFeePath, fee, { ...metadata })
    .credit(lndAccountingPath, fee, { ...metadata })
    .commit()

  logger.info(
    { channel, fee, ...metadata },
    `${stateChange} channel fee added to mongodb`,
  )
}

const updatePriceForChart = async () => {
  const price = new Price({ logger: baseLogger })

  const interval = 1000 * 30

  setInterval(async function () {
    try {
      await price.update()
    } catch (err) {
      logger.error({ err }, "can't update the price")
    }
  }, interval)
}

const main = async () => {
  getWalletInfo({ lnd }, (err, result) => {
    logger.debug({ err, result }, "getWalletInfo")
  })

  const subInvoices = subscribeToInvoices({ lnd })
  subInvoices.on("invoice_updated", onInvoiceUpdate)

  const subTransactions = subscribeToTransactions({ lnd })
  subTransactions.on("chain_transaction", onchainTransactionEventHandler)

  const subChannels = subscribeToChannels({ lnd })
  subChannels.on("channel_opened", (channel) =>
    onChannelUpdated({ channel, lnd, stateChange: "opened" }),
  )
  subChannels.on("channel_closed", (channel) =>
    onChannelUpdated({ channel, lnd, stateChange: "closed" }),
  )

  const subBackups = subscribeToBackups({ lnd })
  subBackups.on("backup", ({ backup }) => uploadBackup(backup))

  const subBlocks = subscribeToBlocks({ lnd })
  subBlocks.on("block", updateUsersPendingPayment)

  updatePriceForChart()
}

const healthCheck = () => {
  const app = express()
  const port = 8888
  app.get("/healthz", (req, res) => {
    getWalletInfo({ lnd }, (err) => (!err ? res.sendStatus(200) : res.sendStatus(500)))
  })
  app.listen(port, () => logger.info(`Health check listening on port ${port}!`))
}

// only execute if it is the main module
if (require.main === module) {
  healthCheck()
  setupMongoConnection()
    .then(main)
    .catch((err) => logger.error(err))
}
