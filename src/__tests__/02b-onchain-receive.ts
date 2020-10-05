/**
 * @jest-environment node
 */
import { setupMongoConnection, User } from "../mongodb";

import { LightningBtcWallet } from "../LightningBtcWallet";
import { quit } from "../lock";
import { checkIsBalanced, getUserWallet, lndMain, RANDOM_ADDRESS, waitUntilBlockHeight } from "../tests/helper";
import { onchainTransactionEventHandler } from "../trigger";
import { bitcoindClient, btc2sat, sleep } from "../utils";

const lnService = require('ln-service')

const mongoose = require("mongoose");
const { once } = require('events');
const util = require('util')


let funderWallet
let initBlockCount
let initialBalanceUser0
let walletUser0
const min_height = 1


const amount_BTC = 1

jest.mock('../notification')
const { sendNotification } = require("../notification");


beforeAll(async () => {
  await setupMongoConnection()
})

beforeEach(async () => {
  walletUser0 = await getUserWallet(0)

  const funder = await User.findOne({ role: "funder" })
  funderWallet = new LightningBtcWallet({ uid: funder._id })

  initBlockCount = await bitcoindClient.getBlockCount()
  initialBalanceUser0 = await walletUser0.getBalance()
})

afterEach(async () => {
  await bitcoindClient.generateToAddress(3, RANDOM_ADDRESS)
  await sleep(250)
})

afterAll(async () => {
  await mongoose.connection.close()
  await quit()
})

const onchain_funding = async ({ walletDestination }) => {
  const initialBalance = await walletDestination.getBalance()
  const initTransactions = await walletDestination.getTransactions()

  const address = await walletDestination.getOnChainAddress()
  expect(address.substr(0, 4)).toBe("bcrt")

  const checkBalance = async () => {
    const sub = lnService.subscribeToChainAddress({ lnd: lndMain, bech32_address: address, min_height })
    await once(sub, 'confirmation')
    sub.removeAllListeners();

    await waitUntilBlockHeight({ lnd: lndMain, blockHeight: initBlockCount + 6 })
    await checkIsBalanced()

    const balance = await walletDestination.getBalance()
    expect(balance).toBe(initialBalance + btc2sat(amount_BTC))

    const transactions = await walletDestination.getTransactions()
    expect(transactions.length).toBe(initTransactions.length + 1)
    expect(transactions[transactions.length - 1].type).toBe("onchain_receipt")
    expect(transactions[transactions.length - 1].amount).toBe(btc2sat(amount_BTC))
  }

  const fundLndWallet = async () => {
    await sleep(100)
    await bitcoindClient.sendToAddress(address, amount_BTC)
    await bitcoindClient.generateToAddress(6, RANDOM_ADDRESS)
  }

  await Promise.all([
    checkBalance(),
    fundLndWallet()
  ])
}

it('user0 is credited for on chain transaction', async () => {
  await onchain_funding({ walletDestination: walletUser0 })
}, 100000)


it('funding funder with onchain tx from bitcoind', async () => {
  await onchain_funding({ walletDestination: funderWallet })
}, 100000)

it('identifies unconfirmed incoming on chain txn', async () => {
  const address = await walletUser0.getOnChainAddress()

  const sub = await lnService.subscribeToTransactions({ lnd: lndMain })
  sub.on('chain_transaction', onchainTransactionEventHandler)
  
  await Promise.all([
    once(sub, 'chain_transaction'),
    bitcoindClient.sendToAddress(address, amount_BTC)
  ])

  const pendingTxn = await walletUser0.getPendingIncomingOnchainPayments()
  expect(pendingTxn.length).toBe(1)
  expect(pendingTxn[0].amount).toBe(btc2sat(1))

  await sleep(1000)

  expect(sendNotification.mock.calls.length).toBe(1)
  expect(sendNotification.mock.calls[0][0].data.type).toBe("onchain_receipt")
  expect(sendNotification.mock.calls[0][0].title).toBe(
    `You have a pending incoming transaction of ${btc2sat(amount_BTC)} sats`)

  await Promise.all([
    bitcoindClient.generateToAddress(1, RANDOM_ADDRESS),
    once(sub, 'chain_transaction'),
  ])

  await sleep(3000)

  // const util = require('util')
  // console.log(util.inspect(sendNotification.mock.calls, false, Infinity))
  // FIXME: the event is actually fired twice.
  // is it a lnd issue?
  // a workaround: use a hash of the event and store in redis 
  // to not replay if it has already been handled?
  //
  // expect(notification.sendNotification.mock.calls.length).toBe(2)
  // expect(notification.sendNotification.mock.calls[1][0].data.type).toBe("onchain_receipt")
  // expect(notification.sendNotification.mock.calls[1][0].title).toBe(
  //   `Your wallet has been credited with ${btc2sat(amount_BTC)} sats`)

}, 100000)

it('batch send transaction', async () => {
  const address0 = await walletUser0.getOnChainAddress()
  const walletUser4 = await getUserWallet(4)
  const address4 = await walletUser4.getOnChainAddress()

  const initBalanceUser4 = await walletUser4.getBalance()
  console.log({initBalanceUser4, initialBalanceUser0})
  
  const output0 = {}
  output0[address0] = 1
  
  const output1 = {}
  output1[address4] = 2

  const outputs = [output0, output1]

  const {psbt} = await bitcoindClient.walletCreateFundedPsbt([], outputs)
  const decodedPsbt1 = await bitcoindClient.decodePsbt(psbt)
  const analysePsbt1 = await bitcoindClient.analyzePsbt(psbt)
  const walletProcessPsbt = await bitcoindClient.walletProcessPsbt(psbt)
  const decodedPsbt2 = await bitcoindClient.decodePsbt(walletProcessPsbt.psbt)
  const analysePsbt2 = await bitcoindClient.analyzePsbt(walletProcessPsbt.psbt)
  const finalizedPsbt = await bitcoindClient.finalizePsbt(walletProcessPsbt.psbt)
  const txid = await bitcoindClient.sendRawTransaction(finalizedPsbt.hex) 

  // console.log(util.inspect({psbt, decodedPsbt1, walletProcessPsbt, decodedPsbt2, unspent}, false, Infinity))
  console.log(util.inspect({psbt, decodedPsbt1, analysePsbt1, walletProcessPsbt, decodedPsbt2, analysePsbt2, finalizedPsbt}, false, Infinity))
  
  await bitcoindClient.generateToAddress(6, RANDOM_ADDRESS)
  await waitUntilBlockHeight({ lnd: lndMain, blockHeight: initBlockCount + 6 })

  {
    const balance0 = await walletUser0.getBalance()
    const balance4 = await walletUser4.getBalance()
    console.log({balance0, balance4})

    expect(balance0).toBe(initialBalanceUser0 + btc2sat(1))
    expect(balance4).toBe(initBalanceUser4 + btc2sat(2))
  }

  await checkIsBalanced()

}, 100000)