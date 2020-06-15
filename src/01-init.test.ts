/**
 * @jest-environment node
 */
import { setupMongoConnection } from "./db"
// this import needs to be before medici

import { LightningAdminWallet } from "./LightningAdminImpl"
import { sleep, getAuth, waitForNodeSync } from "./utils"
const mongoose = require("mongoose");

//TODO: Choose between camel case or underscores for variable naming
const BitcoindClient = require('bitcoin-core')
const lnService = require('ln-service')
const cert = process.env.TLS

const RANDOM_ADDRESS = "2N1AdXp9qihogpSmSBXSSfgeUFgTYyjVWqo"

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

let bank_address
let lndOutside1_wallet_addr

let admin_uid

const User = mongoose.model("User")

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

	await setupMongoConnection()

	try {
		await mongoose.connection.dropCollection('users')
	} catch (err) {
		console.log(err)
	}
})

afterAll(async () => {
  return await mongoose.connection.close()
})

it('I can connect to bitcoind', async () => {
	const connection_obj = { 
		network: 'regtest', username: 'rpcuser', password: 'rpcpass',
		host: bitcoind_addr, port: bitcoind_port }
	bitcoindClient = new BitcoindClient(connection_obj)
	const { chain } = await bitcoindClient.getBlockchainInfo()
	expect(chain).toEqual('regtest')
})

it('I can connect to bank lnd', async () => {
	// TODO
})

it('I can connect to outside lnds', async () => {
	const lnds = [lndOutside1, lndOutside2]
	for (const lnd of lnds) {
		const {current_block_height} = await lnService.getWalletInfo({ lnd })
		expect(current_block_height).toBe(0)
	}
})

it('I can connect to mongodb', async () => {
	const users = await User.find({})
	expect(users).toStrictEqual([])
})

it('creating bank "admin" user', async () => {
	// FIXME there should be an API for this
	await new User({}).save()
	const users = await User.find({})
	expect(users.length).toBe(1)

	admin_uid = users[0]._id
})

it('getting bank address', async () => {
	const users = await User.find({})
	admin_uid = users[0]._id

	const adminWallet = new LightningAdminWallet({uid: admin_uid})
	bank_address = await adminWallet.getOnChainAddress()
	expect(bank_address.substr(0, 4)).toBe("bcrt")
})

it('getting lndOutside1 address', async () => {
	lndOutside1_wallet_addr = (await lnService.createChainAddress({ format: 'p2wpkh', lnd: lndOutside1 })).address
	expect(lndOutside1_wallet_addr.substr(0, 4)).toBe("bcrt")
})

it('funds lnd1, lndOutside1 and mined 99 blocks to make mined coins accessible', async () => {
	let result = await bitcoindClient.generateToAddress(1, bank_address)
	expect(result[0].length).toEqual(64)
	result = await bitcoindClient.generateToAddress(1, lndOutside1_wallet_addr)
	expect(result[0].length).toEqual(64)
	await bitcoindClient.generateToAddress(99, RANDOM_ADDRESS)
}, 10000)

const openChannel = async ({lnd, local_tokens, other_lnd, other_public_key, other_socket}) => {
	await lnService.addPeer({ lnd, public_key: other_public_key, socket: other_socket })

	await waitForNodeSync(lnd)
	await waitForNodeSync(other_lnd)
	
	const res = await lnService.openChannel({ lnd, local_tokens, 
		partner_public_key: other_public_key, partner_socket: other_socket })

	console.log({res})

	await bitcoindClient.generateToAddress(3, RANDOM_ADDRESS)

	await waitForNodeSync(lnd)
	await waitForNodeSync(other_lnd)
}

it('opens channel from lnd1 to lndOutside1', async () => {
	const { public_key } = await lnService.getWalletInfo({ lnd: lndOutside1 })
	const { lnd } = lnService.authenticatedLndGrpc(getAuth())
	const other_socket = `lnd-outside-1:9735`
	const local_tokens = 1000000

	// TODO: adminWallet should have an API for opening channel
	await openChannel({lnd, other_lnd: lndOutside1, other_public_key: public_key, other_socket, local_tokens})

	const { channels } = await lnService.getChannels({ lnd })
	expect(channels.length).toEqual(1)

}, 50000)

it('opens channel from lndOutside1 to lndOutside2', async () => {
	const { public_key } = await lnService.getWalletInfo({ lnd: lndOutside2 })
	const lnd = lndOutside1
	const other_socket = `lnd-outside-2:9735`
	const local_tokens = 1000000

	await openChannel({lnd, other_lnd: lndOutside2, other_public_key: public_key, other_socket, local_tokens})

	const { channels } = await lnService.getChannels({ lnd: lndOutside1 })
	expect(channels.length).toEqual(2)
}, 50000)
