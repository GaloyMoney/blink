/**
 * @jest-environment node
 */
import { SpecterWallet } from "../SpecterWallet";
import { getLastPrice } from "../cache";
import { quit } from "../lock";
import { MainBook, setupMongoConnection, User } from "../mongodb";
import { checkIsBalanced, mockGetExchangeBalance, RANDOM_ADDRESS } from "../tests/helper";
import { baseLogger, bitcoindDefaultClient, getAuth, sleep } from "../utils";
import { getTokenFromPhoneIndex } from "../walletFactory";
const lnService = require('ln-service');

const mongoose = require("mongoose");

let initBlockCount, specterWallet

jest.mock('../notification')
let lnd

beforeAll(async () => {
  await bitcoindDefaultClient.generateToAddress(3, RANDOM_ADDRESS)
  await sleep(1000)

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
  
  specterWallet = new SpecterWallet({ uid: user._id, user: new User(), logger: baseLogger, lastPrice })
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
  const wallets = await specterWallet.listWallets()

  // only the default wallet exist
  if (wallets.length < 2) {
    await specterWallet.createWallet()
  }


  // console.log(await specterWallet.createDepositAddress())
  // console.log(await specterWallet.getAddressInfo({address: "bcrt1qhxdpmrcawcjz8zn2q3d4as23895yc8m9dal03m"}))
  // const balance = await specterWallet.listWallets()
  // expect(balance).toBe(0)
})

it('deposit to bitcoind', async () => {


  const initBitcoindBalance = await specterWallet.getBitcoindBalance()
  const { chain_balance: initLndBalance } = await lnService.getChainBalance({ lnd })
  
  const sats = 10000
  
  await specterWallet.toColdStorage({ sats })
  await bitcoindDefaultClient.generateToAddress(3, RANDOM_ADDRESS)
  
  const bitcoindBalance = await specterWallet.getBitcoindBalance()
  const { chain_balance: lndBalance } = await lnService.getChainBalance({ lnd })

  expect(bitcoindBalance).toBe(initBitcoindBalance + sats)

  const { results: [{ fee }] } = await MainBook.ledger({ account: specterWallet.accountPath, type: "to_cold_storage" })
  expect(lndBalance).toBe(initLndBalance - sats - fee)

})

it('withdrawing from bitcoind', async () => {
  const initBitcoindBalance = await specterWallet.getBitcoindBalance()
  const { chain_balance: initLndBalance } = await lnService.getChainBalance({ lnd })
  
  const sats = 5000
  
  await specterWallet.toLndWallet({ sats })
  await bitcoindDefaultClient.generateToAddress(3, RANDOM_ADDRESS)
  
  const bitcoindBalance = await specterWallet.getBitcoindBalance()
  
  const { chain_balance: lndBalance } = await lnService.getChainBalance({ lnd })
  
  // console.log({initBitcoindBalance, bitcoindBalance, lndBalance, initLndBalance})
  // expect(bitcoindBalance).toBe(initBitcoindBalance - sats)
  // expect(lndBalance).toBe(initLndBalance + sats)

  
  // const balance = await specterWallet.listWallets()
  // expect(balance).toBe(0)
})
