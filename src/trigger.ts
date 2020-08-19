import { InvoiceUser, setupMongoConnection } from "./mongodb";

const lnService = require('ln-service');
import express from 'express';
import { subscribeToChannels, subscribeToInvoices, subscribeToTransactions } from 'ln-service';
import { getAuth, logger, onchainTransactionEventHandler } from './utils';
import { LightningUserWallet } from "./LightningUserWallet";

const { lnd } = lnService.authenticatedLndGrpc(getAuth())

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
			const lightningAdminWallet = new LightningUserWallet({ uid: invoiceUser.uid })
			await lightningAdminWallet.updatePendingInvoice({hash: invoice.id})
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