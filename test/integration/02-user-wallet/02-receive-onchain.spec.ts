import { once } from "events"

import { Prices, Wallets } from "@app"
import {
  getFeeRates,
  getOnChainAddressCreateAttemptLimits,
  getAccountLimits,
} from "@config"
import { sat2btc, toSats } from "@domain/bitcoin"
import { NotificationType } from "@domain/notifications"
import { OnChainAddressCreateRateLimiterExceededError } from "@domain/rate-limit/errors"
import { TxStatus } from "@domain/wallets"
import { onchainTransactionEventHandler } from "@servers/trigger"
import { getFunderWalletId } from "@services/ledger/caching"
import { baseLogger } from "@services/logger"
import { getTitle } from "@services/notifications/payment"
import { sleep } from "@utils"

import { DisplayCurrencyConverter } from "@domain/fiat/display-currency"

import { getCurrentPrice } from "@app/prices"

import {
  amountAfterFeeDeduction,
  bitcoindClient,
  bitcoindOutside,
  checkIsBalanced,
  createMandatoryUsers,
  createUserAndWalletFromUserRef,
  getAccountIdByTestUserRef,
  getDefaultWalletIdByRole,
  getDefaultWalletIdByTestUserRef,
  getUserRecordByTestUserRef,
  lndonchain,
  RANDOM_ADDRESS,
  sendToAddressAndConfirm,
  subscribeToChainAddress,
  subscribeToTransactions,
  waitUntilBlockHeight,
} from "test/helpers"
import { resetOnChainAddressAccountIdLimits } from "test/helpers/rate-limit"
import { getBTCBalance } from "test/helpers/wallet"

jest.mock("@app/prices/get-current-price", () => require("test/mocks/get-current-price"))

let walletIdA: WalletId
let accountIdA: AccountId

const accountLimits = getAccountLimits({ level: 1 })

jest.mock("@services/notifications/notification")
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("@services/notifications/notification")

beforeAll(async () => {
  await createMandatoryUsers()

  await bitcoindClient.loadWallet({ filename: "outside" })

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  accountIdA = await getAccountIdByTestUserRef("A")

  await createUserAndWalletFromUserRef("C")
})

beforeEach(() => {
  jest.resetAllMocks()

  // the randomness aim to ensure that we don't pass the test with 2 false negative
  // that could turn the result in a false positive
  // we could get rid of the random with a different amountSats for each test
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
    await sendToWalletTestWrapper({
      walletId: funderWalletId,
      amountSats: getRandomAmountOfSats(),
    })
  })
})

describe("UserWallet - On chain", () => {
  it("get last on chain address", async () => {
    const address = await Wallets.createOnChainAddress(walletIdA)
    const lastAddress = await Wallets.getLastOnChainAddress(walletIdA)

    expect(address).not.toBeInstanceOf(Error)
    expect(lastAddress).not.toBeInstanceOf(Error)
    expect(lastAddress).toBe(address)
  })

  it("fails to create onChain Address past rate limit", async () => {
    // Reset limits before starting
    let resetOk = await resetOnChainAddressAccountIdLimits(accountIdA)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of addresses
    const limitsNum = getOnChainAddressCreateAttemptLimits().points
    const promises: Promise<OnChainAddress | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const onChainAddressPromise = Wallets.createOnChainAddress(walletIdA)
      promises.push(onChainAddressPromise)
    }
    const onChainAddresses = await Promise.all(promises)
    const isNotError = (item) => !(item instanceof Error)
    expect(onChainAddresses.every(isNotError)).toBe(true)

    // Test that first address past the limit fails
    const onChainAddress = await Wallets.createOnChainAddress(walletIdA)
    expect(onChainAddress).toBeInstanceOf(OnChainAddressCreateRateLimiterExceededError)

    // Reset limits when done for other tests
    resetOk = await resetOnChainAddressAccountIdLimits(accountIdA)
    expect(resetOk).not.toBeInstanceOf(Error)
  })

  it("receives on-chain transaction", async () => {
    await sendToWalletTestWrapper({
      walletId: walletIdA,
      amountSats: getRandomAmountOfSats(),
    })
  })

  it("receives on-chain transaction with max limit for withdrawal level1", async () => {
    /// TODO? add sendAll tests in which the user has more than the limit?
    const withdrawlLimitAccountLevel1 = accountLimits.withdrawalLimit // cents
    await createUserAndWalletFromUserRef("E")
    const walletId = await getDefaultWalletIdByTestUserRef("E")

    const price = await getCurrentPrice()
    if (price instanceof Error) throw price
    const dCConverter = DisplayCurrencyConverter(price)
    const amountSats = dCConverter.fromCentsToSats(withdrawlLimitAccountLevel1)

    await sendToWalletTestWrapper({ walletId, amountSats })
  })

  it("receives on-chain transaction with max limit for onUs level1", async () => {
    const intraLedgerLimitAccountLevel1 = accountLimits.intraLedgerLimit // cents

    await createUserAndWalletFromUserRef("F")
    const walletId = await getDefaultWalletIdByTestUserRef("F")

    const price = await getCurrentPrice()
    if (price instanceof Error) throw price
    const dCConverter = DisplayCurrencyConverter(price)
    const amountSats = dCConverter.fromCentsToSats(intraLedgerLimitAccountLevel1)

    await sendToWalletTestWrapper({ walletId, amountSats })
  })

  it("receives batch on-chain transaction", async () => {
    const address0 = await Wallets.createOnChainAddress(walletIdA)
    if (address0 instanceof Error) throw address0

    const walletId = await getDefaultWalletIdByRole("funder")

    const addressDealer = await Wallets.createOnChainAddress(walletId)
    if (addressDealer instanceof Error) throw addressDealer

    const initialBalanceUserA = await getBTCBalance(walletIdA)
    const initBalanceDealer = await getBTCBalance(walletId)

    const output0 = {}
    output0[address0] = 1

    const output1 = {}
    output1[addressDealer] = 2

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
      const balanceA = await getBTCBalance(walletIdA)
      const balance4 = await getBTCBalance(walletId)

      const depositFeeRatio = getFeeRates().depositFeeVariable as DepositFeeRatio

      expect(balanceA).toBe(
        initialBalanceUserA +
          amountAfterFeeDeduction({
            amount: toSats(100_000_000),
            depositFeeRatio,
          }),
      )
      expect(balance4).toBe(
        initBalanceDealer +
          amountAfterFeeDeduction({
            amount: toSats(200_000_000),
            depositFeeRatio,
          }),
      )
    }
  })

  it("identifies unconfirmed incoming on-chain transactions", async () => {
    const amountSats = getRandomAmountOfSats()

    const address = await Wallets.createOnChainAddress(walletIdA)
    if (address instanceof Error) throw address

    const sub = subscribeToTransactions({ lnd: lndonchain })
    sub.on("chain_transaction", onchainTransactionEventHandler)

    await Promise.all([
      once(sub, "chain_transaction"),
      bitcoindOutside.sendToAddress({
        address,
        amount: sat2btc(amountSats),
      }),
    ])

    await sleep(1000)

    const { result: txs, error } = await Wallets.getTransactionsForWalletId({
      walletId: walletIdA,
    })
    if (error instanceof Error || txs === null) {
      throw error
    }
    const pendingTxs = txs.filter(({ status }) => status === TxStatus.Pending)
    expect(pendingTxs.length).toBe(1)

    const pendingTx = pendingTxs[0] as WalletOnChainTransaction
    expect(pendingTx.settlementVia.type).toBe("onchain")
    expect(pendingTx.settlementAmount).toBe(amountSats)
    expect(pendingTx.initiationVia.address).toBe(address)

    await sleep(1000)

    expect(sendNotification.mock.calls.length).toBe(1)
    expect(sendNotification.mock.calls[0][0].data.type).toBe(
      NotificationType.OnchainReceiptPending,
    )

    const satsPrice = await Prices.getCurrentPrice()
    if (satsPrice instanceof Error) throw satsPrice
    const usd = (amountSats * satsPrice).toFixed(2)

    expect(sendNotification.mock.calls[0][0].title).toBe(
      getTitle[NotificationType.OnchainReceiptPending]({
        usd,
        amount: amountSats,
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
    //   `Your wallet has been credited with ${btc2sat(amountSats)} sats`)
  })

  it("allows fee exemption for specific users", async () => {
    const amountSats = getRandomAmountOfSats()

    const userRecordC = await getUserRecordByTestUserRef("C")
    userRecordC.depositFeeRatio = 0
    await userRecordC.save()
    const walletC = await getDefaultWalletIdByTestUserRef("C")

    const initBalanceUserC = await getBTCBalance(walletC)
    await sendToWalletTestWrapper({
      walletId: walletC,
      depositFeeRatio: 0 as DepositFeeRatio,
      amountSats,
    })
    const finalBalanceUserC = await getBTCBalance(walletC)
    expect(finalBalanceUserC).toBe(initBalanceUserC + amountSats)
  })
})

async function sendToWalletTestWrapper({
  amountSats,
  walletId,
  depositFeeRatio = getFeeRates().depositFeeVariable as DepositFeeRatio,
}: {
  amountSats: Satoshis
  walletId: WalletId
  depositFeeRatio?: DepositFeeRatio
}) {
  const lnd = lndonchain

  const initialBalance = await getBTCBalance(walletId)
  const { result: initTransactions, error } = await Wallets.getTransactionsForWalletId({
    walletId,
  })
  if (error instanceof Error || initTransactions === null) {
    throw error
  }

  const address = await Wallets.createOnChainAddress(walletId)
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

    const balance = await getBTCBalance(walletId)
    expect(balance).toBe(
      initialBalance +
        amountAfterFeeDeduction({
          amount: amountSats,
          depositFeeRatio,
        }),
    )

    const { result: transactions, error } = await Wallets.getTransactionsForWalletId({
      walletId,
    })
    if (error instanceof Error || transactions === null) {
      throw error
    }

    expect(transactions.length).toBe(initTransactions.length + 1)

    const txn = transactions[0] as WalletOnChainTransaction
    expect(txn.settlementVia.type).toBe("onchain")
    expect(txn.settlementFee).toBe(Math.round(txn.settlementFee))
    expect(txn.settlementAmount).toBe(
      amountAfterFeeDeduction({
        amount: amountSats,
        depositFeeRatio: depositFeeRatio,
      }),
    )
    expect(txn.initiationVia.address).toBe(address)
  }

  // just to improve performance
  const blockNumber = await bitcoindClient.getBlockCount()
  await sendToAddressAndConfirm({
    walletClient: bitcoindOutside,
    address,
    amount: sat2btc(amountSats),
  })
  await checkBalance(blockNumber)
}

const getRandomAmountOfSats = () =>
  toSats(+100_000_000 + Math.floor(Math.random() * 10 ** 6))
