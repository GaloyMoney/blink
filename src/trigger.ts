const lnService = require('ln-service');
import express from 'express';
import { subscribeToChannels, subscribeToInvoices, subscribeToTransactions } from 'ln-service';
import { setupMongoConnection, User } from "./mongodb";
import { sendNotification } from "./notification";
import { getAuth, logger } from './utils';

const { lnd } = lnService.authenticatedLndGrpc(getAuth())
const pino = require('pino-http')({ logger })

const main = async () => {
	lnService.getWalletInfo({ lnd }, (err, result) => {
		logger.debug(err, result)
	});

	const result = await lnService.getChainTransactions({ lnd })

	const subTransactions = subscribeToTransactions({ lnd });
	subTransactions.on('chain_transaction', async tx => {
		logger.debug({ tx })
		if (!tx.is_outgoing) {
			
			let _id
			try {
				({ _id } = await User.findOne({ onchain_addresses: { $in: tx.output_addresses } }, { _id: 1 }))
				if (!_id) {
					//FIXME: Log the onchain address, need to first find which of the tx.output_addresses
					// belongs to us
					const error = `No user associated with the onchain address`
					logger.error(error)
					throw new Error(error)
				}
			} catch (error) {
				logger.error(error)
				throw error
			}
			//FIXME: Maybe USD instead of sats?
			let body = tx.is_confirmed ? 
				`Your wallet has been credited with ${tx.tokens} sats` :
				`You have a pending incoming transaction of ${tx.tokens} sats`
			
			await sendNotification({ title: "New transaction", body, uid: _id })
		}
	});

	const subInvoices = subscribeToInvoices({ lnd });
	subInvoices.on('invoice_updated', invoice => {
		logger.debug(invoice)
	})


	const subChannels = subscribeToChannels({ lnd });
	subChannels.on('channel_opened', channel => {
		logger.debug(channel)
	})

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
}

setupMongoConnection().then(() => main()).catch((err) => logger.error(err))