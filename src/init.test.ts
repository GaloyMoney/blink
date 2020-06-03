/**
 * @jest-environment node
 */
//TODO: Choose between camel case or underscores for variable naming
const BitcoindClient = require('bitcoin-core')
const lnService = require('ln-service')
const cert = 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNZekNDQWdpZ0F3SUJBZ0lSQVBWWEFaSXQ1UEVrQXF2ZVQwN3BDL3N3Q2dZSUtvWkl6ajBFQXdJd01ERWYKTUIwR0ExVUVDaE1XYkc1a0lHRjFkRzluWlc1bGNtRjBaV1FnWTJWeWRERU5NQXNHQTFVRUF4TUVhM0owYXpBZQpGdzB5TURBMU1UY3hORFF4TXpSYUZ3MHlNVEEzTVRJeE5EUXhNelJhTURBeEh6QWRCZ05WQkFvVEZteHVaQ0JoCmRYUnZaMlZ1WlhKaGRHVmtJR05sY25ReERUQUxCZ05WQkFNVEJHdHlkR3N3V1RBVEJnY3Foa2pPUFFJQkJnZ3EKaGtqT1BRTUJCd05DQUFSYTIwRXZvcmZXbEVkNjRkamFIbVJnVHJRYVhVSTRCWnJ6YlVXTEtKVnlxcXZKN1Q1eQpMU1N5a2NBU2VHcHkrMTJWb2k5WHR2MWdsQUwwYWdnZ2VBNFRvNElCQVRDQi9qQU9CZ05WSFE4QkFmOEVCQU1DCkFxUXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUhBd0V3RHdZRFZSMFRBUUgvQkFVd0F3RUIvekNCeFFZRFZSMFIKQklHOU1JRzZnZ1JyY25ScmdnbHNiMk5oYkdodmMzU0NDMnh1WkMxelpYSjJhV05sZ2cxc2JtUXRjMlZ5ZG1sagpaUzB4Z2dSMWJtbDRnZ3AxYm1sNGNHRmphMlYwZ2dkaWRXWmpiMjV1aHdSL0FBQUJoeEFBQUFBQUFBQUFBQUFBCkFBQUFBQUFCaHdUQXFHUUtod1RBcUhvQmh3U3NFd0FCaHdTc0VRQUJod1NzRWdBQmh4RCtnQUFBQUFBQUFNdmwKUVZEK1M5QUhoeEQrZ0FBQUFBQUFBQUJDSC8vK2tOakZoeEQrZ0FBQUFBQUFBTlRNQ2YvK2tnSWlod1NzRVFBQwpNQW9HQ0NxR1NNNDlCQU1DQTBrQU1FWUNJUUNtd0RTZGl6eU5aVnRGeXg1dkpHUXFsRFVzU0hhUWhhYkdSUmU3CjdSckpDUUloQUkxVDJTSE1HZVBIaEpUem1YU2JUTTFZZlFlWjROQU02YWNIelhxdFZZOGQKLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo='

let macaroon1 = process.env.MACAROON1
let macaroon2 = process.env.MACAROONOUTSIDE1
let macaroon3 = process.env.MACAROONOUTSIDE2
let lnd1
let lndOutside1
let lndOutside2

let lnd1_wallet_addr
let lndOutside1_wallet_addr

let lnd_addr = '172.17.0.2'
let lnd_outside_1_addr = '172.17.0.2'
let lnd_outside_2_addr = '172.17.0.2'
let bitcoind_addr = '172.17.0.2'
let bitcoind_port = process.env.BITCOINDPORT
let lnd_rpc_port = process.env.LNDRPCPORT
let lnd_outside_1_rpc_port = process.env.LNDOUTSIDERPCPORT
let lnd_outside_2_rpc_port = process.env.LNDOUTSIDE2RPCPORT
// let lnd_addr = 'lnd-service'
// let lnd_outside_1_addr = 'lnd-outside-1'
// let lnd_outside_2_addr = 'lnd-outside-2'
// let bitcoind_addr = 'bitcoind-service'
// let bitcoind_port = 18443
// let lnd_rpc_port, lnd_outside_1_rpc_port  = 10009, 10009

let bitcoindClient

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

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

	lnd1_wallet_addr = (await lnService.createChainAddress({ format: 'np2wpkh', lnd: lnd1 })).address
	console.log("addr1", lnd1_wallet_addr)
	lndOutside1_wallet_addr = (await lnService.createChainAddress({ format: 'np2wpkh', lnd: lndOutside1 })).address
	console.log("addr2", lndOutside1_wallet_addr)
	return
})

beforeAll(async () => {
	bitcoindClient = new BitcoindClient({ network: 'regtest', username: 'rpcuser', password: 'rpcpass', host: `${bitcoind_addr}`, port: `${bitcoind_port}` })
	expect((await bitcoindClient.getBlockchainInfo()).chain).toEqual('regtest')
})

it('funds lnd1 and lndOutside1', async () => {
	try {
		let result = await bitcoindClient.generateToAddress(1, lnd1_wallet_addr)
		expect(result[0].length).toEqual(64)
		result = await bitcoindClient.generateToAddress(1, lndOutside1_wallet_addr)
		expect(result[0].length).toEqual(64)
		await bitcoindClient.generateToAddress(99, '2N1AdXp9qihogpSmSBXSSfgeUFgTYyjVWqo')
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
	await bitcoindClient.generateToAddress(5, '2N1AdXp9qihogpSmSBXSSfgeUFgTYyjVWqo')
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