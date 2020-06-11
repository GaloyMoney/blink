/**
 * @jest-environment node
 */
import { setupMongoConnection } from "./db"
// this import needs to be before medici

import { LightningAdminWallet } from "./LightningAdminImpl"
import { sleep } from "./utils"

//TODO: Choose between camel case or underscores for variable naming
const BitcoindClient = require('bitcoin-core')
const lnService = require('ln-service')
const cert = process.env.TLS

const RANDOM_ADDRESS = "2N1AdXp9qihogpSmSBXSSfgeUFgTYyjVWqo"

let macaroon1 = process.env.MACAROON
let macaroon2 = process.env.MACAROONOUTSIDE1
let macaroon3 = process.env.MACAROONOUTSIDE2
let lnd1
let lndOutside1
let lndOutside2

let lnd1_wallet_addr
let lndOutside1_wallet_addr

let lnd_addr = process.env.LNDIP
let lnd_outside_1_addr = process.env.LNDOUTSIDE1ADDR
let lnd_outside_2_addr = process.env.LNDOUTSIDE2ADDR

let bitcoind_addr = process.env.BITCOINDADDR
let bitcoind_port = process.env.BITCOINDPORT

let lnd_rpc_port = process.env.LNDRPCPORT
let lnd_outside_1_rpc_port = process.env.LNDOUTSIDE1RPCPORT
let lnd_outside_2_rpc_port = process.env.LNDOUTSIDE2RPCPORT
// let lnd_addr = 'lnd-service'
// let lnd_outside_1_addr = 'lnd-outside-1'
// let lnd_outside_2_addr = 'lnd-outside-2'
// let bitcoind_addr = 'bitcoind-service'
// let bitcoind_port = 18443
// let lnd_rpc_port, lnd_outside_1_rpc_port  = 10009, 10009

let bitcoindClient


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

beforeAll(async () => {
	lnd1 = lnService.authenticatedLndGrpc({
		cert,
		macaroon: macaroon1,
		socket: `${lnd_addr}:${lnd_rpc_port}`,
	}).lnd;

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
})

it('I can connect to bitcoind', async () => {
	const connection_obj = { 
		network: 'regtest', username: 'rpcuser', password: 'rpcpass',
		host: bitcoind_addr, port: bitcoind_port }
	console.log({connection_obj})
	bitcoindClient = new BitcoindClient(connection_obj)
	expect(await bitcoindClient.getBlockchainInfo().chain).toEqual('regtest')
})

it('I can connect to lnds', async () => {
	console.log({lnd1})
	const walletinfo = await lnService.getWalletInfo({ lnd: lnd1 })
	console.log({walletinfo})
	// expect(await bitcoindClient.getBlockchainInfo().chain).toEqual('regtest')
})

it('funding the bank', async () => {
	// funding the bank
	const adminWallet = new LightningAdminWallet({uid: "admin"})
	lnd1_wallet_addr = adminWallet.getOnChainAddress()
	console.log({lnd1_wallet_addr})
})

it('funding lndOutside 1', async () => {
	lndOutside1_wallet_addr = (await lnService.createChainAddress({ format: 'np2wpkh', lnd: lndOutside1 })).address
	console.log({lndOutside1_wallet_addr})
})

it('funds lnd1 and lndOutside1', async () => {
	try {
		let result = await bitcoindClient.generateToAddress(1, lnd1_wallet_addr)
		expect(result[0].length).toEqual(64)
		result = await bitcoindClient.generateToAddress(1, lndOutside1_wallet_addr)
		expect(result[0].length).toEqual(64)
		await bitcoindClient.generateToAddress(99, RANDOM_ADDRESS)
	} catch (error) {
		console.log(error)
	}
}, 10000)

it('opens channel from lnd1 to lndOutside1', async () => {
	let { public_key } = await lnService.getWalletInfo({ lnd: lndOutside1 })
	
	await lnService.addPeer({ lnd: lnd1, public_key, socket: `lnd-outside-1:9735` })

	await waitForNodeSync(lnd1)
	
	let res = await lnService.openChannel({ lnd: lnd1, local_tokens: 100000, partner_public_key: public_key, partner_socket: `lnd-outside-1:9735`, give_tokens: 30000 })
	console.log("open channel res", res)
}, 50000)

it('opens channel from lndOutside1 to lndOutside2', async () => {
	let { public_key } = await lnService.getWalletInfo({ lnd: lndOutside2 })
	
	await lnService.addPeer({ lnd: lndOutside1, public_key, socket: `lnd-outside-2:9735` })

	await waitForNodeSync(lndOutside1)

	let res = await lnService.openChannel({ lnd: lndOutside1, local_tokens: 100000, partner_public_key: public_key, partner_socket: `lnd-outside-2:9735`, give_tokens: 30000 })
	await bitcoindClient.generateToAddress(5, RANDOM_ADDRESS)
	console.log("open channel res", res)
}, 50000)

it('checks for channel existence', async () => {
	await waitForNodeSync(lnd1)
	await waitForNodeSync(lndOutside1)
	await waitForNodeSync(lndOutside2)
	let { channels } = await lnService.getChannels({ lnd: lnd1 })
	expect(channels.length).toEqual(1)
	channels = (await lnService.getChannels({ lnd: lndOutside2 })).channels
	expect(channels.length).toEqual(1)
}, 50000)