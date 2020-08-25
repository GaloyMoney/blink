import { InvoiceUser, setupMongoConnection, Transaction, User } from "./mongodb";

const lnService = require('ln-service');
import express from 'express';
import { subscribeToChannels, subscribeToInvoices, subscribeToTransactions } from 'ln-service';
import { getAuth, logger } from './utils';
import { LightningUserWallet } from "./LightningUserWallet";
import { sendNotification } from "./notification";
import { IDataNotification } from "./types";

const { lnd } = lnService.authenticatedLndGrpc(getAuth())


export async function onchainTransactionEventHandler(tx) {
  if (tx.is_outgoing) {
    if (tx.is_confirmed) {
      await Transaction.updateMany({ hash: tx.id }, { pending: false })
    }
    const entry = await Transaction.findOne({ account_path: { $all : ["Liabilities", "Customers"] }, hash: tx.id })
    const title = `You on-chain transaction has been confirmed`
    const data: IDataNotification = {
      type: "onchain_payment",
      hash: tx.id,
      amount: tx.tokens,
    }
    await sendNotification({uid: entry.account_path[2], title, data})
  } else {
    let _id
    try {
      ({ _id } = await User.findOne({ onchain_addresses: { $in: tx.output_addresses } }, { _id: 1 }))
      if (!_id) {
        //FIXME: Log the onchain address, need to first find which of the tx.output_addresses
        // belongs to us
        const error = `No user associated with the onchain address`
        logger.warn(error)
        return
      }
    } catch (error) {
        logger.error(error)
        throw error
    }
    const data: IDataNotification = {
      type: "onchain_receipt",
      amount: Number(tx.tokens),
      txid: tx.id
    }
    const title = tx.is_confirmed ?
      `Your wallet has been credited with ${tx.tokens} sats` :
      `You have a pending incoming transaction of ${tx.tokens} sats`
    await sendNotification({ title, uid: _id, data })
  }
}


const main = async () => {	
  lnService.getWalletInfo({ lnd }, (err, result) => {
    logger.debug(err, result)
  });

  const subInvoices = subscribeToInvoices({ lnd });
  subInvoices.on('invoice_updated', async invoice => {
    logger.debug(invoice)

    if (!invoice.is_confirmed) {
      return
    }

    // FIXME: we're making 2x the request to Invoice User here. One in trigger, one in lighning.
    const invoiceUser = await InvoiceUser.findOne({ _id: invoice.id, pending: true })
    if (invoiceUser) {
      const uid = invoiceUser.uid
      const hash = invoice.id as string

      const lightningAdminWallet = new LightningUserWallet({ uid })
      await lightningAdminWallet.updatePendingInvoice({ hash })
      const data: IDataNotification = {
        type: "paid-invoice",
        hash,
        amount: invoice.received
      }
      await sendNotification({uid, title: `You receive a payment of ${invoice.received} sats`, data})
    } else {
      logger.warn({invoice}, "we received an invoice but had no user attached to it")
    }
  })

  const subTransactions = subscribeToTransactions({ lnd });
  subTransactions.on('chain_transaction', onchainTransactionEventHandler);
  
  const subChannels = subscribeToChannels({ lnd });
  subChannels.on('channel_opened', channel => {
    logger.info(channel)
  })
}

const app = express()
const port = 8888
app.get('/health', (req, res) => {
  lnService.getWalletInfo({ lnd }, (err, result) => {
    if (err === null) {
      return res.sendStatus(200)
    } else {
      return res.sendStatus(500)
    }
  });
})
app.listen(port, () => logger.debug(`Health check listening on port ${port}!`))

setupMongoConnection().then(main).catch((err) => logger.error(err))