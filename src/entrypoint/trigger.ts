import { Storage } from '@google-cloud/storage';
import { assert } from "console";
import { Dropbox } from "dropbox";
import express from 'express';
import { subscribeToBackups, subscribeToChannels, subscribeToInvoices, subscribeToTransactions, subscribeToBlocks } from 'ln-service';
import { find } from "lodash";
import { lndAccountingPath, lndFeePath } from "../ledger/ledger";
import { lnd } from "../lndConfig";
import { MainBook, setupMongoConnection } from "../mongodb";
import { sendInvoicePaidNotification, sendNotification } from "../notification";
import { Price } from "../priceImpl";
import { IDataNotification } from "../types";
import { baseLogger, LOOK_BACK } from '../utils';
import { WalletFactory } from "../walletFactory";

import crypto from "crypto"
import lnService from 'ln-service'
import { getHeight, getWalletInfo } from 'lightning'
import { InvoiceUser, Transaction, User } from "../schema";
import { updateUsersPendingPayment } from '../ledger/balanceSheet';

//millitokens per million
const FEE_RATE = 2500

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
    const bucket = storage.bucket('lnd-static-channel-backups')
    const file = bucket.file(`${process.env.NETWORK}_lnd_scb`)
    await file.save(backup)
    logger.info({ backup }, "scb backed up on gcs successfully")
  } catch (error) {
    logger.error({ error }, "scb backup to gcs failed")
  }


}

export async function onchainTransactionEventHandler(tx) {

  // workaround for https://github.com/lightningnetwork/lnd/issues/2267
  // a lock might be necessary
  const hash = crypto.createHash('sha256').update(JSON.stringify(tx)).digest('base64');
  if (txsReceived.has(hash)) {
    return
  }
  txsReceived.add(hash)

  logger.info({ tx }, "received new onchain tx event")
  const onchainLogger = logger.child({ topic: "payment", protocol: "onchain", tx, onUs: false })

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

    const user = await User.findOne({"_id": entry.account_path[2]})
    await sendNotification({ user, title, data, logger: onchainLogger })
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
      onchainLogger.error({ error }, "issue in onchainTransactionEventHandler to get User id attached to output_addresses")
      throw error
    }
    const data: IDataNotification = {
      type: "onchain_receipt",
      amount: Number(tx.tokens),
      txid: tx.id
    }

    if (tx.is_confirmed === false) {
      onchainLogger.info({ transactionType: "receipt", pending: true }, "mempool appearence")
    } else {
      // onchain is currently only BTC
      const wallet = await WalletFactory({ user, logger: onchainLogger })
      await wallet.updateOnchainReceipt()
    }

    const satsPrice = await new Price({ logger: onchainLogger }).lastPrice()
    const usd = (tx.tokens * satsPrice).toFixed(2)

    const title = tx.is_confirmed ?
      `You received $${usd} | ${tx.tokens} sats` :
      `$${usd} | ${tx.tokens} sats is on its way to your wallet`
    await sendNotification({ title, user, data, logger: onchainLogger })
  }
}

export const onInvoiceUpdate = async invoice => {
  logger.debug(invoice)

  if (!invoice.is_confirmed) {
    return
  }

  // FIXME: we're making 2x the request to Invoice User here. One in trigger, one in lighning.
  const invoiceUser = await InvoiceUser.findOne({ _id: invoice.id })
  if (invoiceUser) {
    const uid = invoiceUser.uid
    const hash = invoice.id as string

    const user = await User.findOne({_id: uid})
    const wallet = await WalletFactory({ user, logger })
    await wallet.updatePendingInvoice({ hash })
    await sendInvoicePaidNotification({ amount: invoice.received, hash, user, logger })
  } else {
    logger.fatal({ invoice }, "we received an invoice but had no user attached to it")
  }
}

export const onChannelUpdated = async ({ channel, lnd, stateChange }: { channel: any, lnd: any, stateChange: "opened" | "closed" }) => {
  if (channel.is_partner_initiated) {
    logger.info({ channel }, `channel ${stateChange} to us`)
    return
  }
  
  // FIXME we are already accounting for close fee in the escrow.
  // need to remove the associated escrow transaction to correctly account for fees
  if (stateChange === "closed") {
    return
  }


  logger.info({ channel }, `channel ${stateChange} by us`)
  const { transaction_id } = channel

  // TODO: dedupe from onchain
  const { current_block_height } = await getHeight({ lnd })
  const after = Math.max(0, current_block_height - LOOK_BACK) // this is necessary for tests, otherwise after may be negative
  const { transactions } = await lnService.getChainTransactions({ lnd, after })

  const { fee } = find(transactions, { id: transaction_id })

  const metadata = { currency: "BTC", txid: transaction_id, type: "fee", pending: false }

  assert(fee > 0)

  await MainBook.entry(`channel ${stateChange} onchain fee`)
    .debit(lndFeePath, fee, { ...metadata, })
    .credit(lndAccountingPath, fee, { ...metadata })
    .commit()

  logger.info({ channel, fee, ...metadata }, `${stateChange} channel fee added to mongodb`)
}

const updatePrice = async () => {
  const price = new Price({ logger: baseLogger })

  const _1minInterval = 1000 * 30

  setInterval(async function () {
    try {
      await price.update()
      await price.fastUpdate()
    } catch (err) {
      logger.error({ err }, "can't update the price")
    }
  }, _1minInterval)
}

const main = async () => {
  getWalletInfo({ lnd }, (err, result) => {
    logger.debug({ err, result }, 'getWalletInfo')
  });

  const subInvoices = subscribeToInvoices({ lnd });
  subInvoices.on('invoice_updated', onInvoiceUpdate)

  const subTransactions = subscribeToTransactions({ lnd });
  subTransactions.on('chain_transaction', onchainTransactionEventHandler);

  const subChannels = subscribeToChannels({ lnd });
  subChannels.on('channel_opened', (channel) => onChannelUpdated({ channel, lnd, stateChange: "opened" }))
  subChannels.on('channel_closed', (channel) => onChannelUpdated({ channel, lnd, stateChange: "closed" }))

  const subBackups = subscribeToBackups({ lnd })
  subBackups.on('backup', ({ backup }) => uploadBackup(backup))

  const subBlocks = subscribeToBlocks({ lnd })
  subBlocks.on('block', updateUsersPendingPayment)

  updatePrice()
}

const healthCheck = () => {
  const app = express()
  const port = 8888
  app.get('/health', (req, res) => {
    getWalletInfo({ lnd }, (err, ) => !err ? res.sendStatus(200) : res.sendStatus(500));
  })
  app.listen(port, () => logger.info(`Health check listening on port ${port}!`))
}

// only execute if it is the main module
if (require.main === module) {
  healthCheck()
  setupMongoConnection().then(main).catch((err) => logger.error(err))
}
