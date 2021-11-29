import { once } from "events"
import { filter } from "lodash"
import { baseLogger } from "@services/logger"
import { getOnChainAddressCreateAttemptLimits, getUserLimits } from "@config/app"
import { btc2sat, sat2btc, sleep } from "@core/utils"
import { getTitle } from "@services/notifications/payment"
import { onchainTransactionEventHandler } from "@servers/trigger"
import {
  checkIsBalanced,
  getAndCreateUserWallet,
  lndonchain,
  RANDOM_ADDRESS,
  waitUntilBlockHeight,
  sendToAddressAndConfirm,
  subscribeToChainAddress,
  subscribeToTransactions,
  bitcoindClient,
  bitcoindOutside,
  amountAfterFeeDeduction,
} from "test/helpers"
import * as Wallets from "@app/wallets"
import { TxStatus } from "@domain/wallets"
import { getBTCBalance } from "test/helpers/wallet"
import { resetOnChainAddressWalletIdLimits } from "test/helpers/rate-limit"
import { OnChainAddressCreateRateLimiterExceededError } from "@domain/rate-limit/errors"
import { NotificationType } from "@domain/notifications"

import { getCurrentPrice } from "@app/prices"
import { getFunderWalletId } from "@services/ledger/accounts"
import { WalletFactory } from "@core/wallet-factory"
import { User } from "@services/mongoose/schema"

jest.mock("@app/prices/get-current-price", () => require("test/mocks/get-current-price"))

let walletUser0
let walletUser2
let walletUser11
let walletUser12
let amountBTC

const userLimits = getUserLimits({ level: 1 })

jest.mock("@services/notifications/notification")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("@services/notifications/notification")

beforeAll(async () => {
  walletUser0 = await getAndCreateUserWallet(0)
  // load funder wallet before use it
  await getAndCreateUserWallet(4)
  await bitcoindClient.loadWallet({ filename: "outside" })
})

beforeEach(() => {
  jest.resetAllMocks()
  amountBTC = +(1 + Math.random()).toPrecision(9)
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

describe("FunderWallet - On chain", () => {
  it("receives on-chain transaction", async () => {
    const funderWalletId = await getFunderWalletId()
    const user = await User.findOne({ _id: funderWalletId })
    const funderWallet = WalletFactory({ user, logger: baseLogger })
    await sendToWallet({ walletDestination: funderWallet })
  })
})

describe("UserWallet - On chain", () => {
  it("get last on chain address", async () => {
    const address = await Wallets.createOnChainAddress(walletUser0.user.id)
    const lastAddress = await Wallets.getLastOnChainAddress(walletUser0.user.id)

    expect(address).not.toBeInstanceOf(Error)
    expect(lastAddress).not.toBeInstanceOf(Error)
    expect(lastAddress).toBe(address)
  })

  it("fails to create onChain Address past rate limit", async () => {
    // Reset limits before starting
    let resetOk = await resetOnChainAddressWalletIdLimits(walletUser0.user.id)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of addresses
    const limitsNum = getOnChainAddressCreateAttemptLimits().points
    const promises: Promise<OnChainAddress | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const onChainAddressPromise = Wallets.createOnChainAddress(walletUser0.user.id)
      promises.push(onChainAddressPromise)
    }
    const onChainAddresses = await Promise.all(promises)
    const isNotError = (item) => !(item instanceof Error)
    expect(onChainAddresses.every(isNotError)).toBe(true)

    // Test that first address past the limit fails
    const onChainAddress = await Wallets.createOnChainAddress(walletUser0.user.id)
    expect(onChainAddress).toBeInstanceOf(OnChainAddressCreateRateLimiterExceededError)

    // Reset limits when done for other tests
    resetOk = await resetOnChainAddressWalletIdLimits(walletUser0.user.id)
    expect(resetOk).not.toBeInstanceOf(Error)
  })

  it("receives on-chain transaction", async () => {
    await sendToWallet({ walletDestination: walletUser0 })
  })

  it("receives on-chain transaction with max limit for withdrawal level1", async () => {
    /// TODO? add sendAll tests in which the user has more than the limit?
    const level1WithdrawalLimit = userLimits.withdrawalLimit // sats
    amountBTC = sat2btc(level1WithdrawalLimit)
    walletUser11 = await getAndCreateUserWallet(11)
    await sendToWallet({ walletDestination: walletUser11 })
  })

  it("receives on-chain transaction with max limit for onUs level1", async () => {
    const level1OnUsLimit = userLimits.onUsLimit // sats
    amountBTC = sat2btc(level1OnUsLimit)
    walletUser12 = await getAndCreateUserWallet(12)
    await sendToWallet({ walletDestination: walletUser12 })
  })

  it("receives batch on-chain transaction", async () => {
    const address0 = await Wallets.createOnChainAddress(walletUser0.user.id)
    if (address0 instanceof Error) throw address0

    const walletUser4 = await getAndCreateUserWallet(4)
    const address4 = await Wallets.createOnChainAddress(walletUser4.user.id)
    if (address4 instanceof Error) throw address4

    const initialBalanceUser0 = await getBTCBalance(walletUser0.user.id)
    const initBalanceUser4 = await getBTCBalance(walletUser4.user.id)

    const output0 = {}
    output0[address0] = 1

    const output1 = {}
    output1[address4] = 2

    const outputs = [output0, output1]

    const { psbt } = await bitcoindOutside.walletCreateFundedPsbt({ inputs: [], outputs })
    // const decodedPsbt1 = await bitcoindOutside.decodePsbt(psbt)
    // const analysePsbt1 = await bitcoindOutside.analyzePsbt(psbt)
    const walletProcessPsbt = await bitcoindOutside.walletProcessPsbt({ psbt })
    // const decodedPsbt2 = await bitcoindOutside.decodePsbt(walletProcessPsbt.psbt)
    // const analysePsbt2 = await bitcoindOutside.analyzePsbt(walletProcessPsbt.psbt)
    const finalizedPsbt = await bitcoindOutside.finalizePsbt({
      psbt: walletProcessPsbt.psbt,
    })

    await bitcoindOutside.sendRawTransaction({ hexstring: finalizedPsbt.hex })
    await bitcoindOutside.generateToAddress({ nblocks: 6, address: RANDOM_ADDRESS })
    await waitUntilBlockHeight({ lnd: lndonchain })

    // this is done by trigger and/or cron in prod
    const result = await Wallets.updateOnChainReceipt({ logger: baseLogger })
    if (result instanceof Error) {
      throw result
    }

    {
      const balance0 = await getBTCBalance(walletUser0.user.id)
      const balance4 = await getBTCBalance(walletUser4.user.id)

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
    const address = await Wallets.createOnChainAddress(walletUser0.user.id)
    if (address instanceof Error) throw address

    const sub = subscribeToTransactions({ lnd: lndonchain })
    sub.on("chain_transaction", onchainTransactionEventHandler)

    await Promise.all([
      once(sub, "chain_transaction"),
      bitcoindOutside.sendToAddress({ address, amount: amountBTC }),
    ])

    await sleep(1000)

    const { result: txs, error } = await Wallets.getTransactionsForWalletId({
      walletId: walletUser0.user.id,
    })
    if (error instanceof Error || txs === null) {
      throw error
    }
    const pendingTxs = filter(txs, { status: TxStatus.Pending })
    expect(pendingTxs.length).toBe(1)

    const pendingTx = pendingTxs[0] as WalletOnChainTransaction
    expect(pendingTx.settlementVia).toBe("onchain")
    expect(pendingTx.settlementAmount).toBe(btc2sat(amountBTC))
    expect(pendingTx.address).toBe(address)

    await sleep(1000)

    expect(sendNotification.mock.calls.length).toBe(1)
    expect(sendNotification.mock.calls[0][0].data.type).toBe(
      NotificationType.OnchainReceiptPending,
    )

    const satsPrice = await getCurrentPrice()
    if (satsPrice instanceof Error) throw satsPrice
    const usd = (btc2sat(amountBTC) * satsPrice).toFixed(2)

    expect(sendNotification.mock.calls[0][0].title).toBe(
      getTitle[NotificationType.OnchainReceiptPending]({
        usd,
        amount: btc2sat(amountBTC),
      }),
    )

    await Promise.all([
      bitcoindOutside.generateToAddress({ nblocks: 3, address: RANDOM_ADDRESS }),
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
    // expect(notification.sendNotification.mock.calls[1][0].data.type).toBe(NotificationType.OnchainReceipt)
    // expect(notification.sendNotification.mock.calls[1][0].title).toBe(
    //   `Your wallet has been credited with ${btc2sat(amountBTC)} sats`)
  })

  it("allows fee exemption for specific users", async () => {
    walletUser2 = await getAndCreateUserWallet(2)
    walletUser2.user.depositFeeRatio = 0
    await walletUser2.user.save()
    const initBalanceUser2 = await getBTCBalance(walletUser2.user.id)
    await sendToWallet({ walletDestination: walletUser2 })
    const finalBalanceUser2 = await getBTCBalance(walletUser2.user.id)
    expect(finalBalanceUser2).toBe(initBalanceUser2 + btc2sat(amountBTC))
  })
})

// all must be from outside if is about funding
async function sendToWallet({ walletDestination }) {
  const lnd = lndonchain

  const initialBalance = await getBTCBalance(walletDestination.user.id)
  const { result: initTransactions, error } = await Wallets.getTransactionsForWalletId({
    walletId: walletDestination.user.id,
  })
  if (error instanceof Error || initTransactions === null) {
    throw error
  }

  const address = await Wallets.createOnChainAddress(walletDestination.user.id)
  if (address instanceof Error) throw address

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
    // this is done by trigger and/or cron in prod
    const result = await Wallets.updateOnChainReceipt({ logger: baseLogger })
    if (result instanceof Error) {
      throw result
    }

    const balance = await getBTCBalance(walletDestination.user.id)
    expect(balance).toBe(
      initialBalance +
        amountAfterFeeDeduction({
          amount: amountBTC,
          depositFeeRatio: walletDestination.user.depositFeeRatio,
        }),
    )

    const { result: transactions, error } = await Wallets.getTransactionsForWalletId({
      walletId: walletDestination.user.id as WalletId,
    })
    if (error instanceof Error || transactions === null) {
      throw error
    }

    expect(transactions.length).toBe(initTransactions.length + 1)

    const txn = transactions[0] as WalletOnChainTransaction
    expect(txn.settlementVia).toBe("onchain")
    expect(txn.settlementFee).toBe(Math.round(txn.settlementFee))
    expect(txn.settlementAmount).toBe(
      amountAfterFeeDeduction({
        amount: amountBTC,
        depositFeeRatio: walletDestination.user.depositFeeRatio,
      }),
    )
    expect(txn.address).toBe(address)
  }

  // just to improve performance
  const blockNumber = await bitcoindClient.getBlockCount()
  await sendToAddressAndConfirm({
    walletClient: bitcoindOutside,
    address,
    amount: amountBTC,
  })
  await checkBalance(blockNumber)
}
