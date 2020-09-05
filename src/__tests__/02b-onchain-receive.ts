/**
 * @jest-environment node
 */
// this import needs to be before medici
import { LightningAdminWallet } from "../LightningAdminImpl";
import { quit } from "../lock";
import { setupMongoConnection, User } from "../mongodb";
import { bitcoindClient, checkIsBalanced, getUserWallet, lndMain, RANDOM_ADDRESS, waitUntilBlockHeight } from "../tests/helper";
import { onchainTransactionEventHandler } from "../trigger";
import { btc2sat, sleep } from "../utils";
const lnService = require('ln-service')

const mongoose = require("mongoose");
const { once } = require('events');


let adminWallet
let initBlockCount
let initialBalanceUser0, initialBalanceAdmin
let wallet
const min_height = 1


const amount_BTC = 1

jest.mock('../notification')
const notification = require("../notification");


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
  await bitcoindClient.generateToAddress(3, RANDOM_ADDRESS)
  await sleep(100)

	await mongoose.connection.close()
	await quit()
})

const onchain_funding = async ({walletDestination}) => {
  const initialBalance = await walletDestination.getBalance()
  const initTransations = await wallet.getTransactions()
  
  const address = await walletDestination.getOnChainAddress()
	expect(address.substr(0, 4)).toBe("bcrt")

	const checkBalance = async () => {
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

it('funding bank/admin with onchain tx from bitcoind', async () => {
	await onchain_funding({walletDestination: adminWallet})
}, 100000)

it('identifies unconfirmed incoming on chain txn', async () => {
	const address = await wallet.getOnChainAddress()
	expect(address.substr(0, 4)).toBe("bcrt")

  const sub = await lnService.subscribeToTransactions({lnd: lndMain})

  sub.on('chain_transaction', onchainTransactionEventHandler)
	await bitcoindClient.sendToAddress(address, amount_BTC)
  
  //FIXME: Use something deterministic instead of sleep
  await sleep(2000)
  
	const pendingTxn = await wallet.getPendingIncomingOnchainPayments()
	expect(pendingTxn.length).toBe(1)
	expect(pendingTxn[0].amount).toBe(btc2sat(1))

  expect(notification.sendNotification.mock.calls.length).toBe(1)
  expect(notification.sendNotification.mock.calls[0][0].data.type).toBe("onchain_receipt")
  expect(notification.sendNotification.mock.calls[0][0].title).toBe(
    `You have a pending incoming transaction of ${btc2sat(amount_BTC)} sats`)
  
  const subChain = lnService.subscribeToChainAddress({lnd: lndMain, bech32_address: address, min_height})
  bitcoindClient.generateToAddress(1, RANDOM_ADDRESS)

  await once(subChain, 'confirmation')
  sub.removeAllListeners();
  subChain.removeAllListeners();

  const util = require('util')
  console.log(util.inspect(notification.sendNotification.mock.calls, false, Infinity))

  // FIXME: the event is actually fired twice.
  // is it a lnd issue?
  // a workaround: use a hash of the event and store in redis 
  // to not replay if it has already been handled?
  //
  // expect(notification.sendNotification.mock.calls.length).toBe(2)

  expect(notification.sendNotification.mock.calls[1][0].data.type).toBe("onchain_receipt")
  expect(notification.sendNotification.mock.calls[1][0].title).toBe(
    `Your wallet has been credited with ${btc2sat(amount_BTC)} sats`)


}, 100000)
