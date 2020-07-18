/**
 * @jest-environment node
 */
import { setupMongoConnection } from "../db"
// this import needs to be before medici

import { LightningAdminWallet } from "../LightningAdminImpl"
import { sleep, getAuth, waitUntilBlockHeight } from "../utils"
import { checkIsBalanced } from "../utils_for_tst";
const mongoose = require("mongoose");
const { once } = require('events');

//TODO: Choose between camel case or underscores for variable naming
const BitcoindClient = require('bitcoin-core')
const lnService = require('ln-service')
const cert = process.env.TLS

const RANDOM_ADDRESS = "2N1AdXp9qihogpSmSBXSSfgeUFgTYyjVWqo"
const BLOCK_SUBSIDY = 50 * 10 ** 8

let macaroon2 = process.env.MACAROONOUTSIDE1
let macaroon3 = process.env.MACAROONOUTSIDE2

let lnd_outside_1_addr = process.env.LNDOUTSIDE1ADDR
let lnd_outside_2_addr = process.env.LNDOUTSIDE2ADDR

let bitcoind_addr = process.env.BITCOINDADDR
let bitcoind_port = process.env.BITCOINDPORT

let lnd_outside_1_rpc_port = process.env.LNDOUTSIDE1RPCPORT
let lnd_outside_2_rpc_port = process.env.LNDOUTSIDE2RPCPORT
// let lnd_addr = 'lnd-service'
// let lnd_outside_1_addr = 'lnd-outside-1'
// let lnd_outside_2_addr = 'lnd-outside-2'
// let bitcoind_addr = 'bitcoind-service'
// let bitcoind_port = 18443
// let lnd_rpc_port, lnd_outside_1_rpc_port  = 10009, 10009

let bitcoindClient

let lnd1
let lndOutside1
let lndOutside2

const User = mongoose.model("User")

const local_tokens = 1000000

beforeAll(async () => {

	lndOutside1 = lnService.authenticatedLndGrpc({
		cert,
		macaroon: macaroon2,
		socket: `${lnd_outside_1_addr}:${lnd_outside_1_rpc_port}`,
	}).lnd;

	lndOutside2 = lnService.authenticatedLndGrpc({
		cert,
		macaroon: macaroon3,
		socket: `${lnd_outside_2_addr}:${lnd_outside_2_rpc_port}`,
	}).lnd;

	lnd1 = lnService.authenticatedLndGrpc(getAuth()).lnd

	await setupMongoConnection()

	// try {
	// 	await mongoose.connection.dropCollection('users')
	// } catch (err) {
	// 	// console.log("can't drop the collection, probably because it doesn't exist")
	// 	console.log(err)
	// }

	const connection_obj = {
		network: 'regtest', username: 'rpcuser', password: 'rpcpass',
		host: bitcoind_addr, port: bitcoind_port
	}

	bitcoindClient = new BitcoindClient(connection_obj)

})

afterAll(async () => {
	return await mongoose.connection.close()
})

const newBlock = 6

const openChannel = async ({lnd, other_lnd, socket, blockHeight}) => {

	await waitUntilBlockHeight({lnd: lnd1, blockHeight})
	await waitUntilBlockHeight({lnd: other_lnd, blockHeight})

	const { public_key } = await lnService.getWalletInfo({ lnd: other_lnd })
	console.log({public_key})

	let openChannelPromise
	let adminWallet

	if (lnd === lnd1) {
		// TODO: dedupe
		const admin = await User.findOne({role: "admin"})
		adminWallet = new LightningAdminWallet({uid: admin._id})
		openChannelPromise = adminWallet.openChannel({ local_tokens, public_key, socket })

	} else {
		openChannelPromise = lnService.openChannel({ lnd, local_tokens, 
			partner_public_key: public_key, partner_socket: socket })
	}
	
	const sub = lnService.subscribeToChannels({lnd})

	console.log("channel opening")
	await once(sub, 'channel_opening');

	const mineBlock = async () => {
		await bitcoindClient.generateToAddress(newBlock, RANDOM_ADDRESS)
		await waitUntilBlockHeight({lnd: lnd1, blockHeight: blockHeight + newBlock})
		await waitUntilBlockHeight({lnd: other_lnd, blockHeight: blockHeight + newBlock})
	}

	console.log("mining blocks and waiting for channel being opened")

	await Promise.all([
		openChannelPromise,
		// error: https://github.com/alexbosworth/ln-service/issues/122
		// need to investigate.
		// once(sub, 'channel_opened'),
		sleep(5000),
		mineBlock(),
	])

	sub.removeAllListeners();

	if (lnd === lnd1) {
		await adminWallet.updateEscrows()
	}

	await checkIsBalanced()
}

it('opens channel from lnd1 to lndOutside1', async () => {
	const socket = `lnd-outside-1:9735`

	await openChannel({lnd: lnd1, other_lnd: lndOutside1, socket, blockHeight: 116})

	const { channels } = await lnService.getChannels({ lnd: lnd1 })
	expect(channels.length).toEqual(1)

}, 100000)

it('opens channel from lndOutside1 to lndOutside2', async () => {
	const lnd = lndOutside1
	const socket = `lnd-outside-2:9735`

	await openChannel({lnd, other_lnd: lndOutside2, socket, blockHeight: 122})

	const { channels } = await lnService.getChannels({ lnd: lndOutside1 })
	expect(channels.length).toEqual(2)
}, 100000)
