const lnService = require('ln-service');
import {
	subscribeToTransactions,
	subscribeToInvoices,
	subscribeToChannels,
} from 'ln-service'

import fetch from "node-fetch";
import express from 'express'
const mongoose = require("mongoose");
import { getAuth } from './utils'
import { sendText } from './text'
import { setupMongoConnection } from "./mongodb"
const { lnd } = lnService.authenticatedLndGrpc(getAuth())


import { logger } from "./utils"
const pino = require('pino-http')({ logger })

const main = async () => {
	const User = mongoose.model("User")

	lnService.getWalletInfo({ lnd }, (err, result) => {
		logger.debug(err, result)
	});

	const result = await lnService.getChainTransactions({ lnd })

	const subTransactions = subscribeToTransactions({ lnd });
	subTransactions.on('chain_transaction', async tx => {
		logger.debug({ tx })
		if (!tx.is_outgoing) {
			let phone
			try {
				({ phone } = await User.findOne({ onchain_addresses: { $in: tx.output_addresses } }, { phone: 1 }))
				if (!phone) {
					//FIXME: Log the onchain address, need to first find which of the tx.output_addresses
					// belongs to us
					const error = `No phone number associated with the onchain address`
					logger.error(error)
					throw new Error(error)
				}
			} catch (error) {
				logger.error(error)
				throw error
			}
			//FIXME: Maybe USD instead of sats?
			const body = `You have a pending incoming txn of ${tx.tokens} sats`
			await sendText({ body, to: phone })
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