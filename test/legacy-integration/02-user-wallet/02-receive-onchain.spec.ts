/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "sendToWalletTestWrapper"] }] */

import { once } from "events"

import { Accounts, Prices, Wallets } from "@app"
import { getCurrentPriceAsDisplayPriceRatio, usdFromBtcMidPriceFn } from "@app/prices"
import { addWallet } from "@app/accounts"

import {
  getAccountLimits,
  getFeesConfig,
  getLocale,
  getOnChainAddressCreateAttemptLimits,
} from "@config"

import { sat2btc, toSats } from "@domain/bitcoin"
import {
  DisplayCurrency,
  getCurrencyMajorExponent,
  displayAmountFromNumber,
  toCents,
} from "@domain/fiat"
import { LedgerTransactionType } from "@domain/ledger"
import { NotificationType } from "@domain/notifications"
import { WalletPriceRatio } from "@domain/payments"
import { OnChainAddressCreateRateLimiterExceededError } from "@domain/rate-limit/errors"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_SATS,
} from "@domain/shared"
import { DepositFeeCalculator, TxStatus } from "@domain/wallets"
import { WalletAddressReceiver } from "@domain/wallet-on-chain/wallet-address-receiver"
import {
  CouldNotFindWalletOnChainPendingReceiveError,
  MultipleCurrenciesForSingleCurrencyOperationError,
} from "@domain/errors"

import { BriaPayloadType } from "@services/bria"
import { LedgerService } from "@services/ledger"
import { getFunderWalletId } from "@services/ledger/caching"
import {
  AccountsRepository,
  WalletOnChainPendingReceiveRepository,
  WalletsRepository,
} from "@services/mongoose"
import { createPushNotificationContent } from "@services/notifications/create-push-notification-content"
import * as PushNotificationsServiceImpl from "@services/notifications/push-notifications"
import { DealerPriceService } from "@services/dealer-price"
import { baseLogger } from "@services/logger"

import {
  utxoDetectedEventHandler,
  utxoSettledEventHandler,
} from "@servers/event-handlers/bria"
import { onchainTransactionEventHandler } from "@servers/trigger"

import { elapsedSinceTimestamp, ModifiedSet, sleep } from "@utils"

import {
  amountAfterFeeDeduction,
  bitcoindClient,
  bitcoindOutside,
  checkIsBalanced,
  clearLimiters,
  createMandatoryUsers,
  createRandomUserAndBtcWallet,
  createUserAndWalletFromPhone,
  getAccountIdByPhone,
  getBalanceHelper,
  getDefaultWalletIdByPhone,
  getTransactionsForWalletId,
  getUsdWalletIdByPhone,
  lndonchain,
  manyBriaSubscribe,
  mineBlockAndSyncAll,
  onceBriaSubscribe,
  RANDOM_ADDRESS,
  randomPhone,
  resetOnChainAddressAccountIdLimits,
  sendToAddress,
  sendToAddressAndConfirm,
  subscribeToChainAddress,
  subscribeToTransactions,
  waitUntilBlockHeight,
  waitUntilSyncAll,
  lndCreateOnChainAddress,
  waitFor,
} from "test/helpers"

let walletIdA: WalletId
let walletIdUsdA: WalletId
let walletIdB: WalletId
let accountIdA: AccountId

let newAccountIdA: AccountId
let newWalletIdA: WalletId

const accountLimits = getAccountLimits({ level: 1 })
const feesConfig = getFeesConfig()

const locale = getLocale()

const calc = AmountCalculator()

const phoneA = randomPhone()
const phoneB = randomPhone()
const phoneC = randomPhone()
const phoneE = randomPhone()
const phoneF = randomPhone()
const phoneG = randomPhone()

beforeAll(async () => {
  await createMandatoryUsers()

  await bitcoindClient.loadWallet({ filename: "outside" })

  await createUserAndWalletFromPhone(phoneA)
  await createUserAndWalletFromPhone(phoneB)
  await createUserAndWalletFromPhone(phoneC)

  walletIdA = await getDefaultWalletIdByPhone(phoneA)
  walletIdUsdA = await getUsdWalletIdByPhone(phoneA)
  walletIdB = await getDefaultWalletIdByPhone(phoneB)
  accountIdA = await getAccountIdByPhone(phoneA)
  ;({ accountId: newAccountIdA, id: newWalletIdA } = await createRandomUserAndBtcWallet())
})

beforeEach(async () => {
  jest.resetAllMocks()

  await clearLimiters()

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

describe("With Bria", () => {
  const sendToWalletTestWrapper = async ({
    amountSats,
    walletId,
    minBankFee = feesConfig.depositDefaultMin,
    minBankFeeThreshold = feesConfig.depositThreshold,
    depositFeeRatio = feesConfig.depositRatioAsBasisPoints,
  }: {
    amountSats: BtcPaymentAmount
    walletId: WalletId
    minBankFee?: BtcPaymentAmount
    minBankFeeThreshold?: BtcPaymentAmount
    depositFeeRatio?: DepositFeeRatioAsBasisPoints
  }): Promise<OnChainTxHash> => {
    const initialBalance = await getBalanceHelper(walletId)
    const { result: initTransactions, error } = await getTransactionsForWalletId(walletId)
    if (error instanceof Error || initTransactions === null) {
      throw error
    }

    // Get address and send txn
    // ===
    const address = await Wallets.createOnChainAddress({ walletId })
    if (address instanceof Error) throw address

    expect(address.substring(0, 4)).toBe("bcrt")

    const txId = await sendToAddressAndConfirm({
      walletClient: bitcoindOutside,
      address,
      amount: sat2btc(Number(amountSats.amount)),
    })
    if (txId instanceof Error) throw txId

    // Receive transaction with bria trigger methods
    // ===
    const detectedEvent = await onceBriaSubscribe({
      type: BriaPayloadType.UtxoDetected,
      txId,
    })
    if (detectedEvent?.payload.type !== BriaPayloadType.UtxoDetected) {
      throw new Error(`Expected ${BriaPayloadType.UtxoDetected} event`)
    }

    const resultPending = await utxoDetectedEventHandler({ event: detectedEvent.payload })
    if (resultPending instanceof Error) {
      throw resultPending
    }

    const settledEvent = await onceBriaSubscribe({
      type: BriaPayloadType.UtxoSettled,
      txId,
    })
    if (settledEvent?.payload.type !== BriaPayloadType.UtxoSettled) {
      throw new Error(`Expected ${BriaPayloadType.UtxoSettled} event`)
    }
    const resultSettled = await utxoSettledEventHandler({ event: settledEvent.payload })
    if (resultSettled instanceof Error) {
      throw resultSettled
    }

    // Start checks
    // ===
    const balance = await getBalanceHelper(walletId)

    expect(balance).toBe(
      initialBalance +
        amountAfterFeeDeduction({
          amount: amountSats,
          minBankFee,
          minBankFeeThreshold,
          depositFeeRatio,
        }),
    )

    const { result: transactions, error: txnsError } =
      await getTransactionsForWalletId(walletId)
    if (txnsError instanceof Error || transactions === null) {
      throw txnsError
    }

    expect(transactions.slice.length).toBe(initTransactions.slice.length + 1)

    const txn = transactions.slice[0] as WalletOnChainTransaction
    expect(txn.settlementVia.type).toBe("onchain")
    expect(txn.settlementFee).toBe(Math.round(txn.settlementFee))
    expect(txn.settlementAmount).toBe(
      amountAfterFeeDeduction({
        amount: amountSats,
        minBankFee,
        minBankFeeThreshold,
        depositFeeRatio: depositFeeRatio,
      }),
    )
    expect(txn.initiationVia.address).toBe(address)

    // Check ledger transaction metadata for BTC 'LedgerTransactionType.OnchainReceipt'
    // ===
    const ledgerTxs = await LedgerService().getTransactionsByHash(
      (txn.settlementVia as SettlementViaOnChainIncoming).transactionHash,
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
      minBankFee: feesConfig.depositDefaultMin,
      minBankFeeThreshold: feesConfig.depositThreshold,
      ratio: feesConfig.depositRatioAsBasisPoints,
    })
    if (fee instanceof Error) throw fee

    const usdPaymentAmount = await usdFromBtcMidPriceFn(amountSats)
    if (usdPaymentAmount instanceof Error) throw usdPaymentAmount
    const centsAmount = Number(usdPaymentAmount.amount)

    const priceRatio = WalletPriceRatio({
      usd: usdPaymentAmount,
      btc: amountSats,
    })
    if (priceRatio instanceof Error) throw priceRatio

    const feeAmountCents = priceRatio.convertFromBtcToCeil(fee)
    const centsFee = toCents(feeAmountCents.amount)

    const expectedFields = {
      type: LedgerTransactionType.OnchainReceipt,

      debit: 0,
      credit: Number(calc.sub(amountSats, fee).amount),

      satsAmount: Number(calc.sub(amountSats, fee).amount),
      satsFee: Number(fee.amount),
      centsAmount: centsAmount - centsFee,
      centsFee,
      displayAmount: centsAmount - centsFee,
      displayFee: centsFee,

      displayCurrency: DisplayCurrency.Usd,
    }
    expect(ledgerTx).toEqual(expect.objectContaining(expectedFields))

    return txId
  }

  async function testTxnsByAddressWrapper({
    amountSats,
    walletId,
    addresses,
    minBankFee = feesConfig.depositDefaultMin,
    minBankFeeThreshold = feesConfig.depositThreshold,
    depositFeeRatio = feesConfig.depositRatioAsBasisPoints,
  }: {
    amountSats: Satoshis
    walletId: WalletId
    addresses: OnChainAddress[]
    minBankFee?: BtcPaymentAmount
    minBankFeeThreshold?: BtcPaymentAmount
    depositFeeRatio?: DepositFeeRatioAsBasisPoints
  }) {
    // Step 1: get initial balance and transactions list
    const initialBalance = await getBalanceHelper(walletId)
    const { result: initTransactions, error } = await getTransactionsForWalletId(walletId)
    if (error instanceof Error || initTransactions === null) {
      throw error
    }

    // Step 2. send transactions
    for (const address of addresses) {
      await sendToAddress({
        walletClient: bitcoindOutside,
        address,
        amount: sat2btc(amountSats),
      })
    }

    // Step 3. collect events and execute detected handler
    const detectedEvents = await manyBriaSubscribe({
      type: BriaPayloadType.UtxoDetected,
      addresses,
    })
    expect(detectedEvents.length).toEqual(addresses.length)
    for (const detectedEvent of detectedEvents) {
      if (detectedEvent?.payload.type !== BriaPayloadType.UtxoDetected) {
        throw new Error(`Expected ${BriaPayloadType.UtxoDetected} event`)
      }
      // this is done by trigger and/or cron in prod
      const resultPending = await utxoDetectedEventHandler({
        event: detectedEvent.payload,
      })
      if (resultPending instanceof Error) {
        throw resultPending
      }
    }

    // Step 4. check for pending and check balance unchanged
    const pendingTxns =
      await WalletOnChainPendingReceiveRepository().listByWalletIdsAndAddresses({
        walletIds: [walletId],
        addresses,
      })
    if (pendingTxns instanceof Error) throw pendingTxns
    const pendingTxnsForAddresses = pendingTxns.filter((txn) =>
      addresses.includes(txn.initiationVia.address),
    )
    expect(pendingTxnsForAddresses.length).toEqual(addresses.length)

    const balanceAfterPending = await getBalanceHelper(walletId)
    expect(balanceAfterPending).toEqual(initialBalance)

    // Step 5. mine, collect events and execute settled handler
    await bitcoindOutside.generateToAddress({ nblocks: 6, address: RANDOM_ADDRESS })
    const settledEvents = await manyBriaSubscribe({
      type: BriaPayloadType.UtxoSettled,
      addresses,
    })
    expect(settledEvents.length).toEqual(addresses.length)
    for (const settledEvent of settledEvents) {
      if (settledEvent?.payload.type !== BriaPayloadType.UtxoSettled) {
        throw new Error(`Expected ${BriaPayloadType.UtxoSettled} event`)
      }
      // this is done by trigger and/or cron in prod
      const resultSettled = await utxoSettledEventHandler({ event: settledEvent.payload })
      if (resultSettled instanceof Error) {
        throw resultSettled
      }
    }

    // Step 6. check for pending removed, new transactions, updated balance
    const pendingTxnsAfter =
      await WalletOnChainPendingReceiveRepository().listByWalletIdsAndAddresses({
        walletIds: [walletId],
        addresses,
      })
    expect(pendingTxnsAfter).toBeInstanceOf(CouldNotFindWalletOnChainPendingReceiveError)

    const wallet = await WalletsRepository().findById(walletId)
    if (wallet instanceof Error) throw wallet
    const { result: settledTxns } = await Wallets.getTransactionsForWalletsByAddresses({
      wallets: [wallet],
      addresses,
    })
    if (settledTxns === null) throw new Error("'settledTxns' is null")

    const settledTxIds = settledEvents
      .map((tx) => "txId" in tx.payload && tx.payload.txId)
      .filter((txId): txId is OnChainTxHash => txId !== false)

    expect(
      settledTxns.slice
        .filter((txn) =>
          settledTxIds.includes(
            (txn.settlementVia as SettlementViaOnChainIncoming).transactionHash,
          ),
        )
        .map((txn) => (txn.initiationVia as InitiationViaOnChain).address)
        .sort(),
    ).toStrictEqual(addresses.sort())

    const btcAmount = paymentAmountFromNumber({
      amount: amountSats,
      currency: WalletCurrency.Btc,
    })
    if (btcAmount instanceof Error) throw btcAmount
    const balanceAfterSettled = await getBalanceHelper(walletId)
    expect(balanceAfterSettled).toBe(
      initialBalance +
        amountAfterFeeDeduction({
          amount: btcAmount,
          minBankFee,
          minBankFeeThreshold,
          depositFeeRatio,
        }) *
          addresses.length,
    )
  }

  describe("FunderWallet - On chain", () => {
    it("receives on-chain transaction", async () => {
      const funderWalletId = await getFunderWalletId()
      await sendToWalletTestWrapper({
        walletId: funderWalletId,
        amountSats: getRandomBtcAmount(),
      })
    })
  })

  describe("UserWallet - On chain", () => {
    it("get last on chain address", async () => {
      const requestId = ("requestId #" +
        (Math.random() * 1_000_000).toFixed()) as OnChainAddressRequestId

      const address = await Wallets.createOnChainAddress({
        walletId: newWalletIdA,
        requestId,
      })
      const lastAddress = await Wallets.getLastOnChainAddress(newWalletIdA)

      expect(address).not.toBeInstanceOf(Error)
      expect(lastAddress).not.toBeInstanceOf(Error)
      expect(lastAddress).toBe(address)

      const addressAgain = await Wallets.createOnChainAddress({
        walletId: newWalletIdA,
        requestId,
      })
      expect(addressAgain).toBe(address)
    })

    it.skip("fails to create onChain Address past rate limit", async () => {
      // Reset limits before starting
      let resetOk = await resetOnChainAddressAccountIdLimits(newAccountIdA)
      expect(resetOk).not.toBeInstanceOf(Error)
      if (resetOk instanceof Error) throw resetOk

      // Create max number of addresses
      const limitsNum = getOnChainAddressCreateAttemptLimits().points
      const promises: Promise<OnChainAddress | ApplicationError>[] = []
      for (let i = 0; i < limitsNum; i++) {
        const onChainAddressPromise = Wallets.createOnChainAddress({
          walletId: newWalletIdA,
        })
        promises.push(onChainAddressPromise)
      }
      const onChainAddresses = await Promise.all(promises)
      const isNotError = (item) => !(item instanceof Error)
      expect(onChainAddresses.every(isNotError)).toBe(true)

      // Test that first address past the limit fails
      const onChainAddress = await Wallets.createOnChainAddress({
        walletId: newWalletIdA,
      })
      expect(onChainAddress).toBeInstanceOf(OnChainAddressCreateRateLimiterExceededError)

      // Reset limits when done for other tests
      resetOk = await resetOnChainAddressAccountIdLimits(newAccountIdA)
      expect(resetOk).not.toBeInstanceOf(Error)
    })

    it("receives on-chain transaction", async () => {
      const sendNotification = jest.fn()
      jest
        .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
        .mockImplementationOnce(() => ({
          sendNotification,
        }))
        .mockImplementationOnce(() => ({
          sendNotification,
        }))

      const receivedBtc = getRandomBtcAmount()

      // Execute receive
      const txId = await sendToWalletTestWrapper({
        walletId: newWalletIdA,
        amountSats: receivedBtc,
      })

      // Calculate receive display amount
      const account = await AccountsRepository().findById(newAccountIdA)
      if (account instanceof Error) throw account

      const receivedUsd = await usdFromBtcMidPriceFn(receivedBtc)
      if (receivedUsd instanceof Error) return receivedUsd

      const expectedSatsFee = DepositFeeCalculator().onChainDepositFee({
        amount: receivedBtc,
        minBankFee: feesConfig.depositDefaultMin,
        minBankFeeThreshold: feesConfig.depositThreshold,
        ratio: feesConfig.depositRatioAsBasisPoints,
      })
      if (expectedSatsFee instanceof Error) throw expectedSatsFee

      const txns = await LedgerService().getTransactionsByHash(txId)
      if (txns instanceof Error) throw txns
      const { satsFee, displayAmount: displayAmountRaw, displayCurrency } = txns[0]

      expect(Number(expectedSatsFee.amount)).toEqual(satsFee)

      const displayAmountForMajor = displayAmountFromNumber({
        amount: displayAmountRaw || 0,
        currency: displayCurrency || DisplayCurrency.Usd,
      })
      if (displayAmountForMajor instanceof Error) throw displayAmountForMajor

      const displayAmount =
        displayAmountRaw === undefined || displayCurrency === undefined
          ? undefined
          : displayAmountForMajor

      // Check received notifications
      const walletAddressReceiver = await WalletAddressReceiver({
        walletAddress: {
          address: "" as OnChainAddress,
          recipientWalletDescriptor: {
            id: newWalletIdA,
            currency: WalletCurrency.Btc,
            accountId: newAccountIdA,
          },
        },
        receivedBtc,
        satsFee: expectedSatsFee,
        usdFromBtc: DealerPriceService().getCentsFromSatsForImmediateBuy,
        usdFromBtcMidPrice: usdFromBtcMidPriceFn,
      })
      if (walletAddressReceiver instanceof Error) return walletAddressReceiver
      const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
        currency: account.displayCurrency,
      })
      if (displayPriceRatio instanceof Error) return displayPriceRatio
      const settlementDisplayAmount = displayPriceRatio.convertFromWallet(
        walletAddressReceiver.btcToCreditReceiver,
      )

      const pendingNotification = createPushNotificationContent({
        type: NotificationType.OnchainReceiptPending,
        userLanguage: locale,
        amount: walletAddressReceiver.btcToCreditReceiver,
        displayAmount: settlementDisplayAmount,
      })
      const receivedNotification = createPushNotificationContent({
        type: NotificationType.OnchainReceipt,
        userLanguage: locale,
        amount: receivedBtc,
        displayAmount,
      })

      expect(sendNotification.mock.calls.length).toBe(2)
      expect(sendNotification.mock.calls[0][0].title).toBe(pendingNotification.title)
      expect(sendNotification.mock.calls[0][0].body).toBe(pendingNotification.body)
      expect(sendNotification.mock.calls[1][0].title).toBe(receivedNotification.title)
      expect(sendNotification.mock.calls[1][0].body).toBe(receivedNotification.body)
    })

    it("retrieves on-chain transactions by address", async () => {
      const address1 = await Wallets.createOnChainAddress({
        walletId: newWalletIdA,
      })
      if (address1 instanceof Error) throw address1
      expect(address1.substr(0, 4)).toBe("bcrt")
      await testTxnsByAddressWrapper({
        walletId: newWalletIdA,
        addresses: [address1],
        amountSats: getRandomAmountOfSats(),
      })

      const address2 = await Wallets.createOnChainAddress({
        walletId: newWalletIdA,
      })
      if (address2 instanceof Error) throw address2
      expect(address2.substr(0, 4)).toBe("bcrt")
      await testTxnsByAddressWrapper({
        walletId: newWalletIdA,
        addresses: [address2],
        amountSats: getRandomAmountOfSats(),
      })

      await testTxnsByAddressWrapper({
        walletId: newWalletIdA,
        addresses: [address1, address2],
        amountSats: getRandomAmountOfSats(),
      })

      const walletA = await WalletsRepository().findById(newWalletIdA)
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
    }, 60_000)

    it("receives on-chain transaction with max limit for withdrawal level1", async () => {
      /// TODO? add sendAll tests in which the user has more than the limit?
      const withdrawalLimitAccountLevel1 = accountLimits.withdrawalLimit // cents
      const wallet = await addWallet({
        accountId: accountIdA,
        type: "checking",
        currency: WalletCurrency.Btc,
      })
      if (wallet instanceof Error) throw wallet

      const walletPriceRatio = await Prices.getCurrentPriceAsWalletPriceRatio({
        currency: WalletCurrency.Usd,
      })
      if (walletPriceRatio instanceof Error) throw walletPriceRatio
      const satsAmount = walletPriceRatio.convertFromUsd({
        amount: BigInt(withdrawalLimitAccountLevel1),
        currency: WalletCurrency.Usd,
      })

      await sendToWalletTestWrapper({
        walletId: wallet.id,
        amountSats: satsAmount,
      })
    })

    it("receives on-chain transaction with max limit for onUs level1", async () => {
      const intraLedgerLimitAccountLevel1 = accountLimits.intraLedgerLimit // cents
      const wallet = await addWallet({
        accountId: accountIdA,
        type: "checking",
        currency: WalletCurrency.Btc,
      })
      if (wallet instanceof Error) throw wallet

      const walletPriceRatio = await Prices.getCurrentPriceAsWalletPriceRatio({
        currency: WalletCurrency.Usd,
      })
      if (walletPriceRatio instanceof Error) throw walletPriceRatio
      const satsAmount = walletPriceRatio.convertFromUsd({
        amount: BigInt(intraLedgerLimitAccountLevel1),
        currency: WalletCurrency.Usd,
      })

      await sendToWalletTestWrapper({
        walletId: wallet.id,
        amountSats: satsAmount,
      })
    })

    it("receives batch on-chain transaction", async () => {
      const address1UserA = await Wallets.createOnChainAddress({
        walletId: newWalletIdA,
      })
      if (address1UserA instanceof Error) throw address1UserA

      const address2UserA = await Wallets.createOnChainAddress({
        walletId: newWalletIdA,
      })
      if (address2UserA instanceof Error) throw address2UserA

      const funderWalletId = await getFunderWalletId()
      const addressDealer = await Wallets.createOnChainAddress({
        walletId: funderWalletId,
      })
      if (addressDealer instanceof Error) throw addressDealer
      const addresses = [address1UserA, addressDealer, address2UserA]

      const initialBalanceUserA = await getBalanceHelper(newWalletIdA)
      const initBalanceDealer = await getBalanceHelper(funderWalletId)

      const output0 = {}
      output0[address1UserA] = 1

      const output1 = {}
      output1[addressDealer] = 2

      const output2 = {}
      output2[address2UserA] = 2

      const outputs = [output0, output1, output2]

      const { psbt } = await bitcoindOutside.walletCreateFundedPsbt({
        inputs: [],
        outputs,
      })
      // const decodedPsbt1 = await bitcoindOutside.decodePsbt(psbt)
      // const analysePsbt1 = await bitcoindOutside.analyzePsbt(psbt)
      const walletProcessPsbt = await bitcoindOutside.walletProcessPsbt({ psbt })
      // const decodedPsbt2 = await bitcoindOutside.decodePsbt(walletProcessPsbt.psbt)
      // const analysePsbt2 = await bitcoindOutside.analyzePsbt(walletProcessPsbt.psbt)
      const finalizedPsbt = await bitcoindOutside.finalizePsbt({
        psbt: walletProcessPsbt.psbt,
      })

      const txHash = await bitcoindOutside.sendRawTransaction({
        hexstring: finalizedPsbt.hex,
      })

      const detectedEvents = await manyBriaSubscribe({
        type: BriaPayloadType.UtxoDetected,
        addresses,
      })
      expect(detectedEvents.length).toEqual(addresses.length)
      for (const detectedEvent of detectedEvents) {
        if (detectedEvent?.payload.type !== BriaPayloadType.UtxoDetected) {
          throw new Error(`Expected ${BriaPayloadType.UtxoDetected} event`)
        }
        const resultPending = await utxoDetectedEventHandler({
          event: detectedEvent.payload,
        })
        if (resultPending instanceof Error) {
          throw resultPending
        }
      }

      const defaultDepositFeeRatio = feesConfig.depositRatioAsBasisPoints

      // Test 'getPendingOnChainBalanceForWallets' use-case method
      const newWalletA = await WalletsRepository().findById(newWalletIdA)
      if (newWalletA instanceof Error) throw newWalletA
      const pendingBalance = await Wallets.getPendingOnChainBalanceForWallets([
        newWalletA,
      ])
      if (pendingBalance instanceof Error) throw pendingBalance
      expect(Number(pendingBalance[newWalletIdA].amount)).toEqual(
        amountAfterFeeDeduction({
          amount: { amount: 300_000_000n, currency: WalletCurrency.Btc },
          minBankFee: feesConfig.depositDefaultMin,
          minBankFeeThreshold: feesConfig.depositThreshold,
          depositFeeRatio: defaultDepositFeeRatio,
        }),
      )

      const pendingTxnsResult = await Wallets.getTransactionsForWallets({
        wallets: [newWalletA],
      })
      if (pendingTxnsResult instanceof Error) throw pendingTxnsResult
      const pendingTxns = pendingTxnsResult.result?.slice.filter(
        (tx) =>
          "transactionHash" in tx.settlementVia &&
          tx.settlementVia.transactionHash === txHash,
      )
      expect(pendingTxns?.length).toEqual(2)
      expect(pendingTxns?.[0].walletId).toBe(pendingTxns?.[1].walletId)
      expect(pendingTxns?.[0].id).not.toBe(pendingTxns?.[1].id)

      await bitcoindOutside.generateToAddress({ nblocks: 6, address: RANDOM_ADDRESS })

      const settledEvents = await manyBriaSubscribe({
        type: BriaPayloadType.UtxoSettled,
        addresses,
      })
      expect(settledEvents.length).toEqual(addresses.length)
      for (const settledEvent of settledEvents) {
        if (settledEvent?.payload.type !== BriaPayloadType.UtxoSettled) {
          throw new Error(`Expected ${BriaPayloadType.UtxoSettled} event`)
        }
        const resultSettled = await utxoSettledEventHandler({
          event: settledEvent.payload,
        })
        if (resultSettled instanceof Error) {
          throw resultSettled
        }
      }

      {
        const balanceUserA = await getBalanceHelper(newWalletIdA)
        const balanceDealer = await getBalanceHelper(funderWalletId)

        expect(balanceUserA).toBe(
          initialBalanceUserA +
            amountAfterFeeDeduction({
              amount: { amount: 300_000_000n, currency: WalletCurrency.Btc },
              minBankFee: feesConfig.depositDefaultMin,
              minBankFeeThreshold: feesConfig.depositThreshold,
              depositFeeRatio: defaultDepositFeeRatio,
            }),
        )
        expect(balanceDealer).toBe(
          initBalanceDealer +
            amountAfterFeeDeduction({
              amount: { amount: 200_000_000n, currency: WalletCurrency.Btc },
              minBankFee: feesConfig.depositDefaultMin,
              minBankFeeThreshold: feesConfig.depositThreshold,
              depositFeeRatio: defaultDepositFeeRatio,
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

      const amountSats = getRandomBtcAmount()

      const address = await Wallets.createOnChainAddress({
        walletId: newWalletIdA,
      })
      if (address instanceof Error) throw address

      const txId = (await bitcoindOutside.sendToAddress({
        address,
        amount: sat2btc(Number(amountSats.amount)),
      })) as OnChainTxHash

      const detectedEvent = await onceBriaSubscribe({
        type: BriaPayloadType.UtxoDetected,
        txId,
      })
      if (detectedEvent?.payload.type !== BriaPayloadType.UtxoDetected) {
        throw new Error(`Expected ${BriaPayloadType.UtxoDetected} event`)
      }
      const resultPending = await utxoDetectedEventHandler({
        event: detectedEvent.payload,
      })
      if (resultPending instanceof Error) {
        throw resultPending
      }

      const account = await Accounts.getAccount(newAccountIdA)
      if (account instanceof Error) throw account
      const feeSats = DepositFeeCalculator().onChainDepositFee({
        amount: amountSats,
        minBankFee: feesConfig.depositDefaultMin,
        minBankFeeThreshold: feesConfig.depositThreshold,
        ratio: feesConfig.depositRatioAsBasisPoints,
      })
      if (feeSats instanceof Error) throw feeSats

      // Check pendingTx from chain
      const { result: txs, error } = await getTransactionsForWalletId(newWalletIdA)
      if (error instanceof Error || txs === null) {
        throw error
      }
      const pendingTxs = txs.slice.filter(({ status }) => status === TxStatus.Pending)
      expect(pendingTxs.length).toBe(1)

      const pendingTx = pendingTxs[0] as WalletOnChainTransaction
      expect((pendingTx.settlementVia as SettlementViaOnChain).transactionHash).toBe(txId)
      expect(pendingTx.settlementVia.type).toBe("onchain")
      expect(pendingTx.settlementAmount).toBe(
        Number(calc.sub(amountSats, feeSats).amount),
      )
      expect(pendingTx.settlementFee).toBe(Number(feeSats.amount))
      expect(pendingTx.initiationVia.address).toBe(address)
      expect(pendingTx.createdAt).toBeInstanceOf(Date)

      const {
        settlementDisplayPrice: { displayCurrency },
      } = pendingTx
      const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
        currency: account.displayCurrency,
      })
      if (displayPriceRatio instanceof Error) throw displayPriceRatio

      const exponent = getCurrencyMajorExponent(displayCurrency)

      expect(pendingTx.settlementCurrency).toBe(WalletCurrency.Btc)
      const settlementWalletAmount = paymentAmountFromNumber({
        amount: pendingTx.settlementAmount,
        currency: WalletCurrency.Btc,
      })
      if (settlementWalletAmount instanceof Error) throw settlementWalletAmount
      expect(pendingTx.settlementDisplayAmount).toBe(
        displayPriceRatio.convertFromWallet(settlementWalletAmount).displayInMajor,
      )

      const settlementWalletFee = paymentAmountFromNumber({
        amount: pendingTx.settlementFee,
        currency: WalletCurrency.Btc,
      })
      if (settlementWalletFee instanceof Error) throw settlementWalletFee
      expect(pendingTx.settlementDisplayFee).toBe(
        displayPriceRatio.convertFromWalletToCeil(settlementWalletFee).displayInMajor,
      )

      // Check pendingTx from cache
      const { result: txsFromCache, error: errorFromCache } =
        await getTransactionsForWalletId(newWalletIdA)
      if (errorFromCache instanceof Error || txsFromCache === null) {
        throw errorFromCache
      }
      const pendingTxsFromCache = txsFromCache.slice.filter(
        ({ status }) => status === TxStatus.Pending,
      )
      expect(pendingTxsFromCache[0]?.createdAt).toBeInstanceOf(Date)

      const paymentAmount = {
        amount: BigInt(pendingTx.settlementAmount),
        currency: WalletCurrency.Btc,
      }

      const displayPaymentAmount = displayAmountFromNumber({
        amount: Number(pendingTx.settlementDisplayAmount) * 10 ** exponent,
        currency: displayCurrency,
      })
      if (displayPaymentAmount instanceof Error) throw displayPaymentAmount

      const pendingNotification = createPushNotificationContent({
        type: NotificationType.OnchainReceiptPending,
        userLanguage: locale,
        amount: paymentAmount,
        displayAmount: displayPaymentAmount,
      })

      expect(sendNotification.mock.calls.length).toBe(1)
      expect(sendNotification.mock.calls[0][0].title).toBe(pendingNotification.title)
      expect(sendNotification.mock.calls[0][0].body).toBe(pendingNotification.body)

      // Mine pendingTxns to clear repository
      await bitcoindOutside.generateToAddress({ nblocks: 3, address: RANDOM_ADDRESS })
      const settledEvent = await onceBriaSubscribe({
        type: BriaPayloadType.UtxoSettled,
        txId,
      })
      if (settledEvent?.payload.type !== BriaPayloadType.UtxoSettled) {
        throw new Error(`Expected ${BriaPayloadType.UtxoSettled} event`)
      }
      const resultSettled = await utxoSettledEventHandler({ event: settledEvent.payload })
      if (resultSettled instanceof Error) {
        throw resultSettled
      }
    })
  })
})

describe("With Lnd", () => {
  const sendToWalletTestWrapper = async ({
    amountSats,
    walletId,
    minBankFee = feesConfig.depositDefaultMin,
    minBankFeeThreshold = feesConfig.depositThreshold,
    depositFeeRatio = feesConfig.depositRatioAsBasisPoints,
  }: {
    amountSats: BtcPaymentAmount
    walletId: WalletId
    minBankFee?: BtcPaymentAmount
    minBankFeeThreshold?: BtcPaymentAmount
    depositFeeRatio?: DepositFeeRatioAsBasisPoints
  }): Promise<OnChainTxHash> => {
    const lnd = lndonchain

    const initialBalance = await getBalanceHelper(walletId)
    const { result: initTransactions, error } = await getTransactionsForWalletId(walletId)
    if (error instanceof Error || initTransactions === null) {
      throw error
    }

    const address = await lndCreateOnChainAddress(walletId)
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
      const result = await Wallets.updateLegacyOnChainReceipt({ logger: baseLogger })
      if (result instanceof Error) {
        throw result
      }

      const balance = await getBalanceHelper(walletId)

      expect(balance).toBe(
        initialBalance +
          amountAfterFeeDeduction({
            amount: amountSats,
            minBankFee,
            minBankFeeThreshold,
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
          minBankFee,
          minBankFeeThreshold,
          depositFeeRatio: depositFeeRatio,
        }),
      )
      expect(txn.initiationVia.address).toBe(address)

      return txn
    }

    // just to improve performance
    const blockNumber = await bitcoindClient.getBlockCount()
    const txId = await sendToAddressAndConfirm({
      walletClient: bitcoindOutside,
      address,
      amount: sat2btc(Number(amountSats.amount)),
    })
    if (txId instanceof Error) throw txId
    const txn = await checkBalance(blockNumber)

    // Check ledger transaction metadata for BTC 'LedgerTransactionType.OnchainReceipt'
    // ===
    const ledgerTxs = await LedgerService().getTransactionsByHash(
      (txn.settlementVia as SettlementViaOnChainIncoming).transactionHash,
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
      minBankFee: feesConfig.depositDefaultMin,
      minBankFeeThreshold: feesConfig.depositThreshold,
      ratio: feesConfig.depositRatioAsBasisPoints,
    })
    if (fee instanceof Error) throw fee

    const usdPaymentAmount = await usdFromBtcMidPriceFn(amountSats)
    if (usdPaymentAmount instanceof Error) throw usdPaymentAmount
    const centsAmount = Number(usdPaymentAmount.amount)

    const priceRatio = WalletPriceRatio({
      usd: usdPaymentAmount,
      btc: amountSats,
    })
    if (priceRatio instanceof Error) throw priceRatio

    const feeAmountCents = priceRatio.convertFromBtcToCeil(fee)
    const centsFee = toCents(feeAmountCents.amount)

    const expectedFields = {
      type: LedgerTransactionType.OnchainReceipt,

      debit: 0,
      credit: Number(calc.sub(amountSats, fee).amount),

      satsAmount: Number(calc.sub(amountSats, fee).amount),
      satsFee: Number(fee.amount),
      centsAmount: centsAmount - centsFee,
      centsFee,
      displayAmount: centsAmount - centsFee,
      displayFee: centsFee,

      displayCurrency: DisplayCurrency.Usd,
    }
    expect(ledgerTx).toEqual(expect.objectContaining(expectedFields))

    return txId
  }

  const testTxnsByAddressWrapper = async ({
    amountSats,
    walletId,
    addresses,
    minBankFee = feesConfig.depositDefaultMin,
    minBankFeeThreshold = feesConfig.depositThreshold,
    depositFeeRatio = feesConfig.depositRatioAsBasisPoints,
  }: {
    amountSats: Satoshis
    walletId: WalletId
    addresses: OnChainAddress[]
    minBankFee?: BtcPaymentAmount
    minBankFeeThreshold?: BtcPaymentAmount
    depositFeeRatio?: DepositFeeRatioAsBasisPoints
  }) => {
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

      await waitUntilSyncAll()
      // this is done by trigger and/or cron in prod
      const result = await Wallets.updateLegacyOnChainReceipt({ logger: baseLogger })
      if (result instanceof Error) {
        throw result
      }

      const btcAmount = paymentAmountFromNumber({
        amount: amountSats,
        currency: WalletCurrency.Btc,
      })
      if (btcAmount instanceof Error) throw btcAmount
      const balance = await getBalanceHelper(walletId)
      expect(balance).toBe(
        currentBalance +
          amountAfterFeeDeduction({
            amount: btcAmount,
            minBankFee,
            minBankFeeThreshold,
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
          amount: btcAmount,
          minBankFee,
          minBankFeeThreshold,
          depositFeeRatio: depositFeeRatio,
        }),
      )
      expect(addresses.includes(txn.initiationVia.address)).toBeTruthy()
    }

    const wallet = await WalletsRepository().findById(walletId)
    if (wallet instanceof Error) return wallet

    // sync all lnds previous to subscription use
    await waitUntilSyncAll()

    // Send payments to addresses
    const subTransactions = subscribeToTransactions({ lnd })
    const addressesForReceivedTxns = [] as OnChainAddress[]
    const onChainTxHandler = async (tx) => {
      await onchainTransactionEventHandler(tx)
      for (const address of tx.output_addresses) {
        if (addresses.includes(address)) {
          addressesForReceivedTxns.push(address)
        }
      }
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
    if (!txnsWithPending) throw new Error()
    expect(txnsWithPending.length).toBeGreaterThan(0)
    const pendingTxn = txnsWithPending[0]
    expect(pendingTxn.initiationVia.type).toEqual("onchain")
    expect(pendingTxn.settlementVia.type).toEqual("onchain")
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
    const commonAddressPendingSet = txnAddressesWithPendingSet.intersect(
      new Set(addresses),
    )
    expect(commonAddressPendingSet.size).toEqual(addresses.length)

    // Test pending onchain transactions balance use-case
    const pendingBalances = await Wallets.getPendingOnChainBalanceForWallets([wallet])
    if (pendingBalances instanceof Error) throw pendingBalances
    const btcAmount = paymentAmountFromNumber({
      amount: amountSats,
      currency: WalletCurrency.Btc,
    })
    if (btcAmount instanceof Error) throw btcAmount
    const expectedPendingBalance =
      amountAfterFeeDeduction({
        amount: btcAmount,
        minBankFee,
        minBankFeeThreshold,
        depositFeeRatio,
      }) * addresses.length
    expect(Number(pendingBalances[walletId].amount)).toEqual(expectedPendingBalance)

    // Confirm pending onchain transactions
    await mineBlockAndSyncAll()
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

  describe("FunderWallet - On chain", () => {
    it("receives on-chain transaction", async () => {
      const funderWalletId = await getFunderWalletId()
      await sendToWalletTestWrapper({
        walletId: funderWalletId,
        amountSats: getRandomBtcAmount(),
      })
    })
  })

  describe("UserWallet - On chain", () => {
    it("get last on chain address", async () => {
      const address = await lndCreateOnChainAddress(walletIdA)
      const lastAddress = await Wallets.getLastOnChainAddress(walletIdA)

      expect(address).not.toBeInstanceOf(Error)
      expect(lastAddress).not.toBeInstanceOf(Error)
      expect(lastAddress).toBe(address)
    })

    it.skip("fails to create onChain Address past rate limit", async () => {
      // Reset limits before starting
      let resetOk = await resetOnChainAddressAccountIdLimits(accountIdA)
      expect(resetOk).not.toBeInstanceOf(Error)
      if (resetOk instanceof Error) throw resetOk

      // Create max number of addresses
      const limitsNum = getOnChainAddressCreateAttemptLimits().points
      const promises: Promise<OnChainAddress | ApplicationError>[] = []
      for (let i = 0; i < limitsNum; i++) {
        const onChainAddressPromise = lndCreateOnChainAddress(walletIdA)
        promises.push(onChainAddressPromise)
      }
      const onChainAddresses = await Promise.all(promises)
      const isNotError = (item) => !(item instanceof Error)
      expect(onChainAddresses.every(isNotError)).toBe(true)

      // Test that first address past the limit fails
      const onChainAddress = await lndCreateOnChainAddress(walletIdA)
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

      const amountSats = getRandomBtcAmount()

      // Execute receive
      const txId = await sendToWalletTestWrapper({
        walletId: walletIdA,
        amountSats,
      })

      // Calculate receive display amount
      const account = await AccountsRepository().findById(accountIdA)
      if (account instanceof Error) throw account

      const receivedUsd = await usdFromBtcMidPriceFn(amountSats)
      if (receivedUsd instanceof Error) return receivedUsd

      const expectedSatsFee = DepositFeeCalculator().onChainDepositFee({
        amount: amountSats,
        minBankFee: feesConfig.depositDefaultMin,
        minBankFeeThreshold: feesConfig.depositThreshold,
        ratio: feesConfig.depositRatioAsBasisPoints,
      })
      if (expectedSatsFee instanceof Error) throw expectedSatsFee

      const txns = await LedgerService().getTransactionsByHash(txId)
      if (txns instanceof Error) throw txns
      const { satsFee, displayAmount: displayAmountRaw, displayCurrency } = txns[0]

      expect(Number(expectedSatsFee.amount)).toEqual(satsFee)

      const displayAmountForMajor = displayAmountFromNumber({
        amount: displayAmountRaw || 0,
        currency: displayCurrency || DisplayCurrency.Usd,
      })
      if (displayAmountForMajor instanceof Error) throw displayAmountForMajor

      const displayAmount =
        displayAmountRaw === undefined || displayCurrency === undefined
          ? undefined
          : displayAmountForMajor

      // Check received notification
      const receivedNotification = createPushNotificationContent({
        type: NotificationType.OnchainReceipt,
        userLanguage: locale,
        amount: amountSats,
        displayAmount,
      })

      expect(sendNotification.mock.calls.length).toBe(1)
      expect(sendNotification.mock.calls[0][0].title).toBe(receivedNotification.title)
      expect(sendNotification.mock.calls[0][0].body).toBe(receivedNotification.body)
    })

    it("retrieves on-chain transactions by address", async () => {
      const address1 = await lndCreateOnChainAddress(walletIdA)
      if (address1 instanceof Error) throw address1
      expect(address1.substr(0, 4)).toBe("bcrt")
      await testTxnsByAddressWrapper({
        walletId: walletIdA,
        addresses: [address1],
        amountSats: getRandomAmountOfSats(),
      })

      const address2 = await lndCreateOnChainAddress(walletIdA)
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
      await createUserAndWalletFromPhone(phoneE)
      const walletIdE = await getDefaultWalletIdByPhone(phoneE)
      await createUserAndWalletFromPhone(phoneG)
      const walletIdG = await getDefaultWalletIdByPhone(phoneG)

      const walletPriceRatio = await Prices.getCurrentPriceAsWalletPriceRatio({
        currency: WalletCurrency.Usd,
      })
      if (walletPriceRatio instanceof Error) throw walletPriceRatio
      const satsAmount = walletPriceRatio.convertFromUsd({
        amount: BigInt(withdrawalLimitAccountLevel1),
        currency: WalletCurrency.Usd,
      })

      await sendToWalletTestWrapper({
        walletId: walletIdE,
        amountSats: satsAmount,
      })
      await sendToWalletTestWrapper({
        walletId: walletIdG,
        amountSats: satsAmount,
      })
    })

    it("receives on-chain transaction with max limit for onUs level1", async () => {
      const intraLedgerLimitAccountLevel1 = accountLimits.intraLedgerLimit // cents

      await createUserAndWalletFromPhone(phoneF)
      const walletId = await getDefaultWalletIdByPhone(phoneF)

      const walletPriceRatio = await Prices.getCurrentPriceAsWalletPriceRatio({
        currency: WalletCurrency.Usd,
      })
      if (walletPriceRatio instanceof Error) throw walletPriceRatio
      const satsAmount = walletPriceRatio.convertFromUsd({
        amount: BigInt(intraLedgerLimitAccountLevel1),
        currency: WalletCurrency.Usd,
      })

      await sendToWalletTestWrapper({ walletId, amountSats: satsAmount })
    })

    it("receives batch on-chain transaction", async () => {
      const address1UserA = await lndCreateOnChainAddress(newWalletIdA)
      if (address1UserA instanceof Error) throw address1UserA

      const address2UserA = await lndCreateOnChainAddress(newWalletIdA)
      if (address2UserA instanceof Error) throw address2UserA

      const funderWalletId = await getFunderWalletId()
      const addressDealer = await lndCreateOnChainAddress(funderWalletId)
      if (addressDealer instanceof Error) throw addressDealer

      const initialBalanceUserA = await getBalanceHelper(newWalletIdA)
      const initBalanceDealer = await getBalanceHelper(funderWalletId)

      const output0 = {}
      output0[address1UserA] = 1

      const output1 = {}
      output1[addressDealer] = 2

      const output2 = {}
      output2[address2UserA] = 2

      const outputs = [output0, output1, output2]

      const { psbt } = await bitcoindOutside.walletCreateFundedPsbt({
        inputs: [],
        outputs,
      })
      // const decodedPsbt1 = await bitcoindOutside.decodePsbt(psbt)
      // const analysePsbt1 = await bitcoindOutside.analyzePsbt(psbt)
      const walletProcessPsbt = await bitcoindOutside.walletProcessPsbt({ psbt })
      // const decodedPsbt2 = await bitcoindOutside.decodePsbt(walletProcessPsbt.psbt)
      // const analysePsbt2 = await bitcoindOutside.analyzePsbt(walletProcessPsbt.psbt)
      const finalizedPsbt = await bitcoindOutside.finalizePsbt({
        psbt: walletProcessPsbt.psbt,
      })

      // mine and sync all before use tx subscription
      await mineBlockAndSyncAll()

      let isTxProcessed = false
      const sub = subscribeToTransactions({ lnd: lndonchain })
      sub.on("chain_transaction", async (tx) => {
        await onchainTransactionEventHandler(tx)
        isTxProcessed = true
      })
      // hack to solve sendRawTransaction not triggering chain tx event
      await bitcoindOutside.getBalance()
      const txHash = await bitcoindOutside.sendRawTransaction({
        hexstring: finalizedPsbt.hex,
      })
      await Promise.all([waitFor(() => isTxProcessed), waitUntilSyncAll()])

      sub.removeAllListeners()
      await sleep(1000)

      const defaultDepositFeeRatio = feesConfig.depositRatioAsBasisPoints

      // Test 'getPendingOnChainBalanceForWallets' use-case method
      const newWalletA = await WalletsRepository().findById(newWalletIdA)
      if (newWalletA instanceof Error) throw newWalletA
      const pendingBalance = await Wallets.getPendingOnChainBalanceForWallets([
        newWalletA,
      ])
      if (pendingBalance instanceof Error) throw pendingBalance
      expect(Number(pendingBalance[newWalletIdA].amount)).toEqual(
        amountAfterFeeDeduction({
          amount: { amount: 300_000_000n, currency: WalletCurrency.Btc },
          minBankFee: feesConfig.depositDefaultMin,
          minBankFeeThreshold: feesConfig.depositThreshold,
          depositFeeRatio: defaultDepositFeeRatio,
        }),
      )

      const pendingTxnsResult = await Wallets.getTransactionsForWallets({
        wallets: [newWalletA],
      })
      if (pendingTxnsResult instanceof Error) throw pendingTxnsResult
      const pendingTxns = pendingTxnsResult.result?.slice.filter(
        (tx) =>
          "transactionHash" in tx.settlementVia &&
          tx.settlementVia.transactionHash === txHash,
      )
      expect(pendingTxns?.length).toEqual(2)
      expect(pendingTxns?.[0].walletId).toBe(pendingTxns?.[1].walletId)
      expect(pendingTxns?.[0].id).not.toBe(pendingTxns?.[1].id)

      // Mine transaction and run checks for confirmed status
      await bitcoindOutside.generateToAddress({ nblocks: 6, address: RANDOM_ADDRESS })
      await waitUntilBlockHeight({ lnd: lndonchain })

      // this is done by trigger and/or cron in prod
      const result = await Wallets.updateLegacyOnChainReceipt({ logger: baseLogger })
      if (result instanceof Error) {
        throw result
      }

      {
        const balanceA = await getBalanceHelper(newWalletIdA)
        const balanceFunder = await getBalanceHelper(funderWalletId)

        const minBankFee = feesConfig.depositDefaultMin
        const minBankFeeThreshold = feesConfig.depositThreshold
        const depositFeeRatio = feesConfig.depositRatioAsBasisPoints

        expect(balanceA).toBe(
          initialBalanceUserA +
            amountAfterFeeDeduction({
              amount: { amount: 300_000_000n, currency: WalletCurrency.Btc },
              minBankFee,
              minBankFeeThreshold,
              depositFeeRatio,
            }),
        )
        expect(balanceFunder).toBe(
          initBalanceDealer +
            amountAfterFeeDeduction({
              amount: { amount: 200_000_000n, currency: WalletCurrency.Btc },
              minBankFee,
              minBankFeeThreshold,
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

      const amountSats = getRandomBtcAmount()

      const address = await lndCreateOnChainAddress(walletIdA)
      if (address instanceof Error) throw address

      const account = await Accounts.getAccount(accountIdA)
      if (account instanceof Error) throw account

      const feeSats = DepositFeeCalculator().onChainDepositFee({
        amount: amountSats,
        minBankFee: feesConfig.depositDefaultMin,
        minBankFeeThreshold: feesConfig.depositThreshold,
        ratio: feesConfig.depositRatioAsBasisPoints,
      })
      if (feeSats instanceof Error) throw feeSats

      const sub = subscribeToTransactions({ lnd: lndonchain })
      sub.on("chain_transaction", onchainTransactionEventHandler)

      await Promise.all([
        once(sub, "chain_transaction"),
        bitcoindOutside.sendToAddress({
          address,
          amount: sat2btc(Number(amountSats.amount)),
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
      expect(pendingTx.settlementAmount).toBe(
        Number(calc.sub(amountSats, feeSats).amount),
      )
      expect(pendingTx.settlementFee).toBe(Number(feeSats.amount))
      expect(pendingTx.initiationVia.address).toBe(address)
      expect(pendingTx.createdAt).toBeInstanceOf(Date)

      const {
        settlementDisplayPrice: { displayCurrency },
      } = pendingTx
      const exponent = getCurrencyMajorExponent(displayCurrency)

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

      const paymentAmount = {
        amount: BigInt(pendingTx.settlementAmount),
        currency: WalletCurrency.Btc,
      }

      const displayPaymentAmount = displayAmountFromNumber({
        amount: Number(pendingTx.settlementDisplayAmount) * 10 ** exponent,
        currency: displayCurrency,
      })
      if (displayPaymentAmount instanceof Error) throw displayPaymentAmount

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
  })
})

describe("Use cases", () => {
  describe("getPendingOnChainBalanceForWallets", () => {
    describe("with no pending incoming txns", () => {
      it("returns zero balance", async () => {
        const walletA = await WalletsRepository().findById(walletIdA)
        if (walletA instanceof Error) throw walletA

        const res = await Wallets.getPendingOnChainBalanceForWallets([walletA])
        expect(res).toStrictEqual({ [walletIdA]: ZERO_SATS })
      })

      it("returns error for mixed wallet currencies", async () => {
        const walletA = await WalletsRepository().findById(walletIdA)
        if (walletA instanceof Error) throw walletA
        const walletUsdA = await WalletsRepository().findById(walletIdUsdA)
        if (walletUsdA instanceof Error) throw walletUsdA

        const res = await Wallets.getPendingOnChainBalanceForWallets([
          walletA,
          walletUsdA,
        ])
        expect(res).toBeInstanceOf(MultipleCurrenciesForSingleCurrencyOperationError)
      })

      it("returns error for no wallets passed", async () => {
        const res = await Wallets.getPendingOnChainBalanceForWallets([])
        expect(res).toBeInstanceOf(MultipleCurrenciesForSingleCurrencyOperationError)
      })
    })
  })
})

const getRandomAmountOfSats = (): Satoshis =>
  toSats(+100_000_000 + Math.floor(Math.random() * 10 ** 6))

const getRandomBtcAmount = (): BtcPaymentAmount => {
  const amount = paymentAmountFromNumber({
    amount: getRandomAmountOfSats(),
    currency: WalletCurrency.Btc,
  })
  if (amount instanceof Error) throw amount
  return amount
}
