import express from 'express';
import { subscribeToChannels, subscribeToInvoices, subscribeToTransactions, subscribeToBackups } from 'ln-service';
import { Storage } from '@google-cloud/storage'
import { find } from "lodash";
import { InvoiceUser, setupMongoConnection, Transaction, User, MainBook } from "./mongodb";
import { lightningAccountingPath, openChannelFees } from "./ledger";
import { sendInvoicePaidNotification, sendNotification } from "./notification";
import { IDataNotification } from "./types";
import { getAuth, baseLogger } from './utils';
import { WalletFactory } from "./walletFactory";
const crypto = require("crypto")
const lnService = require('ln-service');

const logger = baseLogger.child({ module: "trigger" })

const txsReceived = new Set()

const uploadBackup = async (backup) => {
  logger.debug({backup}, "updating scb on gcs")
  const storage = new Storage({ keyFilename: process.env.GCS_APPLICATION_CREDENTIALS })
  const bucket = storage.bucket('lnd-static-channel-backups')
  const file = bucket.file('scb.json')
  await file.save(backup)
  logger.info({backup}, "scb backed up on gcs successfully")
}

export async function onchainTransactionEventHandler(tx) {

  // workaround for https://github.com/lightningnetwork/lnd/issues/2267
  // a lock might be necessary
  const hash = crypto.createHash('sha256').update(JSON.stringify(tx)).digest('base64');
  if (txsReceived.has(hash)) {
    return
  }
  txsReceived.add(hash)


  logger.debug({ tx }, "received new onchain tx event")
  const onchainLogger = logger.child({ topic: "payment", protocol: "onchain", hash: tx.id, onUs: false })

  if (tx.is_outgoing) {
    if (!tx.is_confirmed) {
      return
      // FIXME 
      // we have to return here because we will not know whose user the the txid belond to
      // this is because of limitation for lnd onchain wallet. we only know the txid after the 
      // transaction has been sent. and this events is trigger before
    }

    await Transaction.updateMany({ hash: tx.id }, { pending: false })
    onchainLogger.info({ success: true, pending: false, transactionType: "payment" }, "payment completed")
    const entry = await Transaction.findOne({ account_path: { $all: ["Liabilities", "Customer"] }, hash: tx.id })

    const title = `Your on-chain transaction has been confirmed`
    const data: IDataNotification = {
      type: "onchain_payment",
      hash: tx.id,
      amount: tx.tokens,
    }
    await sendNotification({ uid: entry.account_path[2], title, data, logger })
  } else {
    // TODO: the same way Lightning is updating the wallet/accounting, 
    // this event should update the onchain wallet/account of the associated user

    let _id
    try {
      ({ _id } = await User.findOne({ onchain_addresses: { $in: tx.output_addresses } }, { _id: 1 }))
      if (!_id) {
        //FIXME: Log the onchain address, need to first find which of the tx.output_addresses belongs to us
        logger.fatal({ tx }, `No user associated with the onchain address`)
        return
      }
    } catch (error) {
      logger.error(error, "issue in onchainTransactionEventHandler to get User id attached to output_addresses")
      throw error
    }
    const data: IDataNotification = {
      type: "onchain_receipt",
      amount: Number(tx.tokens),
      txid: tx.id
    }

    if (tx.is_confirmed === false) {
      onchainLogger.info({ transactionType: "receipt", pending: true }, "mempool apparence")
    } else {
      // onchain is currently only BTC
      const wallet = WalletFactory({ uid: _id, currency: "BTC", logger })
      await wallet.updateOnchainReceipt()
    }

    const title = tx.is_confirmed ?
      `Your wallet has been credited with ${tx.tokens} sats` :
      `You have a pending incoming transaction of ${tx.tokens} sats`
    await sendNotification({ title, uid: _id, data, logger })
  }
}

export const onInvoiceUpdate = async invoice => {
  logger.debug(invoice)

  if (!invoice.is_confirmed) {
    return
  }

  // FIXME: we're making 2x the request to Invoice User here. One in trigger, one in lighning.
  const invoiceUser = await InvoiceUser.findOne({ _id: invoice.id, pending: true })
  if (invoiceUser) {
    const uid = invoiceUser.uid
    const hash = invoice.id as string

    const wallet = WalletFactory({ uid, currency: invoiceUser.currency, logger })
    await wallet.updatePendingInvoice({ hash })
    await sendInvoicePaidNotification({ amount: invoice.received, hash, uid, logger })
  } else {
    logger.fatal({ invoice }, "we received an invoice but had no user attached to it")
  }
}

export const onChannelOpened = async ({ channel, lnd }) => {

  if (channel.is_partner_initiated) {
    logger.debug({ channel }, "channel opened to us")
    return
  }

  logger.debug({ channel }, "channel opened by us")

  const { transaction_id } = channel

  const { transactions } = await lnService.getChainTransactions({ lnd })

  const { fee } = find(transactions, { id: transaction_id })

  const metadata = { currency: "BTC", txid: transaction_id, type: "fee" }

  await MainBook.entry("on chain fee")
    .debit(lightningAccountingPath, fee, { ...metadata, })
    .credit(openChannelFees, fee, { ...metadata })
    .commit()

  logger.info({ success: true, channel, fee, ...metadata }, `open channel fee added to mongodb`)
}

const main = async () => {
  const { lnd } = lnService.authenticatedLndGrpc(getAuth())

  lnService.getWalletInfo({ lnd }, (err, result) => {
    logger.debug({ err, result }, 'getWalletInfo')
  });

  const subInvoices = subscribeToInvoices({ lnd });
  subInvoices.on('invoice_updated', onInvoiceUpdate)

  const subTransactions = subscribeToTransactions({ lnd });
  subTransactions.on('chain_transaction', onchainTransactionEventHandler);

  const subChannels = subscribeToChannels({ lnd });
  subChannels.on('channel_opened', (channel) => onChannelOpened({ channel, lnd }))

  const subBackups = subscribeToBackups({ lnd })
  subBackups.on('backup', ({ backup }) => uploadBackup(backup))

}

const healthCheck = () => {
  const { lnd } = lnService.authenticatedLndGrpc(getAuth())

  const app = express()
  const port = 8888
  app.get('/health', (req, res) => {
    lnService.getWalletInfo({ lnd }, (err,) => !err ? res.sendStatus(200) : res.sendStatus(500));
  })
  app.listen(port, () => logger.info(`Health check listening on port ${port}!`))
}

// only execute if it is the main module
if (require.main === module) {
  healthCheck()
  setupMongoConnection().then(main).catch((err) => logger.error(err))
}
