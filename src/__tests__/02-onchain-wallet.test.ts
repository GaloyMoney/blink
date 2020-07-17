/**
 * @jest-environment node
 */
import { setupMongoConnection } from "../db"
// this import needs to be before medici

import { LightningAdminWallet } from "../LightningAdminImpl"
import { sleep, getAuth, waitUntilBlockHeight, btc2sat } from "../utils"
import { checkIsBalanced } from "./utils_for_tests";
const mongoose = require("mongoose");
const { once } = require('events');

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

const amount_BTC = 1


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

it('creating bank "admin" user', async () => {
	// FIXME there should be an API for this
	await new User({ role: "admin" }).save()
	const users = await User.find({})
	expect(users.length).toBe(1)

	admin_uid = users[0]._id
})

it('funds bitcoind wallet', async () => {
	const bitcoindAddress = await bitcoindClient.getNewAddress()
	await bitcoindClient.generateToAddress(100 + 1, bitcoindAddress)
	expect(await bitcoindClient.getBalance()).toBe(50)
})


it('funding bank with onchain tx', async () => {
	const admin = await User.findOne({ role: "admin" })
	const adminWallet = new LightningAdminWallet({ uid: admin._id })
	bank_address = await adminWallet.getOnChainAddress()
	expect(bank_address.substr(0, 4)).toBe("bcrt")

	const fundLndWallet = async () => {
		bitcoindClient.sendToAddress(bank_address, amount_BTC)
		await sleep(100)
		await bitcoindClient.generateToAddress(6, RANDOM_ADDRESS)
	}

	const checkBalance = async () => {
		const min_height = 1
		let sub = lnService.subscribeToChainAddress({lnd: lnd1, bech32_address: bank_address, min_height})
		
		await once(sub, 'confirmation')
		sub.removeAllListeners();

		await waitUntilBlockHeight({lnd: lnd1, blockHeight: 107})
		const balance = await adminWallet.getBalance()
		expect(balance).toBe(btc2sat(amount_BTC))
		await checkIsBalanced()
	}

	await Promise.all([
		checkBalance(),
		fundLndWallet()
	])
}, 100000)


it('funds lndOutside1', async () => {
	lndOutside1_wallet_addr = (await lnService.createChainAddress({ format: 'p2wpkh', lnd: lndOutside1 })).address
	expect(lndOutside1_wallet_addr.substr(0, 4)).toBe("bcrt")

	bitcoindClient.sendToAddress(lndOutside1_wallet_addr, amount_BTC)

	await bitcoindClient.generateToAddress(13, RANDOM_ADDRESS)

	await waitUntilBlockHeight({lnd: lnd1, blockHeight: 120})
	await waitUntilBlockHeight({lnd: lndOutside1, blockHeight: 120})
	await waitUntilBlockHeight({lnd: lndOutside2, blockHeight: 120})
}, 100000)
