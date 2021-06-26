/**
 * @jest-environment node
 */
import { once } from "events"
import { filter } from "lodash"
import mongoose from "mongoose"
import { getCurrentPrice } from "../realtimePrice"
import { onchainTransactionEventHandler } from "../entrypoint/trigger"
import { setupMongoConnection } from "../mongodb"
import { getTitle } from "../notifications/payment"
import { bitcoindDefaultClient, btc2sat, sleep } from "../utils"
import { baseLogger } from "../logger"
import { getFunderWallet } from "../walletFactory"
import {
  checkIsBalanced,
  getUserWallet,
  lndMain,
  mockGetExchangeBalance,
  RANDOM_ADDRESS,
  waitUntilBlockHeight,
} from "./helper"
import { subscribeToChainAddress, subscribeToTransactions } from "lightning"

jest.mock("../realtimePrice")

let funderWallet
let initBlockCount
let initialBalanceUser0
let walletUser0
const min_height = 1

let amount_BTC

jest.mock("../notifications/notification")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("../notifications/notification")

const amountAfterFeeDeduction = ({ amount, depositFeeRatio }) =>
  Math.round(btc2sat(amount) * (1 - depositFeeRatio))

beforeAll(async () => {
  await setupMongoConnection()
  mockGetExchangeBalance()
})

beforeEach(async () => {
  walletUser0 = await getUserWallet(0)

  funderWallet = await getFunderWallet({ logger: baseLogger })

  initBlockCount = await bitcoindDefaultClient.getBlockCount()
  initialBalanceUser0 = (await walletUser0.getBalances()).BTC

  amount_BTC = +(1 + Math.random()).toPrecision(9)
})

afterEach(async () => {
  await bitcoindDefaultClient.generateToAddress(3, RANDOM_ADDRESS)
  await sleep(250)
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await mongoose.connection.close()
})

const onchain_funding = async ({ walletDestination }) => {
  const { BTC: initialBalance } = await walletDestination.getBalances()
  const initTransactions = await walletDestination.getTransactions()

  const address = await walletDestination.getOnChainAddress()
  expect(address.substr(0, 4)).toBe("bcrt")

  const checkBalance = async () => {
    const sub = subscribeToChainAddress({
      lnd: lndMain,
      bech32_address: address,
      min_height,
    })
    await once(sub, "confirmation")
    sub.removeAllListeners()

    await waitUntilBlockHeight({ lnd: lndMain, blockHeight: initBlockCount + 6 })
    await checkIsBalanced()

    const { BTC: balance } = await walletDestination.getBalances()
    expect(balance).toBe(
      initialBalance +
        amountAfterFeeDeduction({
          amount: amount_BTC,
          depositFeeRatio: walletDestination.user.depositFeeRatio,
        }),
    )

    const transactions = await walletDestination.getTransactions()

    // last in at [0]?
    // console.log({tx: transactions[0]})

    expect(transactions.length).toBe(initTransactions.length + 1)
    expect(transactions[0].type).toBe("onchain_receipt")
    expect(transactions[0].fee).toBe(Math.round(transactions[0].fee))
    expect(transactions[0].amount).toBe(
      amountAfterFeeDeduction({
        amount: amount_BTC,
        depositFeeRatio: walletDestination.user.depositFeeRatio,
      }),
    )
    expect(transactions[0].addresses[0]).toBe(address)
  }

  const fundWallet = async () => {
    await sleep(100)
    await bitcoindDefaultClient.sendToAddress(address, amount_BTC)
    await bitcoindDefaultClient.generateToAddress(6, RANDOM_ADDRESS)
  }

  await Promise.all([checkBalance(), fundWallet()])
}

it("user0 is credited for on chain transaction", async () => {
  await onchain_funding({ walletDestination: walletUser0 })
})

it("funding funder with onchain tx from bitcoind", async () => {
  await onchain_funding({ walletDestination: funderWallet })
})

it("identifies unconfirmed incoming on chain txn", async () => {
  const address = await walletUser0.getOnChainAddress()

  const sub = await subscribeToTransactions({ lnd: lndMain })
  sub.on("chain_transaction", onchainTransactionEventHandler)

  await Promise.all([
    once(sub, "chain_transaction"),
    bitcoindDefaultClient.sendToAddress(address, amount_BTC),
  ])

  await sleep(1000)

  const txs = await walletUser0.getTransactions()
  const pendingTxs = filter(txs, { pending: true })
  expect(pendingTxs.length).toBe(1)
  expect(pendingTxs[0].amount).toBe(btc2sat(amount_BTC))
  expect(pendingTxs[0].addresses[0]).toBe(address)

  await sleep(1000)

  expect(sendNotification.mock.calls.length).toBe(1)
  expect(sendNotification.mock.calls[0][0].data.type).toBe("onchain_receipt_pending")

  const satsPrice = await getCurrentPrice()
  if (!satsPrice) {
    throw Error(`satsPrice is not set`)
  }
  const usd = (btc2sat(amount_BTC) * satsPrice).toFixed(2)

  expect(sendNotification.mock.calls[0][0].title).toBe(
    getTitle["onchain_receipt_pending"]({ usd, amount: btc2sat(amount_BTC) }),
  )

  await Promise.all([
    bitcoindDefaultClient.generateToAddress(3, RANDOM_ADDRESS),
    once(sub, "chain_transaction"),
  ])

  await sleep(3000)

  // import util from 'util'
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
})

it("batch send transaction", async () => {
  const address0 = await walletUser0.getOnChainAddress()
  const walletUser4 = await getUserWallet(4)
  const address4 = await walletUser4.getOnChainAddress()

  const { BTC: initBalanceUser4 } = await walletUser4.getBalances()
  console.log({ initBalanceUser4, initialBalanceUser0 })

  const output0 = {}
  output0[address0] = 1

  const output1 = {}
  output1[address4] = 2

  const outputs = [output0, output1]

  const { psbt } = await bitcoindDefaultClient.walletCreateFundedPsbt([], outputs)
  // const decodedPsbt1 = await bitcoindDefaultClient.decodePsbt(psbt)
  // const analysePsbt1 = await bitcoindDefaultClient.analyzePsbt(psbt)
  const walletProcessPsbt = await bitcoindDefaultClient.walletProcessPsbt(psbt)
  // const decodedPsbt2 = await bitcoindDefaultClient.decodePsbt(walletProcessPsbt.psbt)
  // const analysePsbt2 = await bitcoindDefaultClient.analyzePsbt(walletProcessPsbt.psbt)
  const finalizedPsbt = await bitcoindDefaultClient.finalizePsbt(walletProcessPsbt.psbt)
  await bitcoindDefaultClient.sendRawTransaction(finalizedPsbt.hex)

  await bitcoindDefaultClient.generateToAddress(6, RANDOM_ADDRESS)
  await waitUntilBlockHeight({ lnd: lndMain, blockHeight: initBlockCount + 6 })

  {
    const { BTC: balance0 } = await walletUser0.getBalances()
    const { BTC: balance4 } = await walletUser4.getBalances()

    expect(balance0).toBe(
      initialBalanceUser0 +
        amountAfterFeeDeduction({
          amount: 1,
          depositFeeRatio: walletUser0.user.depositFeeRatio,
        }),
    )
    expect(balance4).toBe(
      initBalanceUser4 +
        amountAfterFeeDeduction({
          amount: 2,
          depositFeeRatio: walletUser4.user.depositFeeRatio,
        }),
    )
  }
})

it("allows fee exemption for specific users", async () => {
  const walletUser2 = await getUserWallet(2)
  walletUser2.user.depositFeeRatio = 0
  await walletUser2.user.save()
  const { BTC: initBalanceUser2 } = await walletUser2.getBalances()
  await onchain_funding({ walletDestination: walletUser2 })
  const { BTC: finalBalanceUser2 } = await walletUser2.getBalances()
  expect(finalBalanceUser2).toBe(initBalanceUser2 + btc2sat(amount_BTC))
})
