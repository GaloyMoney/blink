/**
 * @jest-environment node
 */
import { BitcoindWallet } from "../BitcoindWallet";
import { getLastPrice } from "../cache";
import { quit } from "../lock";
import { setupMongoConnection, User } from "../mongodb";
import { checkIsBalanced, mockGetExchangeBalance, RANDOM_ADDRESS } from "../tests/helper";
import { baseLogger, bitcoindDefaultClient, getAuth } from "../utils";
import { getTokenFromPhoneIndex } from "../walletFactory";
const lnService = require('ln-service');

const mongoose = require("mongoose");

let initBlockCount, bitcoindWallet

jest.mock('../notification')
let lnd

beforeAll(async () => {
  await setupMongoConnection()
  mockGetExchangeBalance()
  lnd = lnService.authenticatedLndGrpc(getAuth()).lnd
})

beforeEach(async () => {
  initBlockCount = await bitcoindDefaultClient.getBlockCount()
  const lastPrice = await getLastPrice()

  // FIXME: define a proper user for this after merge with usd/btc branch
  const token = await getTokenFromPhoneIndex(11)
  const user = await User.findOne({_id: token.uid})
  
  bitcoindWallet = new BitcoindWallet({ uid: user._id, user: new User(), logger: baseLogger, lastPrice })
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks();
	await mongoose.connection.close()
  await quit()
})

it('createWallet', async () => {
  const wallets = await bitcoindWallet.listWallets()

  // only the default wallet exist
  if (wallets.length < 2) {
    await bitcoindWallet.createWallet()
  }


  // console.log(await bitcoindWallet.createDepositAddress())
  // console.log(await bitcoindWallet.getAddressInfo({address: "bcrt1qhxdpmrcawcjz8zn2q3d4as23895yc8m9dal03m"}))
  // const balance = await bitcoindWallet.listWallets()
  // expect(balance).toBe(0)
})

it('deposit to bitcoind', async () => {
  const initBitcoindBalance = await bitcoindWallet.getBitcoindBalance()
  const { chain_balance: initLndBalance } = await lnService.getChainBalance({ lnd })
  
  const sats = 10000
  
  await bitcoindWallet.rebalance({sats, depositOrWithdraw: "deposit" })
  await bitcoindDefaultClient.generateToAddress(3, RANDOM_ADDRESS)
  
  const bitcoindBalance = await bitcoindWallet.getBitcoindBalance()
  const { chain_balance: lndBalance } = await lnService.getChainBalance({ lnd })

  expect(bitcoindBalance).toBe(initBitcoindBalance + sats)

  const fees = 0 // FIXME fetch number dynamically
  expect(lndBalance).toBe(initLndBalance - sats - fees)

})

it('withdrawing from bitcoind', async () => {
  const initBitcoindBalance = await bitcoindWallet.getBitcoindBalance()
  const { chain_balance: initLndBalance } = await lnService.getChainBalance({ lnd })
  
  const sats = 5000
  
  await bitcoindWallet.rebalance({ sats, depositOrWithdraw: "withdraw" })
  await bitcoindDefaultClient.generateToAddress(3, RANDOM_ADDRESS)
  
  const bitcoindBalance = await bitcoindWallet.getBitcoindBalance()
  
  const { chain_balance: lndBalance } = await lnService.getChainBalance({ lnd })
  
  console.log({initBitcoindBalance, bitcoindBalance, lndBalance, initLndBalance})
  expect(bitcoindBalance).toBe(initBitcoindBalance - sats)
  expect(lndBalance).toBe(initLndBalance + sats)

  
  // const balance = await bitcoindWallet.listWallets()
  // expect(balance).toBe(0)
})
