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

const main = async () => {
	const User = mongoose.model("User")
	// lnService.getWalletInfo({ lnd }, (err, result) => {
	// 	console.log(err, result)
	// });
	const result = await lnService.getChainTransactions({ lnd })

	const subTransactions = subscribeToTransactions({ lnd });
	subTransactions.on('chain_transaction', async tx => {
		console.log({ tx })
		if (!tx.is_outgoing) {
			const { phone } = await User.findOne({ onchain_addresses: { $in: tx.output_addresses } }, { phone: 1 })
			console.log(phone)
			//FIXME: Maybe USD instead of sats?
			const body = `You have a pending incoming txn of ${tx.tokens} sats`
			await sendText({ body, to: phone })
		}
	});

	const subInvoices = subscribeToInvoices({ lnd });
	subInvoices.on('invoice_updated', invoice => {
		console.log(invoice)
	})


	const subChannels = subscribeToChannels({ lnd });
	subChannels.on('channel_opened', channel => {
		console.log(channel)
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
	app.listen(port, () => console.log(`Health check listening on port ${port}!`))
}

setupMongoConnection().then(() => main()).catch((err) => console.log(err))