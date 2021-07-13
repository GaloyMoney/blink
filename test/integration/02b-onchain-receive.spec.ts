import { once } from "events"
import { filter } from "lodash"
import { baseLogger } from "src/logger"
import { yamlConfig } from "src/config"
import { getCurrentPrice } from "src/realtimePrice"
import { btc2sat, sat2btc, sleep } from "src/utils"
import { getFunderWallet } from "src/walletFactory"
import { getTitle } from "src/notifications/payment"
import { MainBook, setupMongoConnection } from "src/mongodb"
import { onchainTransactionEventHandler } from "src/entrypoint/trigger"
import { liabilitiesReserve, lndAccountingPath } from "src/ledger/ledger"
import {
  checkIsBalanced,
  getUserWallet,
  lnd1,
  lndonchain,
  mockGetExchangeBalance,
  RANDOM_ADDRESS,
  waitUntilBlockHeight,
  createChainAddress,
  subscribeToChainAddress,
  subscribeToTransactions,
  bitcoindClient,
} from "test/helpers"

jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))

let mongoose
let funderWallet
let initBlockCount
let initialBalanceUser0
let walletUser0
let walletUser2
let walletUser11
let walletUser12
const min_height = 1

let amount_BTC

jest.mock("src/notifications/notification")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("src/notifications/notification")

const amountAfterFeeDeduction = ({ amount, depositFeeRatio }) =>
  Math.round(btc2sat(amount) * (1 - depositFeeRatio))

beforeAll(async () => {
  mongoose = await setupMongoConnection()
  mockGetExchangeBalance()
})

beforeEach(async () => {
  walletUser0 = await getUserWallet(0)

  funderWallet = await getFunderWallet({ logger: baseLogger })

  initBlockCount = await bitcoindClient.getBlockCount()
  initialBalanceUser0 = (await walletUser0.getBalances()).BTC

  amount_BTC = +(1 + Math.random()).toPrecision(9)
  // amount_BTC = 1
})

afterEach(async () => {
  await bitcoindClient.generateToAddress(3, RANDOM_ADDRESS)
  await sleep(250)
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await mongoose.connection.close()
})

const onchain_funding = async ({ walletDestination }) => {
  const lnd = lndonchain

  const { BTC: initialBalance } = await walletDestination.getBalances()
  const initTransactions = await walletDestination.getTransactions()

  const address = await walletDestination.getOnChainAddress()
  expect(address.substr(0, 4)).toBe("bcrt")

  const checkBalance = async () => {
    const sub = subscribeToChainAddress({ lnd, bech32_address: address, min_height })
    await once(sub, "confirmation")
    sub.removeAllListeners()

    await waitUntilBlockHeight({ lnd, blockHeight: initBlockCount + 6 })
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
    await bitcoindClient.sendToAddress(address, amount_BTC)
    await bitcoindClient.generateToAddress(6, RANDOM_ADDRESS)
  }

  await Promise.all([checkBalance(), fundWallet()])
}

it("user0IsCreditedForOnChainTransaction", async () => {
  await onchain_funding({ walletDestination: walletUser0 })
})

it("user11IsCreditedForOnChainSendAllTransaction", async () => {
  /// TODO? add sendAll tests in which the user has more than the limit?
  const level1WithdrawalLimit = yamlConfig.limits.withdrawal.level["1"] // sats
  amount_BTC = sat2btc(level1WithdrawalLimit)
  walletUser11 = await getUserWallet(11)
  await onchain_funding({ walletDestination: walletUser11 })
})

it("user12IsCreditedForOnChainOnUsSendAllTransaction", async () => {
  const level1OnUsLimit = yamlConfig.limits.onUs.level["1"] // sats
  amount_BTC = sat2btc(level1OnUsLimit)
  walletUser12 = await getUserWallet(12)
  await onchain_funding({ walletDestination: walletUser12 })
})

it("fundingFunderWithOnchainTxFromBitcoind", async () => {
  await onchain_funding({ walletDestination: funderWallet })
})

it("creditingLnd1WithSomeFundToCreateAChannel", async () => {
  const { address } = await createChainAddress({
    lnd: lnd1,
    format: "p2wpkh",
  })

  const amount = 1
  await bitcoindClient.sendToAddress(address, amount)
  await bitcoindClient.generateToAddress(6, RANDOM_ADDRESS)

  const sats = btc2sat(amount)
  const metadata = { type: "onchain_receipt", currency: "BTC", pending: "false" }

  await MainBook.entry("funding tx")
    .credit(liabilitiesReserve, sats, metadata)
    .debit(lndAccountingPath, sats, metadata)
    .commit()
})

it("batch send transaction", async () => {
  const address0 = await walletUser0.getOnChainAddress()
  const walletUser4 = await getUserWallet(4)
  const address4 = await walletUser4.getOnChainAddress()

  const { BTC: initBalanceUser4 } = await walletUser4.getBalances()

  const output0 = {}
  output0[address0] = 1

  const output1 = {}
  output1[address4] = 2

  const outputs = [output0, output1]

  const { psbt } = await bitcoindClient.walletCreateFundedPsbt([], outputs)
  // const decodedPsbt1 = await bitcoindClient.decodePsbt(psbt)
  // const analysePsbt1 = await bitcoindClient.analyzePsbt(psbt)
  const walletProcessPsbt = await bitcoindClient.walletProcessPsbt(psbt)
  // const decodedPsbt2 = await bitcoindClient.decodePsbt(walletProcessPsbt.psbt)
  // const analysePsbt2 = await bitcoindClient.analyzePsbt(walletProcessPsbt.psbt)
  const finalizedPsbt = await bitcoindClient.finalizePsbt(walletProcessPsbt.psbt)
  await bitcoindClient.sendRawTransaction(finalizedPsbt.hex)

  await bitcoindClient.generateToAddress(6, RANDOM_ADDRESS)
  await waitUntilBlockHeight({ lnd: lndonchain, blockHeight: initBlockCount + 6 })

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

it("identifiesUnconfirmedIncomingOnChainTxn", async () => {
  const address = await walletUser0.getOnChainAddress()

  const sub = subscribeToTransactions({ lnd: lndonchain })
  sub.on("chain_transaction", onchainTransactionEventHandler)

  await Promise.all([
    once(sub, "chain_transaction"),
    bitcoindClient.sendToAddress(address, amount_BTC),
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
    bitcoindClient.generateToAddress(3, RANDOM_ADDRESS),
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

it("allows fee exemption for specific users", async () => {
  walletUser2 = await getUserWallet(2)
  walletUser2.user.depositFeeRatio = 0
  await walletUser2.user.save()
  const { BTC: initBalanceUser2 } = await walletUser2.getBalances()
  await onchain_funding({ walletDestination: walletUser2 })
  const { BTC: finalBalanceUser2 } = await walletUser2.getBalances()
  expect(finalBalanceUser2).toBe(initBalanceUser2 + btc2sat(amount_BTC))
})
