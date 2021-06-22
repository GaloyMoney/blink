/**
 * @jest-environment node
 */
import { setupMongoConnection } from "../mongodb"
import {
  checkIsBalanced,
  lndMain,
  lndOutside1,
  lndOutside2,
  RANDOM_ADDRESS,
  waitUntilBlockHeight,
  mockGetExchangeBalance,
} from "./helper"
import { bitcoindDefaultClient } from "../utils"

import mongoose from "mongoose"
import { createChainAddress } from "lightning"

jest.mock("../realtimePrice")

const initialBitcoinWalletBalance = 0

const blockReward = 50
const numOfBlock = 10
// from: https://developer.bitcoin.org/examples/testing.html
// Unlike mainnet, in regtest mode only the first 150 blocks pay a reward of 50 bitcoins.
// However, a block must have 100 confirmations before that reward can be spent,
// so we generate 101 blocks to get access to the coinbase transaction from block #1.

// !!! this test is not re-entrant !!!

const amount_BTC = 1
let lndOutside1_wallet_addr

beforeAll(async () => {
  await setupMongoConnection()
  mockGetExchangeBalance()
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  await mongoose.connection.close()
  jest.restoreAllMocks()
})

it("funds bitcoind wallet", async () => {
  let balance

  try {
    // depend of bitcoind version. needed in < 0.20 but failed in 0.21?
    const { name } = await bitcoindDefaultClient.createWallet("")
    expect(name).toBe("")
  } catch (err) {
    console.log({ err })
  }

  balance = await bitcoindDefaultClient.getBalance()
  console.log({ balanceInit: balance })

  const bitcoindAddress = await bitcoindDefaultClient.getNewAddress()
  await bitcoindDefaultClient.generateToAddress(numOfBlock, bitcoindAddress)
  await bitcoindDefaultClient.generateToAddress(100, RANDOM_ADDRESS)
  balance = await bitcoindDefaultClient.getBalance()
  expect(balance).toBe(initialBitcoinWalletBalance + blockReward * numOfBlock)
})

it("funds outside lnd node", async () => {
  lndOutside1_wallet_addr = (
    await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })
  ).address
  expect(lndOutside1_wallet_addr.substr(0, 4)).toBe("bcrt")

  await bitcoindDefaultClient.sendToAddress(lndOutside1_wallet_addr, amount_BTC)
  await bitcoindDefaultClient.generateToAddress(6, RANDOM_ADDRESS)

  await waitUntilBlockHeight({ lnd: lndMain, blockHeight: 100 + numOfBlock + 6 })
  await waitUntilBlockHeight({ lnd: lndOutside1, blockHeight: 100 + numOfBlock + 6 })
  await waitUntilBlockHeight({ lnd: lndOutside2, blockHeight: 100 + numOfBlock + 6 })
})
