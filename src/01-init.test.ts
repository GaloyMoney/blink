/**
 * @jest-environment node
 */
import { setupMongoConnection } from "./db"
// this import needs to be before medici

import { LightningAdminWallet } from "./LightningAdminImpl"
import { sleep, getAuth } from "./utils"
const mongoose = require("mongoose");
const {once} = require('events');

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

let bank_address
let lndOutside1_wallet_addr

let admin_uid

const User = mongoose.model("User")

const local_tokens = 1000000


// FIXME this test doesn't seem that efficient
// even if is_sync_to_chain is to true
// the balance doesn't always shows up
async function waitForNodeSync(lnd) {
	let is_synced_to_chain = false
	let time = 0
	while (!is_synced_to_chain) {
		await sleep(1000)
		is_synced_to_chain = (await lnService.getWalletInfo({ lnd })).is_synced_to_chain
		time++
	}
	console.log('Seconds to sync ', time)
	return
}

const checkIsBalanced = async () => {
	const admin = await User.findOne({role: "admin"})
	const adminWallet = new LightningAdminWallet({uid: admin._id})
	const { assetsEqualLiabilities, lndBalanceSheetAreSynced } = await adminWallet.balanceSheetIsBalanced()
	expect(assetsEqualLiabilities).toBeTruthy()

	// FIXME add this back
	// expect(lndBalanceSheetAreSynced).toBeTruthy()
}

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
		host: bitcoind_addr, port: bitcoind_port }

	bitcoindClient = new BitcoindClient(connection_obj)

})

afterAll(async () => {
  return await mongoose.connection.close()
})

it('I can connect to bitcoind', async () => {
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
	const users = await User.find()
	expect(users).toStrictEqual([])
})

it('creating bank "admin" user', async () => {
	// FIXME there should be an API for this
	await new User({role: "admin"}).save()
	const users = await User.find({})
	expect(users.length).toBe(1)

	admin_uid = users[0]._id
})

it('funding bank with onchain tx', async () => {
	const admin = await User.findOne({role: "admin"})
	const adminWallet = new LightningAdminWallet({uid: admin._id})
	bank_address = await adminWallet.getOnChainAddress()
	expect(bank_address.substr(0, 4)).toBe("bcrt")

	const generateAddress = async () => {
		const [blockhashes] = await bitcoindClient.generateToAddress(1, bank_address)
		expect(blockhashes.length).toEqual(64)
		await bitcoindClient.generateToAddress(3, RANDOM_ADDRESS)
	}

	const checkBalance = async () => {
		const min_height = 1
		// FIXME: https://github.com/alexbosworth/ln-service/issues/122
		// let sub = lnService.subscribeToChainAddress({lnd: lnd1, bech32_address: bank_address, min_height})
		// await once(sub, 'confirmation')
		await sleep(3000)
		
		const balance = await adminWallet.getBalance()
		expect(balance).toBe(BLOCK_SUBSIDY)
		await checkIsBalanced()
	}

	await Promise.all([
		checkBalance(),
		generateAddress()
	])
}, 30000)


it('funds lndOutside1 and mined 99 blocks to make mined coins accessible', async () => {
	lndOutside1_wallet_addr = (await lnService.createChainAddress({ format: 'p2wpkh', lnd: lndOutside1 })).address
	expect(lndOutside1_wallet_addr.substr(0, 4)).toBe("bcrt")

	const result = await bitcoindClient.generateToAddress(1, lndOutside1_wallet_addr)
	expect(result[0].length).toEqual(64)
	await bitcoindClient.generateToAddress(99, RANDOM_ADDRESS)
}, 10000)

const openChannel = async ({lnd, other_lnd, other_public_key, other_socket}) => {
	let openChannelPromise
	let adminWallet

	await waitForNodeSync(lnd)
	await waitForNodeSync(other_lnd)

	if (lnd === lnd1) {
		// TODO: dedupe
		const admin = await User.findOne({role: "admin"})
		adminWallet = new LightningAdminWallet({uid: admin._id})
		openChannelPromise = adminWallet.openChannel({ local_tokens, other_public_key, other_socket })

	} else {
		openChannelPromise = lnService.openChannel({ lnd, local_tokens, 
			partner_public_key: other_public_key, partner_socket: other_socket })
	}
	
	await Promise.all([
		openChannelPromise,
		(async () => {
			// making sure the channel open creation has started before generating new address
			// otherwise lnd might complain it's not in sync
			await sleep(5000)
			await bitcoindClient.generateToAddress(6, RANDOM_ADDRESS)
		})()
	])
	
	await waitForNodeSync(lnd)
	await waitForNodeSync(other_lnd)

	if (lnd === lnd1) {
		await adminWallet.updateEscrows()
	}

	await checkIsBalanced()
}

it('opens channel from lnd1 to lndOutside1', async () => {
	const { public_key } = await lnService.getWalletInfo({ lnd: lndOutside1 })
	const other_socket = `lnd-outside-1:9735`

	// TODO: adminWallet should have an API for opening channel
	await openChannel({lnd: lnd1, other_lnd: lndOutside1, other_public_key: public_key, other_socket})

	const { channels } = await lnService.getChannels({ lnd: lnd1 })
	expect(channels.length).toEqual(1)

}, 50000)

it('opens channel from lndOutside1 to lndOutside2', async () => {
	const { public_key } = await lnService.getWalletInfo({ lnd: lndOutside2 })
	const lnd = lndOutside1
	const other_socket = `lnd-outside-2:9735`

	await openChannel({lnd, other_lnd: lndOutside2, other_public_key: public_key, other_socket})

	const channelsOutside1 = (await lnService.getChannels({ lnd: lndOutside1 })).channels
	expect(channelsOutside1.length).toEqual(2)

	const channelsOutside2 = (await lnService.getChannels({ lnd: lndOutside2 })).channels
	expect(channelsOutside2.length).toEqual(1)
}, 30000)
