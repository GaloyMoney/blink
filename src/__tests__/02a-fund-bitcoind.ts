/**
 * @jest-environment node
 */
const lnService = require('ln-service')
import { setupMongoConnection, User } from "../mongodb";
import { bitcoindClient, lndMain, lndOutside1, lndOutside2, RANDOM_ADDRESS, waitUntilBlockHeight } from "../tests/helper";
const mongoose = require("mongoose");

const initialBitcoinWalletBalance = 0

const blockReward = 50
const numOfBlock = 10
// from: https://developer.bitcoin.org/examples/testing.html
// Unlike mainnet, in regtest mode only the first 150 blocks pay a reward of 50 bitcoins. 
// However, a block must have 100 confirmations before that reward can be spent, 
// so we generate 101 blocks to get access to the coinbase transaction from block #1.


// !!! this test is no re-entrant !!!

const amount_BTC = 1
let lndOutside1_wallet_addr


beforeAll(async () => {
  await setupMongoConnection()
})

afterAll(async () => {
	await mongoose.connection.close()
})

it('funds bitcoind wallet', async () => {
	const bitcoindAddress = await bitcoindClient.getNewAddress()
	await bitcoindClient.generateToAddress(numOfBlock, bitcoindAddress)
	await bitcoindClient.generateToAddress(100, RANDOM_ADDRESS)
	const balance = await bitcoindClient.getBalance()
	expect(balance).toBe(initialBitcoinWalletBalance + blockReward * numOfBlock)
})

it('funds outside lnd node', async () => {
	lndOutside1_wallet_addr = (await lnService.createChainAddress({ format: 'p2wpkh', lnd: lndOutside1 })).address
	expect(lndOutside1_wallet_addr.substr(0, 4)).toBe("bcrt")

	await bitcoindClient.sendToAddress(lndOutside1_wallet_addr, amount_BTC)
	await bitcoindClient.generateToAddress(6, RANDOM_ADDRESS)

	await waitUntilBlockHeight({ lnd: lndMain, blockHeight: 100 + numOfBlock + 6 })
	await waitUntilBlockHeight({ lnd: lndOutside1, blockHeight: 100 + numOfBlock + 6 })
	await waitUntilBlockHeight({ lnd: lndOutside2, blockHeight: 100 + numOfBlock + 6 })
}, 100000)
