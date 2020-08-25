/**
 * @jest-environment node
 */
import { setupMongoConnection, User } from "../mongodb"
// this import needs to be before medici

import { LightningAdminWallet } from "../LightningAdminImpl"
import { sleep } from "../utils"
const mongoose = require("mongoose");
const { once } = require('events');

const lnService = require('ln-service')

import {lndMain, lndOutside1, lndOutside2, bitcoindClient, RANDOM_ADDRESS, checkIsBalanced, waitUntilBlockHeight} from "../tests/helper"

export const logger = require('pino')({ level: "debug" })

const local_tokens = 10000000

const blockHeightInit = 127

let adminWallet

beforeAll(async () => {
	await setupMongoConnection()
	const admin = await User.findOne({role: "admin"})
	adminWallet = new LightningAdminWallet({uid: admin._id})
})

afterAll(async () => {
	return await mongoose.connection.close()
})

const newBlock = 6

const openChannel = async ({lnd, other_lnd, socket, blockHeight}) => {

	await waitUntilBlockHeight({lnd: lndMain, blockHeight})
	await waitUntilBlockHeight({lnd: other_lnd, blockHeight})

	const { public_key } = await lnService.getWalletInfo({ lnd: other_lnd })

	let openChannelPromise

	if (lnd === lndMain) {
		openChannelPromise = adminWallet.openChannel({ local_tokens, public_key, socket })

	} else {
		openChannelPromise = lnService.openChannel({ lnd, local_tokens, 
			partner_public_key: public_key, partner_socket: socket })
	}
	
	const sub = lnService.subscribeToChannels({lnd})
	await once(sub, 'channel_opening')
	sub.removeAllListeners()

	const mineBlock = async () => {
		await bitcoindClient.generateToAddress(newBlock, RANDOM_ADDRESS)
		await waitUntilBlockHeight({lnd: lndMain, blockHeight: blockHeight + newBlock})
		await waitUntilBlockHeight({lnd: other_lnd, blockHeight: blockHeight + newBlock})
	}

	logger.debug("mining blocks and waiting for channel being opened")

	await Promise.all([
		openChannelPromise,
		// error: https://github.com/alexbosworth/ln-service/issues/122
		// need to investigate.
		// once(sub, 'channel_opened'),
		sleep(5000),
		mineBlock(),
	])

	await adminWallet.updateEscrows()
	await checkIsBalanced()
}

it('opens channel from lnd1 to lndOutside1', async () => {
	const socket = `lnd-outside-1:9735`
	await openChannel({lnd: lndMain, other_lnd: lndOutside1, socket, blockHeight: blockHeightInit})

	const { channels } = await lnService.getChannels({ lnd: lndMain })
	expect(channels.length).toEqual(1)

}, 100000)

it('opens channel from lndOutside1 to lndOutside2', async () => {
	const socket = `lnd-outside-2:9735`

	// const {subscribeToGraph} = require('ln-service');
	const subscription = lnService.subscribeToGraph({lnd:lndMain});
	
	await Promise.all([
		openChannel({lnd: lndOutside1, other_lnd: lndOutside2, socket, blockHeight: blockHeightInit + 6}),
		once(subscription, 'channel_updated')
	])

	subscription.removeAllListeners();

	const { channels } = await lnService.getChannels({ lnd: lndOutside1 })
	expect(channels.length).toEqual(2)
}, 240000)

it('opens channel from lndOutside1 to lnd1', async () => {
	const socket = `lnd-service:9735`
	await openChannel({lnd: lndOutside1, other_lnd: lndMain, socket, blockHeight: blockHeightInit + 12})

	{
		const { channels } = await lnService.getChannels({ lnd: lndMain })
		expect(channels.length).toEqual(2)
	}

	{
		const { channels } = await lnService.getChannels({ lnd: lndOutside1 })
		expect(channels.length).toEqual(3)
	}

}, 100000)