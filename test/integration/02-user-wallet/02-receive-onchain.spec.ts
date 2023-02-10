/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "sendToWalletTestWrapper"] }] */
import { once } from "events"

import { Accounts, Prices, Wallets } from "@app"
import { usdFromBtcMidPriceFn } from "@app/prices"

import {
  getAccountLimits,
  getFeesConfig,
  getLocale,
  getOnChainAddressCreateAttemptLimits,
} from "@config"

import { sat2btc, toSats } from "@domain/bitcoin"
import { DisplayCurrency, toCents } from "@domain/fiat"
import { LedgerTransactionType } from "@domain/ledger"
import { NotificationType } from "@domain/notifications"
import { PriceRatio } from "@domain/payments"
import { OnChainAddressCreateRateLimiterExceededError } from "@domain/rate-limit/errors"
import { AmountCalculator, paymentAmountFromNumber, WalletCurrency } from "@domain/shared"
import { DepositFeeCalculator, TxStatus } from "@domain/wallets"

import { onchainTransactionEventHandler } from "@servers/trigger"

import { LedgerService } from "@services/ledger"
import { getFunderWalletId } from "@services/ledger/caching"
import { baseLogger } from "@services/logger"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { createPushNotificationContent } from "@services/notifications/create-push-notification-content"
import * as PushNotificationsServiceImpl from "@services/notifications/push-notifications"
import { elapsedSinceTimestamp, ModifiedSet, sleep } from "@utils"

import {
  amountAfterFeeDeduction,
  bitcoindClient,
  bitcoindOutside,
  checkIsBalanced,
  confirmSent,
  createMandatoryUsers,
  createUserAndWalletFromUserRef,
  getAccountIdByTestUserRef,
  getAccountRecordByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  lndonchain,
  RANDOM_ADDRESS,
  sendToAddress,
  sendToAddressAndConfirm,
  subscribeToChainAddress,
  subscribeToTransactions,
  waitUntilBlockHeight,
} from "test/helpers"
import { resetOnChainAddressAccountIdLimits } from "test/helpers/rate-limit"
import { getBalanceHelper, getTransactionsForWalletId } from "test/helpers/wallet"

let walletIdA: WalletId
let walletIdB: WalletId
let accountIdA: AccountId

const calc = AmountCalculator()

const accountLimits = getAccountLimits({ level: 1 })

const locale = getLocale()

beforeAll(async () => {
  await createMandatoryUsers()

  await bitcoindClient.loadWallet({ filename: "outside" })

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  walletIdB = await getDefaultWalletIdByTestUserRef("B")
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
    const address = await Wallets.createOnChainAddressForBtcWallet(walletIdA)
    const lastAddress = await Wallets.getLastOnChainAddressForBtcWallet(walletIdA)

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
      const onChainAddressPromise = Wallets.createOnChainAddressForBtcWallet(walletIdA)
      promises.push(onChainAddressPromise)
    }
    const onChainAddresses = await Promise.all(promises)
    const isNotError = (item) => !(item instanceof Error)
    expect(onChainAddresses.every(isNotError)).toBe(true)

    // Test that first address past the limit fails
    const onChainAddress = await Wallets.createOnChainAddressForBtcWallet(walletIdA)
    expect(onChainAddress).toBeInstanceOf(OnChainAddressCreateRateLimiterExceededError)

    // Reset limits when done for other tests
    resetOk = await resetOnChainAddressAccountIdLimits(accountIdA)
    expect(resetOk).not.toBeInstanceOf(Error)
  })

  it("receives on-chain transaction", async () => {
    const sendNotification = jest.fn()
    jest
      .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
      .mockImplementationOnce(() => ({
        sendNotification,
      }))

    const amountSats = getRandomAmountOfSats()
    const receivedBtc = { amount: BigInt(amountSats), currency: WalletCurrency.Btc }

    // Execute receive
    await sendToWalletTestWrapper({
      walletId: walletIdA,
      amountSats,
    })

    // Calculate receive display amount
    const account = await AccountsRepository().findById(accountIdA)
    if (account instanceof Error) throw account

    const receivedUsd = await usdFromBtcMidPriceFn({
      amount: BigInt(amountSats),
      currency: WalletCurrency.Btc,
    })
    if (receivedUsd instanceof Error) return receivedUsd

    const fee = DepositFeeCalculator().onChainDepositFee({
      amount: amountSats,
      ratio: account.depositFeeRatio,
    })
    const satsFee = paymentAmountFromNumber({
      amount: fee,
      currency: WalletCurrency.Btc,
    })
    if (satsFee instanceof Error) throw satsFee

    const priceRatio = PriceRatio({ usd: receivedUsd, btc: receivedBtc })
    if (priceRatio instanceof Error) return priceRatio

    const bankFee = {
      usdBankFee: priceRatio.convertFromBtcToCeil(satsFee),
      btcBankFee: satsFee,
    }

    const usdToCreditReceiver = calc.sub(receivedUsd, bankFee.usdBankFee)

    const displayAmount = {
      amount: Number((Number(usdToCreditReceiver.amount) / 100).toFixed(2)),
      currency: DisplayCurrency.Usd,
    }

    // Check received notification
    const receivedNotification = createPushNotificationContent({
      type: NotificationType.OnchainReceipt,
      userLanguage: locale,
      amount: receivedBtc,
      displayAmount,
    })

    expect(sendNotification.mock.calls.length).toBe(1)
    expect(sendNotification.mock.calls[0][0].title).toBe(receivedNotification.title)
    expect(sendNotification.mock.calls[0][0].body).toBe(receivedNotification.body)
  })

  it("retrieves on-chain transactions by address", async () => {
    const address1 = await Wallets.createOnChainAddressForBtcWallet(walletIdA)
    if (address1 instanceof Error) throw address1
    expect(address1.substr(0, 4)).toBe("bcrt")
    await testTxnsByAddressWrapper({
      walletId: walletIdA,
      addresses: [address1],
      amountSats: getRandomAmountOfSats(),
    })

    const address2 = await Wallets.createOnChainAddressForBtcWallet(walletIdA)
    if (address2 instanceof Error) throw address2
    expect(address2.substr(0, 4)).toBe("bcrt")
    await testTxnsByAddressWrapper({
      walletId: walletIdA,
      addresses: [address2],
      amountSats: getRandomAmountOfSats(),
    })

    await testTxnsByAddressWrapper({
      walletId: walletIdA,
      addresses: [address1, address2],
      amountSats: getRandomAmountOfSats(),
    })

    const walletA = await WalletsRepository().findById(walletIdA)
    if (walletA instanceof Error) throw walletA
    const walletB = await WalletsRepository().findById(walletIdB)
    if (walletB instanceof Error) throw walletB

    // Confirm that another wallet can't retrieve transactions for a wallet
    const txnsForARequestedFromA = await Wallets.getTransactionsForWalletsByAddresses({
      wallets: [walletA],
      addresses: [address1, address2],
    })
    const { result: txnsA } = txnsForARequestedFromA
    expect(txnsA).not.toBeNull()
    if (!txnsA) throw new Error()
    expect(txnsA.slice.length).toBeGreaterThan(0)

    const txnsForARequestedFromB = await Wallets.getTransactionsForWalletsByAddresses({
      wallets: [walletB],
      addresses: [address1, address2],
    })
    const { result: txnsB } = txnsForARequestedFromB
    expect(txnsB).not.toBeNull()
    if (!txnsB) throw new Error()
    expect(txnsB.slice.length).toEqual(0)
  })

  it("receives on-chain transaction with max limit for withdrawal level1", async () => {
    /// TODO? add sendAll tests in which the user has more than the limit?
    const withdrawalLimitAccountLevel1 = accountLimits.withdrawalLimit // cents
    await createUserAndWalletFromUserRef("E")
    const walletIdE = await getDefaultWalletIdByTestUserRef("E")
    await createUserAndWalletFromUserRef("G")
    const walletIdG = await getDefaultWalletIdByTestUserRef("G")

    const displayPriceRatio = await Prices.getCurrentPriceAsPriceRatio({
      currency: DisplayCurrency.Usd,
    })
    if (displayPriceRatio instanceof Error) throw displayPriceRatio
    const satsAmount = displayPriceRatio.convertFromUsd({
      amount: BigInt(withdrawalLimitAccountLevel1),
      currency: WalletCurrency.Usd,
    })

    await sendToWalletTestWrapper({
      walletId: walletIdE,
      amountSats: toSats(satsAmount.amount),
    })
    await sendToWalletTestWrapper({
      walletId: walletIdG,
      amountSats: toSats(satsAmount.amount),
    })
  })

  it("receives on-chain transaction with max limit for onUs level1", async () => {
    const intraLedgerLimitAccountLevel1 = accountLimits.intraLedgerLimit // cents

    await createUserAndWalletFromUserRef("F")
    const walletId = await getDefaultWalletIdByTestUserRef("F")

    const displayPriceRatio = await Prices.getCurrentPriceAsPriceRatio({
      currency: DisplayCurrency.Usd,
    })
    if (displayPriceRatio instanceof Error) throw displayPriceRatio
    const satsAmount = displayPriceRatio.convertFromUsd({
      amount: BigInt(intraLedgerLimitAccountLevel1),
      currency: WalletCurrency.Usd,
    })

    await sendToWalletTestWrapper({ walletId, amountSats: toSats(satsAmount.amount) })
  })

  it("receives batch on-chain transaction", async () => {
    const address0 = await Wallets.createOnChainAddressForBtcWallet(walletIdA)
    if (address0 instanceof Error) throw address0

    const walletId = await getFunderWalletId()

    const addressDealer = await Wallets.createOnChainAddressForBtcWallet(walletId)
    if (addressDealer instanceof Error) throw addressDealer

    const initialBalanceUserA = await getBalanceHelper(walletIdA)
    const initBalanceDealer = await getBalanceHelper(walletId)

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
      const balanceA = await getBalanceHelper(walletIdA)
      const balance4 = await getBalanceHelper(walletId)

      const depositFeeRatio = getFeesConfig().depositFeeVariable as DepositFeeRatio

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
    const sendNotification = jest.fn()
    jest
      .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
      .mockImplementationOnce(() => ({
        sendNotification,
      }))

    const amountSats = getRandomAmountOfSats()

    const address = await Wallets.createOnChainAddressForBtcWallet(walletIdA)
    if (address instanceof Error) throw address

    const account = await Accounts.getAccount(accountIdA)
    if (account instanceof Error) throw account

    const feeSats = DepositFeeCalculator().onChainDepositFee({
      amount: amountSats,
      ratio: account.depositFeeRatio,
    })

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

    // Check pendingTx from chain
    const { result: txs, error } = await getTransactionsForWalletId(walletIdA)
    if (error instanceof Error || txs === null) {
      throw error
    }
    const pendingTxs = txs.slice.filter(({ status }) => status === TxStatus.Pending)
    expect(pendingTxs.length).toBe(1)

    const pendingTx = pendingTxs[0] as WalletOnChainTransaction
    expect(pendingTx.settlementVia.type).toBe("onchain")
    expect(pendingTx.settlementAmount).toBe(amountSats - feeSats)
    expect(pendingTx.settlementFee).toBe(feeSats)
    expect(pendingTx.initiationVia.address).toBe(address)
    expect(pendingTx.createdAt).toBeInstanceOf(Date)

    // Check pendingTx from cache
    const { result: txsFromCache, error: errorFromCache } =
      await getTransactionsForWalletId(walletIdA)
    if (errorFromCache instanceof Error || txsFromCache === null) {
      throw errorFromCache
    }
    const pendingTxsFromCache = txsFromCache.slice.filter(
      ({ status }) => status === TxStatus.Pending,
    )
    expect(pendingTxsFromCache[0]?.createdAt).toBeInstanceOf(Date)

    await sleep(1000)

    const satsPrice = await Prices.getCurrentSatPrice({ currency: DisplayCurrency.Usd })
    if (satsPrice instanceof Error) throw satsPrice

    const paymentAmount = {
      amount: BigInt(pendingTx.settlementAmount),
      currency: WalletCurrency.Btc,
    }
    const displayPaymentAmount = {
      amount: pendingTx.settlementAmount * satsPrice.price,
      currency: satsPrice.currency,
    }

    const pendingNotification = createPushNotificationContent({
      type: NotificationType.OnchainReceiptPending,
      userLanguage: locale,
      amount: paymentAmount,
      displayAmount: displayPaymentAmount,
    })

    expect(sendNotification.mock.calls.length).toBe(1)
    expect(sendNotification.mock.calls[0][0].title).toBe(pendingNotification.title)
    expect(sendNotification.mock.calls[0][0].body).toBe(pendingNotification.body)

    await Promise.all([
      once(sub, "chain_transaction"),
      bitcoindOutside.generateToAddress({ nblocks: 3, address: RANDOM_ADDRESS }),
    ])

    await sleep(3000)
    sub.removeAllListeners()
  })

  it("allows fee exemption for specific users", async () => {
    const amountSats = getRandomAmountOfSats()

    const accountRecordC = await getAccountRecordByTestUserRef("C")
    accountRecordC.depositFeeRatio = 0
    await accountRecordC.save()
    const walletC = await getDefaultWalletIdByTestUserRef("C")

    const initBalanceUserC = await getBalanceHelper(walletC)
    await sendToWalletTestWrapper({
      walletId: walletC,
      depositFeeRatio: 0 as DepositFeeRatio,
      amountSats,
    })
    const finalBalanceUserC = await getBalanceHelper(walletC)
    expect(finalBalanceUserC).toBe(initBalanceUserC + amountSats)
  })
})

async function sendToWalletTestWrapper({
  amountSats,
  walletId,
  depositFeeRatio = getFeesConfig().depositFeeVariable as DepositFeeRatio,
}: {
  amountSats: Satoshis
  walletId: WalletId
  depositFeeRatio?: DepositFeeRatio
}) {
  const lnd = lndonchain

  const initialBalance = await getBalanceHelper(walletId)
  const { result: initTransactions, error } = await getTransactionsForWalletId(walletId)
  if (error instanceof Error || initTransactions === null) {
    throw error
  }

  const address = await Wallets.createOnChainAddressForBtcWallet(walletId)
  if (address instanceof Error) throw address

  expect(address.substring(0, 4)).toBe("bcrt")

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

    const balance = await getBalanceHelper(walletId)

    expect(balance).toBe(
      initialBalance +
        amountAfterFeeDeduction({
          amount: amountSats,
          depositFeeRatio,
        }),
    )

    const { result: transactions, error } = await getTransactionsForWalletId(walletId)
    if (error instanceof Error || transactions === null) {
      throw error
    }

    expect(transactions.slice.length).toBe(initTransactions.slice.length + 1)

    const txn = transactions.slice[0] as WalletOnChainTransaction
    expect(txn.settlementVia.type).toBe("onchain")
    expect(txn.settlementFee).toBe(Math.round(txn.settlementFee))
    expect(txn.settlementAmount).toBe(
      amountAfterFeeDeduction({
        amount: amountSats,
        depositFeeRatio: depositFeeRatio,
      }),
    )
    expect(txn.initiationVia.address).toBe(address)

    return txn
  }

  // just to improve performance
  const blockNumber = await bitcoindClient.getBlockCount()
  await sendToAddressAndConfirm({
    walletClient: bitcoindOutside,
    address,
    amount: sat2btc(amountSats),
  })
  const txn = await checkBalance(blockNumber)

  // Check ledger transaction metadata for BTC 'LedgerTransactionType.OnchainReceipt'
  // ===
  const ledgerTxs = await LedgerService().getTransactionsByHash(
    (txn.settlementVia as SettlementViaOnChain).transactionHash,
  )
  if (ledgerTxs instanceof Error) throw ledgerTxs
  const ledgerTx = ledgerTxs.find((tx) => tx.walletId === walletId)
  expect(ledgerTx).not.toBeUndefined()

  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) throw wallet
  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) throw account

  const fee = DepositFeeCalculator().onChainDepositFee({
    amount: amountSats,
    ratio: account.depositFeeRatio,
  })

  const usdPaymentAmount = await usdFromBtcMidPriceFn({
    amount: BigInt(amountSats),
    currency: WalletCurrency.Btc,
  })
  if (usdPaymentAmount instanceof Error) throw usdPaymentAmount
  const centsAmount = Number(usdPaymentAmount.amount)

  const priceRatio = PriceRatio({
    usd: usdPaymentAmount,
    btc: { amount: BigInt(amountSats), currency: WalletCurrency.Btc },
  })
  if (priceRatio instanceof Error) throw priceRatio

  const feeAmountCents = priceRatio.convertFromBtcToCeil({
    amount: BigInt(fee),
    currency: WalletCurrency.Btc,
  })
  const centsFee = toCents(feeAmountCents.amount)

  const expectedFields = {
    type: LedgerTransactionType.OnchainReceipt,

    debit: 0,
    credit: amountSats - fee,

    satsAmount: amountSats - fee,
    satsFee: fee,
    centsAmount: centsAmount - centsFee,
    centsFee,
    displayAmount: centsAmount - centsFee,
    displayFee: centsFee,

    displayCurrency: DisplayCurrency.Usd,
  }
  expect(ledgerTx).toEqual(expect.objectContaining(expectedFields))
}

async function testTxnsByAddressWrapper({
  amountSats,
  walletId,
  addresses,
  depositFeeRatio = getFeesConfig().depositFeeVariable as DepositFeeRatio,
}: {
  amountSats: Satoshis
  walletId: WalletId
  addresses: OnChainAddress[]
  depositFeeRatio?: DepositFeeRatio
}) {
  const lnd = lndonchain

  const currentBalance = await getBalanceHelper(walletId)
  const { result: initTransactions, error } = await getTransactionsForWalletId(walletId)
  if (error instanceof Error || initTransactions === null) {
    throw error
  }

  const checkBalance = async (addresses, minBlockToWatch = 1) => {
    for (const address of addresses) {
      const sub = subscribeToChainAddress({
        lnd,
        bech32_address: address,
        min_height: minBlockToWatch,
      })
      await once(sub, "confirmation")
      sub.removeAllListeners()
    }

    await waitUntilBlockHeight({ lnd })
    // this is done by trigger and/or cron in prod
    const result = await Wallets.updateOnChainReceipt({ logger: baseLogger })
    if (result instanceof Error) {
      throw result
    }

    const balance = await getBalanceHelper(walletId)
    expect(balance).toBe(
      currentBalance +
        amountAfterFeeDeduction({
          amount: amountSats,
          depositFeeRatio,
        }) *
          addresses.length,
    )

    const { result: transactions, error } = await getTransactionsForWalletId(walletId)
    if (error instanceof Error || transactions === null) {
      throw error
    }

    expect(transactions.slice.length).toBe(
      initTransactions.slice.length + addresses.length,
    )

    const txn = transactions.slice[0] as WalletOnChainTransaction
    expect(txn.settlementVia.type).toBe("onchain")
    expect(txn.settlementFee).toBe(Math.round(txn.settlementFee))
    expect(txn.settlementAmount).toBe(
      amountAfterFeeDeduction({
        amount: amountSats,
        depositFeeRatio: depositFeeRatio,
      }),
    )
    expect(addresses.includes(txn.initiationVia.address)).toBeTruthy()
  }

  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet

  // Send payments to addresses
  const subTransactions = subscribeToTransactions({ lnd })
  const addressesForReceivedTxns = [] as OnChainAddress[]
  const onChainTxHandler = (tx) => {
    for (const address of tx.output_addresses) {
      if (addresses.includes(address)) {
        addressesForReceivedTxns.push(address)
      }
    }
    return onchainTransactionEventHandler(tx)
  }
  subTransactions.on("chain_transaction", onChainTxHandler)
  // just to improve performance
  const blockNumber = await bitcoindClient.getBlockCount()
  for (const address of addresses) {
    await sendToAddress({
      walletClient: bitcoindOutside,
      address,
      amount: sat2btc(amountSats),
    })
  }

  // Wait for subscription events
  const TIME_TO_WAIT = 1000
  const checkReceived = async () => {
    const start = new Date(Date.now())
    while (addressesForReceivedTxns.length != addresses.length) {
      const elapsed = elapsedSinceTimestamp(start) * 1000
      if (elapsed > TIME_TO_WAIT) return new Error("Timed out")
      await sleep(100)
    }
    return true
  }
  const waitForTxns = await checkReceived()
  expect(waitForTxns).not.toBeInstanceOf(Error)

  // Expected pending transactions have been received
  subTransactions.removeAllListeners()

  // Fetch txns with pending
  const txnsWithPendingResult = await Wallets.getTransactionsForWalletsByAddresses({
    wallets: [wallet],
    addresses: addresses,
  })
  const txnsWithPending = txnsWithPendingResult?.result?.slice
  expect(txnsWithPending).not.toBeNull()
  if (txnsWithPending === undefined) throw new Error()
  const pendingTxn = txnsWithPending[0]
  expect(pendingTxn.initiationVia.type).toEqual("onchain")
  if (
    pendingTxn.initiationVia.type !== "onchain" ||
    pendingTxn.settlementVia.type !== "onchain"
  ) {
    throw new Error()
  }

  // Test pending txn
  expect(pendingTxn.status).toEqual(TxStatus.Pending)
  expect(pendingTxn.initiationVia.address).not.toBeUndefined()
  if (!pendingTxn.initiationVia.address) throw new Error()
  expect(addresses.includes(pendingTxn.initiationVia.address)).toBeTruthy()

  // Test all txns
  const txnAddressesWithPendingSet = new ModifiedSet(
    txnsWithPending.map((txn) => {
      if (txn.initiationVia.type !== "onchain" || !txn.initiationVia.address) {
        return new Error()
      }
      return txn.initiationVia.address
    }),
  )
  expect(txnAddressesWithPendingSet.size).toEqual(addresses.length)
  const commonAddressPendingSet = txnAddressesWithPendingSet.intersect(new Set(addresses))
  expect(commonAddressPendingSet.size).toEqual(addresses.length)

  // Test pending onchain transactions balance use-case
  const pendingBalances = await Wallets.getPendingOnChainBalanceForWallets([wallet])
  if (pendingBalances instanceof Error) throw pendingBalances
  const expectedPendingBalance = amountSats * addresses.length
  expect(Number(pendingBalances[walletId].amount)).toEqual(expectedPendingBalance)

  // Confirm pending onchain transactions
  await confirmSent({
    walletClient: bitcoindOutside,
  })
  await checkBalance(addresses, blockNumber)

  // Fetch txns with confirmed
  const txnsWithConfirmedResult = await Wallets.getTransactionsForWalletsByAddresses({
    wallets: [wallet],
    addresses,
  })
  const txnsWithConfirmed = txnsWithConfirmedResult.result
  expect(txnsWithConfirmed).not.toBeNull()
  if (txnsWithConfirmed === null) throw new Error()

  // Test confirmed txn
  const confirmedTxn = txnsWithConfirmed.slice.find(
    (txn) =>
      (txn.settlementVia as SettlementViaOnChain).transactionHash ===
      (pendingTxn.settlementVia as SettlementViaOnChain).transactionHash,
  )
  expect(confirmedTxn).not.toBeUndefined()
  if (confirmedTxn === undefined) throw new Error()
  expect(confirmedTxn.status).toEqual(TxStatus.Success)

  // Test all txns
  const txnAddressesWithConfirmedSet = new ModifiedSet(
    txnsWithConfirmed.slice.map((txn) => {
      if (txn.initiationVia.type !== "onchain" || !txn.initiationVia.address) {
        return new Error()
      }
      return txn.initiationVia.address
    }),
  )
  expect(txnAddressesWithConfirmedSet.size).toEqual(addresses.length)
  const commonAddressSet = txnAddressesWithConfirmedSet.intersect(new Set(addresses))
  expect(commonAddressSet.size).toEqual(addresses.length)
}

const getRandomAmountOfSats = () =>
  toSats(+100_000_000 + Math.floor(Math.random() * 10 ** 6))
