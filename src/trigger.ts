const lnService = require('ln-service');
import {
	subscribeToTransactions,
	subscribeToInvoices,
	subscribeToChannels,
} from 'ln-service'

import fetch from "node-fetch";
import express from 'express'
const mongoose = require("mongoose");
import { getAuth, onchainTransactionEventHandler } from './utils'
import { sendText } from './text'
import { setupMongoConnection, User } from "./mongodb"
const { lnd } = lnService.authenticatedLndGrpc(getAuth())


import { logger } from "./utils"
const pino = require('pino-http')({ logger })

const main = async () => {
	lnService.getWalletInfo({ lnd }, (err, result) => {
		logger.debug(err, result)
	});

	const result = await lnService.getChainTransactions({ lnd })

	const subTransactions = subscribeToTransactions({ lnd });
	subTransactions.on('chain_transaction', onchainTransactionEventHandler);

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