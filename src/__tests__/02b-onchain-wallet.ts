/**
 * @jest-environment node
 */
import { MainBook, setupMongoConnection, Transaction, User } from "../mongodb"
// this import needs to be before medici
import { LightningAdminWallet } from "../LightningAdminImpl"
import { sleep, btc2sat } from "../utils"
const lnService = require('ln-service')

const mongoose = require("mongoose");
const { once } = require('events');

import {lndMain, lndOutside1, bitcoindClient, RANDOM_ADDRESS, getUserWallet, checkIsBalanced, waitUntilBlockHeight} from "../tests/helper"
import { quit } from "../lock";
import { onchainTransactionEventHandler } from "../trigger";

let adminWallet
let initBlockCount
let initialBalanceUser0, initialBalanceAdmin
let wallet


const amount_BTC = 1


beforeAll(async () => {
  await setupMongoConnection()

  wallet = await getUserWallet(0)

  const admin = await User.findOne({ role: "admin" })
  adminWallet = new LightningAdminWallet({ uid: admin._id })
})

beforeEach(async () => {
  initBlockCount = await bitcoindClient.getBlockCount()
  initialBalanceUser0 = await wallet.getBalance()
  initialBalanceAdmin = await adminWallet.getBalance()
})

afterAll(async () => {
	await mongoose.connection.close()
	await quit()
})

const onchain_funding = async ({walletDestination}) => {
  const initialBalance = await walletDestination.getBalance()
  const initTransations = await wallet.getTransactions()
  
  const address = await walletDestination.getOnChainAddress()
	expect(address.substr(0, 4)).toBe("bcrt")

	const checkBalance = async () => {
		const min_height = 1
		let sub = lnService.subscribeToChainAddress({lnd: lndMain, bech32_address: address, min_height})
		
		await once(sub, 'confirmation')
		sub.removeAllListeners();

		await waitUntilBlockHeight({lnd: lndMain, blockHeight: initBlockCount + 6})
    await checkIsBalanced()

		const balance = await walletDestination.getBalance()
    expect(balance).toBe(initialBalance + btc2sat(amount_BTC))
    
    const transations = await wallet.getTransactions()
    expect(transations.length).toBe(initTransations.length + 1)
    expect(transations[transations.length - 1].type).toBe("onchain_receipt")
    expect(transations[transations.length - 1].amount).toBe(btc2sat(amount_BTC))
	}

  const fundLndWallet = async () => {
		await bitcoindClient.sendToAddress(address, amount_BTC)
		await sleep(100)
		await bitcoindClient.generateToAddress(6, RANDOM_ADDRESS)
	}

	await Promise.all([
		checkBalance(),
		fundLndWallet()
	])
}

it('user0 is credited for on chain transaction', async () => {
  await onchain_funding({walletDestination: wallet})
}, 100000)

// XXX FIXME TODO issue with this call
// transactions are credited several times for admins
//
// it('funding bank/admin with onchain tx from bitcoind', async () => {
// 	await onchain_funding({walletDestination: adminWallet})
// }, 100000)

it('identifies unconfirmed incoming on chain txn', async () => {
	const address = await wallet.getOnChainAddress()
	expect(address.substr(0, 4)).toBe("bcrt")

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

it('Sends onchain payment', async () => {
  const amount = 10000 // sats
  const {address} = await lnService.createChainAddress({ format: 'p2wpkh', lnd: lndOutside1 })

	const payResult = await wallet.onChainPay({address, amount, description: "onchainpayment"})
  expect(payResult).toBeTruthy()

  const [pendingTxn] = (await MainBook.ledger({account:wallet.accountPath, pending: true, memo: "onchainpayment"})).results
  console.log({pendingTxn})

	const interimBalance = await wallet.getBalance()
	expect(interimBalance).toBe(initialBalanceUser0 - amount - pendingTxn.fee)
	await checkIsBalanced()
	
	const sub = lnService.subscribeToTransactions({lnd:lndMain})
  
  await Promise.all([
    sub.once('chain_transaction', onchainTransactionEventHandler),
    bitcoindClient.generateToAddress(6, RANDOM_ADDRESS),
    waitUntilBlockHeight({lnd: lndMain, blockHeight: initBlockCount + 6}),
  ])

  const [{pending, fee}] = (await MainBook.ledger({account:wallet.accountPath, hash: pendingTxn.hash, memo:"onchainpayment"})).results
	expect(pending).toBe(false)

	const [txn] = (await wallet.getTransactions()).filter(tx => tx.hash === pendingTxn.hash)
	expect(txn.amount).toBe(- amount - fee)
	expect(txn.type).toBe('onchain_payment')

	const finalBalance = await wallet.getBalance()
	expect(finalBalance).toBe(initialBalanceUser0 - amount - fee)
	// await checkIsBalanced()
}, 100000)
