/**
 * @jest-environment node
 */
import { setupMongoConnection, User } from "../mongodb"
// this import needs to be before medici

import { LightningAdminWallet } from "../LightningAdminImpl"
import { sleep, waitUntilBlockHeight, btc2sat } from "../utils"
const lnService = require('ln-service')

const mongoose = require("mongoose");
const { once } = require('events');

import {lndMain, lndOutside1, lndOutside2, bitcoindClient, RANDOM_ADDRESS, getUserWallet, checkIsBalanced} from "../tests/helper"
import { quit } from "../lock";

let bank_address
let lndOutside1_wallet_addr

let admin_uid

const amount_BTC = 1


beforeAll(async () => {
	await setupMongoConnection()
})

afterAll(async () => {
	await mongoose.connection.close()
	await quit()
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

const onchain_funding = async ({address, wallet, blockHeight}) => {
	const fundLndWallet = async () => {
		await bitcoindClient.sendToAddress(address, amount_BTC)
		await sleep(100)
		await bitcoindClient.generateToAddress(6, RANDOM_ADDRESS)
	}

	const checkBalance = async () => {
		const min_height = 1
		let sub = lnService.subscribeToChainAddress({lnd: lndMain, bech32_address: address, min_height})
		
		await once(sub, 'confirmation')
		sub.removeAllListeners();

		await waitUntilBlockHeight({lnd: lndMain, blockHeight})

		// TODO: refactor
		const admin = await User.findOne({ role: "admin" })
		const adminWallet = new LightningAdminWallet({ uid: admin._id })
		await adminWallet.updateUsersPendingPayment()

		const balance = await wallet.getBalance()
		expect(balance).toBe(btc2sat(amount_BTC))
		await checkIsBalanced()
	}

	await Promise.all([
		checkBalance(),
		fundLndWallet()
	])
}

it('list transactions', async () => {
	const wallet = await getUserWallet(0)
  const result = await wallet.getTransactions()
  expect(result.length).toBe(0)

  // TODO validate a transaction to be and verify result == 1 afterwards.
  // TODO more testing with devnet
})

it('funding bank with onchain tx', async () => {
	const admin = await User.findOne({ role: "admin" })
	const adminWallet = new LightningAdminWallet({ uid: admin._id })
	bank_address = await adminWallet.getOnChainAddress()
	expect(bank_address.substr(0, 4)).toBe("bcrt")

	await onchain_funding({address: bank_address, wallet: adminWallet, blockHeight: 107})

}, 100000)

it('user0 is credited for on chain transaction', async () => {
	const wallet = await getUserWallet(0)
	const address = await wallet.getOnChainAddress()

	expect((<string>address).substr(0, 4)).toBe("bcrt")

	await onchain_funding({address, wallet, blockHeight: 113})

}, 100000)


it('funds lndOutside1', async () => {
	lndOutside1_wallet_addr = (await lnService.createChainAddress({ format: 'p2wpkh', lnd: lndOutside1 })).address
	expect(lndOutside1_wallet_addr.substr(0, 4)).toBe("bcrt")

	await bitcoindClient.sendToAddress(lndOutside1_wallet_addr, amount_BTC)

	await bitcoindClient.generateToAddress(7, RANDOM_ADDRESS)

	await waitUntilBlockHeight({lnd: lndMain, blockHeight: 120})
	await waitUntilBlockHeight({lnd: lndOutside1, blockHeight: 120})
	await waitUntilBlockHeight({lnd: lndOutside2, blockHeight: 120})
}, 100000)

it('identifies unconfirmed incoming on chain txn', async () => {
	const wallet = await getUserWallet(0)
	const address = await wallet.getOnChainAddress()

	expect((<string>address).substr(0, 4)).toBe("bcrt")

	await bitcoindClient.sendToAddress(address, amount_BTC)
	//FIXME: Use something deterministic instead of sleep
	await sleep(2000)
	const pendingTxn = await wallet.getPendingIncomingOnchainPayments()
	expect(pendingTxn.length).toBe(1)
	expect(pendingTxn[0].amount).toBe(btc2sat(1))

	const sub = await lnService.subscribeToTransactions({lnd: lndMain})
	await bitcoindClient.generateToAddress(1, RANDOM_ADDRESS)
	const event = await once(sub, 'chain_transaction')
	expect(event[0].id).toBe(pendingTxn[0].txId)
}, 100000)
