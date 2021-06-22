/**
 * @jest-environment node
 */
import { bitcoindAccountingPath } from "../ledger/ledger"
import { lnd } from "../lndConfig"
import { MainBook, setupMongoConnection } from "../mongodb"
import { SpecterWallet } from "../SpecterWallet"
import { checkIsBalanced, mockGetExchangeBalance, RANDOM_ADDRESS } from "./helper"
import { bitcoindDefaultClient, sleep } from "../utils"
import { baseLogger } from "../logger"
import { UserWallet } from "../userWallet"

import mongoose from "mongoose"
import { getChainBalance } from "lightning"

let specterWallet

jest.mock("../notifications/notification")
jest.mock("../realtimePrice")

beforeAll(async () => {
  await bitcoindDefaultClient.generateToAddress(3, RANDOM_ADDRESS)
  await sleep(1000)

  await setupMongoConnection()
  mockGetExchangeBalance()
})

beforeEach(async () => {
  // initBlockCount = await bitcoindDefaultClient.getBlockCount()
  UserWallet.setCurrentPrice(10000)
  specterWallet = new SpecterWallet({ logger: baseLogger })
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await mongoose.connection.close()
})

it("createWallet", async () => {
  {
    const wallets = await SpecterWallet.listWallets()

    if (wallets.length < 2) {
      await SpecterWallet.createWallet()
    }
  }

  {
    const wallets = await SpecterWallet.listWallets()
    console.log({ wallets })
  }

  // console.log(await specterWallet.createDepositAddress())
  // console.log(await specterWallet.getAddressInfo({address: "bcrt1qhxdpmrcawcjz8zn2q3d4as23895yc8m9dal03m"}))
  // const balance = await SpecterWallet.listWallets()
  // expect(balance).toBe(0)
})

it("deposit to bitcoind", async () => {
  const initBitcoindBalance = await specterWallet.getBitcoindBalance()
  const { chain_balance: initLndBalance } = await getChainBalance({ lnd })

  const sats = 10000

  await specterWallet.toColdStorage({ sats })
  await bitcoindDefaultClient.generateToAddress(6, RANDOM_ADDRESS)

  // TODO: use events, to make sure lnd has updated its utxo set
  // and considered the change UTXO in the balance
  await sleep(1000)

  const bitcoindBalance = await specterWallet.getBitcoindBalance()
  const { chain_balance: lndBalance } = await getChainBalance({ lnd })

  expect(bitcoindBalance).toBe(initBitcoindBalance + sats)

  const {
    results: [{ fee }],
  } = await MainBook.ledger({ account: bitcoindAccountingPath, type: "to_cold_storage" })

  console.log({
    lndBalance,
    initLndBalance,
    sats,
    fee,
    bitcoindBalance,
    initBitcoindBalance,
  })
  expect(lndBalance).toBe(initLndBalance - sats - fee)
})

// TODO: Fix or remove. Expectations were commented out
// it('withdrawing from bitcoind', async () => {
//   const initBitcoindBalance = await specterWallet.getBitcoindBalance()
//   const { chain_balance: initLndBalance } = await getChainBalance({ lnd })

//   const sats = 5000

//   await specterWallet.toLndWallet({ sats })
//   await bitcoindDefaultClient.generateToAddress(3, RANDOM_ADDRESS)

//   const bitcoindBalance = await specterWallet.getBitcoindBalance()

//   // const { chain_balance: lndBalance } = await getChainBalance({ lnd })

//   // console.log({initBitcoindBalance, bitcoindBalance, lndBalance, initLndBalance})
//   // expect(bitcoindBalance).toBe(initBitcoindBalance - sats)
//   // expect(lndBalance).toBe(initLndBalance + sats)

//   // const balance = await SpecterWallet.listWallets()
//   // expect(balance).toBe(0)
// })
