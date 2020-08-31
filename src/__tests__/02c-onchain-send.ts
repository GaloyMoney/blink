/**
 * @jest-environment node
 */
// this import needs to be before medici
import { quit } from "../lock";
import { MainBook, setupMongoConnection, User } from "../mongodb";
import { bitcoindClient, checkIsBalanced, getUserWallet, lndMain, lndOutside1, RANDOM_ADDRESS, waitUntilBlockHeight } from "../tests/helper";
import { onchainTransactionEventHandler } from "../trigger";
import { sleep } from "../utils";
const lnService = require('ln-service')

const mongoose = require("mongoose");

let initBlockCount
let initialBalanceUser0
let wallet


jest.mock('../notification')
const notification = require("../notification");


beforeAll(async () => {
  await setupMongoConnection()
  wallet = await getUserWallet(0)
})

beforeEach(async () => {
  initBlockCount = await bitcoindClient.getBlockCount()
  initialBalanceUser0 = await wallet.getBalance()
})

afterAll(async () => {
  await bitcoindClient.generateToAddress(3, RANDOM_ADDRESS)
  await sleep(100)

	await mongoose.connection.close()
	await quit()
})


it('Sends onchain payment', async () => {
  const amount = 10000 // sats
  const {address} = await lnService.createChainAddress({ format: 'p2wpkh', lnd: lndOutside1 })

	const payResult = await wallet.onChainPay({address, amount, description: "onchainpayment"})
  expect(payResult).toBeTruthy()

  const [pendingTxn] = (await MainBook.ledger({account:wallet.accountPath, pending: true, memo: "onchainpayment"})).results

	const interimBalance = await wallet.getBalance()
	expect(interimBalance).toBe(initialBalanceUser0 - amount - pendingTxn.fee)
	// await checkIsBalanced()
	
  const sub = lnService.subscribeToTransactions({lnd:lndMain})

	const subSpend = lnService.subscribeToChainSpend({lnd:lndMain, bech32_address: address, min_height: 1})

  await Promise.all([
    subSpend.once('confirmation', ({height}) => console.log({height})),
    sub.once('chain_transaction', onchainTransactionEventHandler),
    bitcoindClient.generateToAddress(6, RANDOM_ADDRESS),
    waitUntilBlockHeight({lnd: lndMain, blockHeight: initBlockCount + 6}),
  ])

  // FIXME why sleep is needed here?
  await sleep(5000)

  // expect(notification.sendNotification.mock.calls.length).toBe(1)
  // expect(notification.sendNotification.mock.calls[0][0].data.type).toBe("onchain_payment")

  const [{pending, fee}] = (await MainBook.ledger({account:wallet.accountPath, hash: pendingTxn.hash, memo:"onchainpayment"})).results
	expect(pending).toBe(false)

	const [txn] = (await wallet.getTransactions()).filter(tx => tx.hash === pendingTxn.hash)
	expect(txn.amount).toBe(- amount - fee)
	expect(txn.type).toBe('onchain_payment')

	const finalBalance = await wallet.getBalance()
	expect(finalBalance).toBe(initialBalanceUser0 - amount - fee)
	// await checkIsBalanced()
}, 100000)

