import { once } from "events"
import { filter } from "lodash"
import { baseLogger } from "src/logger"
import { TransactionLimits } from "src/config"
import { getCurrentPrice } from "src/realtimePrice"
import { btc2sat, sat2btc, sleep } from "src/utils"
import { getFunderWallet } from "src/walletFactory"
import { getTitle } from "src/notifications/payment"
import { onchainTransactionEventHandler } from "src/entrypoint/trigger"
import {
  checkIsBalanced,
  getUserWallet,
  lndonchain,
  RANDOM_ADDRESS,
  waitUntilBlockHeight,
  subscribeToChainAddress,
  subscribeToTransactions,
  bitcoindClient,
  amountAfterFeeDeduction,
} from "test/helpers"

jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))
jest.mock("src/phone-provider", () => require("test/mocks/phone-provider"))

let walletUser0
let walletUser2
let walletUser11
let walletUser12
let amountBTC

const transactionLimits = new TransactionLimits({
  level: "1",
})

jest.mock("src/notifications/notification")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("src/notifications/notification")

beforeAll(async () => {
  walletUser0 = await getUserWallet(0)
  // load funder wallet before use it
  await getUserWallet(4)
})

beforeEach(() => {
  amountBTC = +(1 + Math.random()).toPrecision(9)
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe("FunderWallet - On chain", () => {
  it("receives on-chain transaction", async () => {
    const funderWallet = await getFunderWallet({ logger: baseLogger })
    await sendToWallet({ walletDestination: funderWallet })
  })
})

describe("UserWallet - On chain", () => {
  it("receives on-chain transaction", async () => {
    await sendToWallet({ walletDestination: walletUser0 })
  })

  it("receives on-chain transaction with max limit for withdrawal level1", async () => {
    /// TODO? add sendAll tests in which the user has more than the limit?
    const level1WithdrawalLimit = transactionLimits.withdrawalLimit() // sats
    amountBTC = sat2btc(level1WithdrawalLimit)
    walletUser11 = await getUserWallet(11)
    await sendToWallet({ walletDestination: walletUser11 })
  })

  it("receives on-chain transaction with max limit for onUs level1", async () => {
    const level1OnUsLimit = transactionLimits.onUsLimit() // sats
    amountBTC = sat2btc(level1OnUsLimit)
    walletUser12 = await getUserWallet(12)
    await sendToWallet({ walletDestination: walletUser12 })
  })

  it("receives batch on-chain transaction", async () => {
    const address0 = await walletUser0.getOnChainAddress()
    const walletUser4 = await getUserWallet(4)
    const address4 = await walletUser4.getOnChainAddress()

    const { BTC: initialBalanceUser0 } = await walletUser0.getBalances()
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
    await waitUntilBlockHeight({ lnd: lndonchain })

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

  it("identifies unconfirmed incoming on-chain transactions", async () => {
    const address = await walletUser0.getOnChainAddress()
    const sub = subscribeToTransactions({ lnd: lndonchain })
    sub.on("chain_transaction", onchainTransactionEventHandler)

    await Promise.all([
      once(sub, "chain_transaction"),
      bitcoindClient.sendToAddress(address, amountBTC),
    ])

    await sleep(1000)

    const txs = await walletUser0.getTransactions()
    const pendingTxs = filter(txs, { pending: true })
    expect(pendingTxs.length).toBe(1)
    expect(pendingTxs[0].amount).toBe(btc2sat(amountBTC))
    expect(pendingTxs[0].addresses[0]).toBe(address)

    await sleep(1000)

    expect(sendNotification.mock.calls.length).toBe(1)
    expect(sendNotification.mock.calls[0][0].data.type).toBe("onchain_receipt_pending")

    const satsPrice = await getCurrentPrice()
    if (!satsPrice) {
      throw Error(`satsPrice is not set`)
    }
    const usd = (btc2sat(amountBTC) * satsPrice).toFixed(2)

    expect(sendNotification.mock.calls[0][0].title).toBe(
      getTitle["onchain_receipt_pending"]({ usd, amount: btc2sat(amountBTC) }),
    )

    await Promise.all([
      bitcoindClient.generateToAddress(3, RANDOM_ADDRESS),
      once(sub, "chain_transaction"),
    ])

    await sleep(3000)
    sub.removeAllListeners()

    // import util from 'util'
    // baseLogger.debug(util.inspect(sendNotification.mock.calls, false, Infinity))
    // FIXME: the event is actually fired twice.
    // is it a lnd issue?
    // a workaround: use a hash of the event and store in redis
    // to not replay if it has already been handled?
    //
    // expect(notification.sendNotification.mock.calls.length).toBe(2)
    // expect(notification.sendNotification.mock.calls[1][0].data.type).toBe("onchain_receipt")
    // expect(notification.sendNotification.mock.calls[1][0].title).toBe(
    //   `Your wallet has been credited with ${btc2sat(amountBTC)} sats`)
  })

  it("allows fee exemption for specific users", async () => {
    walletUser2 = await getUserWallet(2)
    walletUser2.user.depositFeeRatio = 0
    await walletUser2.user.save()
    const { BTC: initBalanceUser2 } = await walletUser2.getBalances()
    await sendToWallet({ walletDestination: walletUser2 })
    const { BTC: finalBalanceUser2 } = await walletUser2.getBalances()
    expect(finalBalanceUser2).toBe(initBalanceUser2 + btc2sat(amountBTC))
  })
})

async function sendToWallet({ walletDestination }) {
  const lnd = lndonchain

  const { BTC: initialBalance } = await walletDestination.getBalances()
  const initTransactions = await walletDestination.getTransactions()

  const address = await walletDestination.getOnChainAddress()
  expect(address.substr(0, 4)).toBe("bcrt")

  const checkBalance = async (minBlockToWatch = 1) => {
    const sub = subscribeToChainAddress({
      lnd,
      bech32_address: address,
      min_height: minBlockToWatch,
    })
    await once(sub, "confirmation")
    sub.removeAllListeners()

    await waitUntilBlockHeight({ lnd })
    await checkIsBalanced()

    const { BTC: balance } = await walletDestination.getBalances()
    expect(balance).toBe(
      initialBalance +
        amountAfterFeeDeduction({
          amount: amountBTC,
          depositFeeRatio: walletDestination.user.depositFeeRatio,
        }),
    )

    const transactions = await walletDestination.getTransactions()

    expect(transactions.length).toBe(initTransactions.length + 1)
    expect(transactions[0].type).toBe("onchain_receipt")
    expect(transactions[0].fee).toBe(Math.round(transactions[0].fee))
    expect(transactions[0].amount).toBe(
      amountAfterFeeDeduction({
        amount: amountBTC,
        depositFeeRatio: walletDestination.user.depositFeeRatio,
      }),
    )
    expect(transactions[0].addresses[0]).toBe(address)
  }

  // just to improve performance
  const blockNumber = await bitcoindClient.getBlockCount()
  await bitcoindClient.sendToAddressAndConfirm(address, amountBTC)
  await checkBalance(blockNumber)
}
