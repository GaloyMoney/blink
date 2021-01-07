/**
 * @jest-environment node
 */
import { BitcoindWallet } from "../BitcoindWallet";
import { getLastPrice } from "../cache";
import { quit } from "../lock";
import { setupMongoConnection, User } from "../mongodb";
import { checkIsBalanced, getUserWallet, mockGetExchangeBalance, RANDOM_ADDRESS } from "../tests/helper";
import { baseLogger, bitcoindDefaultClient, sat2btc } from "../utils";
import { getTokenFromPhoneIndex } from "../walletFactory";

const mongoose = require("mongoose");

let initBlockCount, bitcoindWallet

jest.mock('../notification')

beforeAll(async () => {
  await setupMongoConnection()
  mockGetExchangeBalance()
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

it('deposit test', async () => {
  const initBitcoindBalance = await bitcoindWallet.getBitcoindBalance()
  
  const sats = 1000

  await bitcoindWallet.rebalance({sats, depositOrWithdraw: "deposit" })
  await bitcoindDefaultClient.generateToAddress(3, RANDOM_ADDRESS)
  
  const bitcoindBalance = await bitcoindWallet.getBitcoindBalance()

  console.log({initBitcoindBalance, bitcoindBalance})
  expect(bitcoindBalance).toBe(sats + initBitcoindBalance)

  
  // const balance = await bitcoindWallet.listWallets()
  // expect(balance).toBe(0)
})
