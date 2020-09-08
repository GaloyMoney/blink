/**
 * @jest-environment node
 */
import { quit } from "../lock";
import { MainBook, setupMongoConnection, User } from "../mongodb";
import { bitcoindClient, checkIsBalanced, getUserWallet, lndMain, lndOutside1, RANDOM_ADDRESS, waitUntilBlockHeight, onBoardingEarnIds } from "../tests/helper";
import { onchainTransactionEventHandler } from "../trigger";
import { sleep } from "../utils";
const util = require('util')

const {once} = require('events');

const lnService = require('ln-service')

const mongoose = require("mongoose");

let initBlockCount
let initialBalanceUser0
let userWallet0, userWallet3


jest.mock('../notification')
const { sendNotification } = require("../notification");


beforeAll(async () => {
  await setupMongoConnection()
  userWallet0 = await getUserWallet(0)
  userWallet3 = await getUserWallet(3)
})

beforeEach(async () => {
  initBlockCount = await bitcoindClient.getBlockCount()
  initialBalanceUser0 = await userWallet0.getBalance()
})

afterAll(async () => {
  await bitcoindClient.generateToAddress(3, RANDOM_ADDRESS)
  await sleep(100)

	await mongoose.connection.close()
	await quit()
})

const amount = 10000 // sats

it('Sends onchain payment', async () => {
  const { address } = await lnService.createChainAddress({ format: 'p2wpkh', lnd: lndOutside1 })

  const sub = lnService.subscribeToTransactions({ lnd: lndMain })
  sub.on('chain_transaction', onchainTransactionEventHandler)

	const payResult = await userWallet0.onChainPay({ address, amount, description: "onchainpayment" })
  expect(payResult).toBeTruthy()

  const [pendingTxn] = (await MainBook.ledger({ account: userWallet0.accountPath, pending: true, memo: "onchainpayment" })).results

	const interimBalance = await userWallet0.getBalance()
	expect(interimBalance).toBe(initialBalanceUser0 - amount - pendingTxn.fee)
	await checkIsBalanced()

	// const subSpend = lnService.subscribeToChainSpend({ lnd: lndMain, bech32_address: address, min_height: 1 })

  const resultPromises = await Promise.all([
    // once(subSpend, 'confirmation'),
    once(sub, 'chain_transaction'),
    waitUntilBlockHeight({ lnd: lndMain, blockHeight: initBlockCount + 6 }),
    bitcoindClient.generateToAddress(6, RANDOM_ADDRESS),
  ])

  console.log(util.inspect({ resultPromises }, false, Infinity))

    // FIXME: the event is actually fired twice.
  // is it a lnd issue?
  // a workaround: use a hash of the event and store in redis 
  // to not replay if it has already been handled?
  // expect(sendNotification.mock.calls.length).toBe(1)
  expect(sendNotification.mock.calls[0][0].data.type).toBe("onchain_payment")

  const [{ pending, fee }] = (await MainBook.ledger({ account: userWallet0.accountPath, hash: pendingTxn.hash, memo: "onchainpayment" })).results
	expect(pending).toBe(false)

	const [txn] = (await userWallet0.getTransactions()).filter(tx => tx.hash === pendingTxn.hash)
	expect(txn.amount).toBe(- amount - fee)
	expect(txn.type).toBe('onchain_payment')

	const finalBalance = await userWallet0.getBalance()
	expect(finalBalance).toBe(initialBalanceUser0 - amount - fee)
	await checkIsBalanced()
}, 20000)

it('makes onchain on-us transaction', async () => {
  const user3Address = await userWallet3.getOnChainAddress()
  const initialBalanceUser3 = await userWallet3.getBalance()

  const paymentResult = await userWallet0.onChainPay({ address: user3Address as string, amount })

  const finalBalanceUser0 = await userWallet0.getBalance()
  const finalBalanceUser3 = await userWallet3.getBalance()

  expect(paymentResult).toBe(true)
  expect(finalBalanceUser0).toBe(initialBalanceUser0 - amount)
  expect(finalBalanceUser3).toBe(initialBalanceUser3 + amount)
  await checkIsBalanced()
}, 10000)

it('fails to make onchain payment to self', async () => {
  const address = await userWallet0.getOnChainAddress()
  await expect(userWallet0.onChainPay({ address, amount })).rejects.toThrow()
})

it('fails to make on-us onchain payment when insufficient balance', async () => {
  const address = await userWallet3.getOnChainAddress()
  await expect(userWallet0.onChainPay({ address, amount: initialBalanceUser0 + 1 })).rejects.toThrow()
})

it('fails to make onchain payment when insufficient balance', async () => {
  const { address } = await lnService.createChainAddress({
    lnd: lndOutside1,
    format: 'p2wpkh',
  })
  const initialBalanceUser3 = await userWallet3.getBalance()
  //should fail because user does not have balance to pay for on-chain fee
  await expect(userWallet3.onChainPay({ address: address as string, amount: initialBalanceUser3 })).rejects.toThrow()
})
