import { once } from "events"

import { Prices, Wallets } from "@app"
import {
  getFeesConfig,
  getOnChainWalletConfig,
  getAccountLimits,
  MS_PER_DAY,
  getLocale,
  getDisplayCurrencyConfig,
} from "@config"
import { toSats, toTargetConfs } from "@domain/bitcoin"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import {
  InsufficientBalanceError,
  InvalidSatoshiAmountError,
  LessThanDustThresholdError,
  LimitsExceededError,
  SelfPaymentError,
} from "@domain/errors"
import { toLiabilitiesWalletId } from "@domain/ledger"
import { NotificationType } from "@domain/notifications"
import { TwoFANewCodeNeededError } from "@domain/twoFA"
import { PaymentInitiationMethod, SettlementMethod, TxStatus } from "@domain/wallets"
import { onchainTransactionEventHandler } from "@servers/trigger"
import { Transaction } from "@services/ledger/schema"
import { baseLogger } from "@services/logger"
import { sleep } from "@utils"
import last from "lodash.last"

import { getCurrentPrice } from "@app/prices"

import { DisplayCurrencyConverter } from "@domain/fiat/display-currency"

import { add, sub, toCents } from "@domain/fiat"

import { createPushNotificationContent } from "@services/notifications/create-push-notification-content"
import * as PushNotificationsServiceImpl from "@services/notifications/push-notifications"

import { WalletCurrency } from "@domain/shared"

import {
  bitcoindClient,
  bitcoindOutside,
  checkIsBalanced,
  createChainAddress,
  createMandatoryUsers,
  createUserAndWalletFromUserRef,
  enable2FA,
  generateTokenHelper,
  getAccountByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  getUserIdByTestUserRef,
  getUserRecordByTestUserRef,
  lndonchain,
  lndOutside1,
  mineBlockAndSync,
  mineBlockAndSyncAll,
  RANDOM_ADDRESS,
  subscribeToTransactions,
} from "test/helpers"
import { getBalanceHelper, getRemainingTwoFALimit } from "test/helpers/wallet"

const date = Date.now() + 1000 * 60 * 60 * 24 * 8
jest.spyOn(global.Date, "now").mockImplementation(() => new Date(date).valueOf())

jest.mock("@app/prices/get-current-price", () => require("test/mocks/get-current-price"))

let initialBalanceUserA: Satoshis
let userA: UserRecord

let accountA: Account
let accountG: Account

let walletIdA: WalletId
let walletIdD: WalletId
let walletIdG: WalletId

// using walletIdE and walletIdF to sendAll
let walletIdE: WalletId
let walletIdF: WalletId
let userIdA: UserId

const locale = getLocale()
const { code: DefaultDisplayCurrency } = getDisplayCurrencyConfig()

beforeAll(async () => {
  await createMandatoryUsers()

  await createUserAndWalletFromUserRef("B")
  await createUserAndWalletFromUserRef("D")
  await createUserAndWalletFromUserRef("E")
  await createUserAndWalletFromUserRef("F")

  userA = await getUserRecordByTestUserRef("A")
  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  userIdA = await getUserIdByTestUserRef("A")
  accountA = await getAccountByTestUserRef("A")

  walletIdD = await getDefaultWalletIdByTestUserRef("D")
  walletIdE = await getDefaultWalletIdByTestUserRef("E")
  walletIdF = await getDefaultWalletIdByTestUserRef("F")
  walletIdG = await getDefaultWalletIdByTestUserRef("G")
  accountG = await getAccountByTestUserRef("G")

  await bitcoindClient.loadWallet({ filename: "outside" })
})

beforeEach(async () => {
  initialBalanceUserA = toSats(await getBalanceHelper(walletIdA))
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

const amount = toSats(10040)
const targetConfirmations = toTargetConfs(1)

describe("UserWallet - onChainPay", () => {
  it("sends a successful payment", async () => {
    const sendNotification = jest.fn()
    jest
      .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
      .mockImplementation(() => ({ sendNotification }))
    const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })

    const sub = subscribeToTransactions({ lnd: lndonchain })
    sub.on("chain_transaction", onchainTransactionEventHandler)

    const results = await Promise.all([
      once(sub, "chain_transaction"),
      Wallets.payOnChainByWalletId({
        senderAccount: accountA,
        senderWalletId: walletIdA,
        address,
        amount,
        targetConfirmations,
        memo: null,
        sendAll: false,
      }),
    ])

    expect(results[1]).toBe(PaymentSendStatus.Success)
    await onchainTransactionEventHandler(results[0][0])

    // we don't send a notification for send transaction for now
    // expect(sendNotification.mock.calls.length).toBe(1)
    // expect(sendNotification.mock.calls[0][0].data.type).toBe(NotificationType.OnchainPayment)
    // expect(sendNotification.mock.calls[0][0].data.title).toBe(`Your transaction has been sent. It may takes some time before it is confirmed`)

    let pendingTxHash: OnChainTxHash

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: walletIdA,
      })
      if (txResult.error instanceof Error || txResult.result === null) {
        throw txResult.error
      }
      const pendingTxs = txResult.result.filter(
        ({ status }) => status === TxStatus.Pending,
      )
      expect(pendingTxs.length).toBe(1)
      const pendingTx = pendingTxs[0]
      expect(pendingTx.settlementAmount).toBe(-amount - pendingTx.settlementFee)
      pendingTxHash = pendingTx.id as OnChainTxHash

      const interimBalance = await getBalanceHelper(walletIdA)
      expect(interimBalance).toBe(initialBalanceUserA - amount - pendingTx.settlementFee)
      await checkIsBalanced()
    }

    // const subSpend = subscribeToChainSpend({ lnd: lndonchain, bech32_address: address, min_height: 1 })

    await Promise.all([once(sub, "chain_transaction"), mineBlockAndSyncAll()])

    await sleep(3000)

    const satsPrice = await Prices.getCurrentPrice()
    if (satsPrice instanceof Error) throw satsPrice

    const paymentAmount = { amount: BigInt(amount), currency: WalletCurrency.Btc }
    const displayPaymentAmount = {
      amount: amount * satsPrice,
      currency: DefaultDisplayCurrency,
    }

    const { title, body } = createPushNotificationContent({
      type: NotificationType.OnchainPayment,
      userLanguage: locale as UserLanguage,
      amount: paymentAmount,
      displayAmount: displayPaymentAmount,
    })

    expect(sendNotification.mock.calls.length).toBe(1)
    expect(sendNotification.mock.calls[0][0].title).toBe(title)
    expect(sendNotification.mock.calls[0][0].body).toBe(body)

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: walletIdA,
      })
      if (txResult.error instanceof Error || txResult.result === null) {
        throw txResult.error
      }
      const pendingTxs = txResult.result.filter(
        ({ status }) => status === TxStatus.Pending,
      )
      expect(pendingTxs.length).toBe(0)

      const settledTxs = txResult.result.filter(
        ({ status, initiationVia, id }) =>
          status === TxStatus.Success &&
          initiationVia.type === PaymentInitiationMethod.OnChain &&
          id === pendingTxHash,
      )
      expect(settledTxs.length).toBe(1)
      const settledTx = last(settledTxs) as WalletTransaction

      const feeRates = getFeesConfig()
      const fee = feeRates.withdrawDefaultMin + 7050

      expect(settledTx.settlementFee).toBe(fee)
      expect(settledTx.settlementAmount).toBe(-amount - fee)

      expect(settledTx.displayCurrencyPerSettlementCurrencyUnit).toBeGreaterThan(0)

      const finalBalance = await getBalanceHelper(walletIdA)
      expect(finalBalance).toBe(initialBalanceUserA - amount - fee)
    }

    sub.removeAllListeners()
  })

  it("sends all in a successful payment", async () => {
    const sendNotification = jest.fn()
    jest
      .spyOn(PushNotificationsServiceImpl, "PushNotificationsService")
      .mockImplementation(() => ({ sendNotification }))
    const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })

    const sub = subscribeToTransactions({ lnd: lndonchain })
    sub.on("chain_transaction", onchainTransactionEventHandler)

    const initialBalanceUserE = await getBalanceHelper(walletIdE)
    const senderAccount = await getAccountByTestUserRef("E")

    const results = await Promise.all([
      once(sub, "chain_transaction"),
      Wallets.payOnChainByWalletId({
        senderAccount,
        senderWalletId: walletIdE,
        address,
        amount: 0,
        targetConfirmations,
        memo: null,
        sendAll: true,
      }),
    ])

    expect(results[1]).toBe(PaymentSendStatus.Success)
    await onchainTransactionEventHandler(results[0][0])

    // we don't send a notification for send transaction for now
    // expect(sendNotification.mock.calls.length).toBe(1)
    // expect(sendNotification.mock.calls[0][0].data.type).toBe(NotificationType.OnchainPayment)
    // expect(sendNotification.mock.calls[0][0].data.title).toBe(`Your transaction has been sent. It may takes some time before it is confirmed`)

    let pendingTxHash

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: walletIdE,
      })
      if (txResult.error instanceof Error || txResult.result === null) {
        throw txResult.error
      }
      const pendingTxs = txResult.result.filter(
        ({ status }) => status === TxStatus.Pending,
      )
      expect(pendingTxs.length).toBe(1)
      const pendingTx = pendingTxs[0]
      expect(pendingTx.settlementAmount).toBe(-initialBalanceUserE)

      pendingTxHash = pendingTx.id as OnChainTxHash

      const interimBalance = await getBalanceHelper(walletIdE)
      expect(interimBalance).toBe(0)
      await checkIsBalanced()
    }

    // const subSpend = subscribeToChainSpend({ lnd: lndonchain, bech32_address: address, min_height: 1 })

    await Promise.all([
      once(sub, "chain_transaction"),
      mineBlockAndSync({ lnds: [lndonchain] }),
    ])

    await sleep(1000)

    expect(sendNotification.mock.calls.length).toBe(1)

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: walletIdE,
      })
      if (txResult.error instanceof Error || txResult.result === null) {
        throw txResult.error
      }
      const pendingTxs = txResult.result.filter(
        ({ status }) => status === TxStatus.Pending,
      )
      expect(pendingTxs.length).toBe(0)

      const settledTxs = txResult.result.filter(
        ({ status, initiationVia, id }) =>
          status === TxStatus.Success &&
          initiationVia.type === PaymentInitiationMethod.OnChain &&
          id === pendingTxHash,
      )
      expect(settledTxs.length).toBe(1)
      const settledTx = last(settledTxs) as WalletTransaction

      const feeRates = getFeesConfig()
      const fee = feeRates.withdrawDefaultMin + 7050

      const finalBalance = await getBalanceHelper(walletIdE)
      expect(finalBalance).toBe(0)

      expect(settledTx.settlementFee).toBe(fee)
      expect(settledTx.settlementAmount).toBe(-initialBalanceUserE)
      expect(settledTx.displayCurrencyPerSettlementCurrencyUnit).toBeGreaterThan(0)
    }

    sub.removeAllListeners()
  })

  it("sends a successful payment with memo", async () => {
    const memo = "this is my onchain memo"
    const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })
    const paymentResult = await Wallets.payOnChainByWalletId({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address,
      amount,
      targetConfirmations,
      memo,
      sendAll: false,
    })
    expect(paymentResult).toBe(PaymentSendStatus.Success)
    const { result: txs, error } = await Wallets.getTransactionsForWalletId({
      walletId: walletIdA,
    })
    if (error instanceof Error || txs === null) {
      throw error
    }
    if (txs.length === 0) {
      throw Error("No transactions found")
    }
    const firstTxs = txs[0]
    expect(firstTxs.memo).toBe(memo)
    const pendingTxHash = firstTxs.id

    const sub = subscribeToTransactions({ lnd: lndonchain })
    sub.on("chain_transaction", onchainTransactionEventHandler)

    const results = await Promise.all([
      once(sub, "chain_transaction"),
      mineBlockAndSync({ lnds: [lndonchain] }),
    ])

    await sleep(1000)
    await onchainTransactionEventHandler(results[0][0])

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: walletIdA,
      })
      if (txResult.error instanceof Error || txResult.result === null) {
        throw txResult.error
      }
      const pendingTxs = txResult.result.filter(
        ({ status }) => status === TxStatus.Pending,
      )
      expect(pendingTxs.length).toBe(0)

      const settledTxs = txResult.result.filter(
        ({ status, initiationVia, id }) =>
          status === TxStatus.Success &&
          initiationVia.type === PaymentInitiationMethod.OnChain &&
          id === pendingTxHash,
      )
      expect(settledTxs.length).toBe(1)
      const settledTx = last(settledTxs) as WalletTransaction

      expect(settledTx.memo).toBe(memo)
    }

    // Delay as workaround for occasional core-dump error
    await new Promise((resolve) => setImmediate(resolve))
    sub.removeAllListeners()
  })

  it("sends an on us transaction", async () => {
    const address = await Wallets.createOnChainAddress(walletIdD)
    if (address instanceof Error) throw address

    const initialBalanceUserD = await getBalanceHelper(walletIdD)

    const paid = await Wallets.payOnChainByWalletId({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address,
      amount,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })

    const finalBalanceUserA = await getBalanceHelper(walletIdA)
    const finalBalanceUserD = await getBalanceHelper(walletIdD)

    expect(paid).toBe(PaymentSendStatus.Success)
    expect(finalBalanceUserA).toBe(initialBalanceUserA - amount)
    expect(finalBalanceUserD).toBe(initialBalanceUserD + amount)

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: walletIdA,
      })
      if (txResult.error instanceof Error || txResult.result === null) {
        throw txResult.error
      }
      const pendingTxs = txResult.result.filter(
        ({ status }) => status === TxStatus.Pending,
      )
      expect(pendingTxs.length).toBe(0)

      const settledTxs = txResult.result.filter(
        ({ status, initiationVia, settlementVia }) =>
          status === TxStatus.Success &&
          initiationVia.type === PaymentInitiationMethod.OnChain &&
          settlementVia.type === SettlementMethod.IntraLedger,
      )
      expect(settledTxs.length).toBe(1)
      const settledTx = last(settledTxs) as WalletTransaction

      expect(settledTx.settlementFee).toBe(0)
      expect(settledTx.settlementAmount).toBe(-amount)
      expect(settledTx.displayCurrencyPerSettlementCurrencyUnit).toBeGreaterThan(0)

      const finalBalance = await getBalanceHelper(walletIdA)
      expect(finalBalance).toBe(initialBalanceUserA - amount)
    }
  })

  it("sends an on us transaction with memo", async () => {
    const memo = "this is my onchain memo"

    const address = await Wallets.createOnChainAddress(walletIdD)
    if (address instanceof Error) throw address

    const paid = await Wallets.payOnChainByWalletId({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address,
      amount,
      targetConfirmations,
      memo,
      sendAll: false,
    })

    expect(paid).toBe(PaymentSendStatus.Success)

    const matchTx = (tx: WalletTransaction) =>
      tx.initiationVia.type === PaymentInitiationMethod.OnChain &&
      tx.initiationVia.address === address

    const { result: txs, error } = await Wallets.getTransactionsForWalletId({
      walletId: walletIdA,
    })
    if (error instanceof Error || txs === null) {
      throw error
    }
    const filteredTxs = txs.filter(matchTx)
    expect(filteredTxs.length).toBe(1)
    expect(filteredTxs[0].memo).toBe(memo)

    // receiver should not know memo from sender
    const { result: txsUserD, error: error2 } = await Wallets.getTransactionsForWalletId({
      walletId: walletIdD,
    })
    if (error2 instanceof Error || txsUserD === null) {
      throw error2
    }
    const filteredTxsUserD = txsUserD.filter(matchTx)
    expect(filteredTxsUserD.length).toBe(1)
    expect(filteredTxsUserD[0].memo).not.toBe(memo)
  })

  it("sends all with an on us transaction", async () => {
    const initialBalanceUserF = await getBalanceHelper(walletIdF)

    const address = await Wallets.createOnChainAddress(walletIdD)
    if (address instanceof Error) throw address

    const initialBalanceUserD = await getBalanceHelper(walletIdD)
    const senderAccount = await getAccountByTestUserRef("F")

    const paid = await Wallets.payOnChainByWalletId({
      senderAccount,
      senderWalletId: walletIdF,
      address,
      amount: 0,
      targetConfirmations,
      memo: null,
      sendAll: true,
    })

    const finalBalanceUserF = await getBalanceHelper(walletIdF)
    const finalBalanceUserD = await getBalanceHelper(walletIdD)

    expect(paid).toBe(PaymentSendStatus.Success)
    expect(finalBalanceUserF).toBe(0)
    expect(finalBalanceUserD).toBe(initialBalanceUserD + initialBalanceUserF)

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: walletIdF,
      })
      if (txResult.error instanceof Error || txResult.result === null) {
        throw txResult.error
      }
      const pendingTxs = txResult.result.filter(
        ({ status }) => status === TxStatus.Pending,
      )
      expect(pendingTxs.length).toBe(0)

      const settledTxs = txResult.result.filter(
        ({ status, initiationVia, settlementVia }) =>
          status === TxStatus.Success &&
          initiationVia.type === PaymentInitiationMethod.OnChain &&
          settlementVia.type === SettlementMethod.IntraLedger,
      )
      expect(settledTxs.length).toBe(1)
      const settledTx = last(settledTxs) as WalletTransaction

      expect(settledTx.settlementFee).toBe(0)
      expect(settledTx.settlementAmount).toBe(-initialBalanceUserF)
      expect(settledTx.displayCurrencyPerSettlementCurrencyUnit).toBeGreaterThan(0)

      const finalBalance = await getBalanceHelper(walletIdF)
      expect(finalBalance).toBe(0)
    }
  })

  it("fails if try to send a transaction to self", async () => {
    const address = await Wallets.createOnChainAddress(walletIdA)
    if (address instanceof Error) throw address

    const status = await Wallets.payOnChainByWalletId({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address,
      amount,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })
    expect(status).toBeInstanceOf(SelfPaymentError)
  })

  it("fails if an on us payment has insufficient balance", async () => {
    const address = await Wallets.createOnChainAddress(walletIdD)
    if (address instanceof Error) throw address

    const initialBalanceUserE = await getBalanceHelper(walletIdE)
    const senderAccount = await getAccountByTestUserRef("E")

    const status = await Wallets.payOnChainByWalletId({
      senderAccount,
      senderWalletId: walletIdE,
      address,
      amount: initialBalanceUserE + 1,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })
    expect(status).toBeInstanceOf(InsufficientBalanceError)
  })

  it("fails if has insufficient balance", async () => {
    const { address } = await createChainAddress({
      lnd: lndOutside1,
      format: "p2wpkh",
    })
    const initialBalanceUserG = await getBalanceHelper(walletIdG)

    const status = await Wallets.payOnChainByWalletId({
      senderAccount: accountG,
      senderWalletId: walletIdG,
      address,
      amount: initialBalanceUserG,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })
    //should fail because user does not have balance to pay for on-chain fee
    expect(status).toBeInstanceOf(InsufficientBalanceError)
  })

  it("fails if has negative amount", async () => {
    const amount = -1000
    const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })

    const status = await Wallets.payOnChainByWalletId({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address,
      amount,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })
    expect(status).toBeInstanceOf(InvalidSatoshiAmountError)
  })

  it("fails if withdrawal limit hit", async () => {
    const { address } = await createChainAddress({
      lnd: lndOutside1,
      format: "p2wpkh",
    })

    const timestampYesterday = new Date(Date.now() - MS_PER_DAY)
    const [result] = await Transaction.aggregate([
      {
        $match: {
          accounts: toLiabilitiesWalletId(walletIdA),
          type: { $ne: "on_us" },
          timestamp: { $gte: timestampYesterday },
        },
      },
      { $group: { _id: null, outgoingBaseAmount: { $sum: "$debit" } } },
    ])

    const outgoingBaseAmount = toSats(result?.outgoingBaseAmount || 0)

    if (!userA.level) throw new Error("Invalid or non existent user level")

    const withdrawalLimit = getAccountLimits({ level: accountA.level }).withdrawalLimit

    const price = await getCurrentPrice()
    if (price instanceof Error) throw price
    const dCConverter = DisplayCurrencyConverter(price)

    const subResult = sub(
      dCConverter.fromCentsToSats(withdrawalLimit),
      outgoingBaseAmount,
    )
    if (subResult instanceof Error) return subResult

    const amount = add(subResult, toSats(100))

    const status = await Wallets.payOnChainByWalletId({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address,
      amount,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })

    expect(status).toBeInstanceOf(LimitsExceededError)
  })

  it("fails if the amount is less than on chain dust amount", async () => {
    const address = await bitcoindOutside.getNewAddress()
    const onChainWalletConfig = getOnChainWalletConfig()

    const status = await Wallets.payOnChainByWalletId({
      senderAccount: accountA,
      senderWalletId: walletIdA,
      address,
      amount: onChainWalletConfig.dustThreshold - 1,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })
    expect(status).toBeInstanceOf(LessThanDustThresholdError)
  })

  describe("2FA", () => {
    it("fails to pay above 2fa limit without 2fa token", async () => {
      await enable2FA(userIdA)

      const price = await getCurrentPrice()
      if (price instanceof Error) throw price
      const dCConverter = DisplayCurrencyConverter(price)

      const remainingLimit = await getRemainingTwoFALimit({
        walletId: walletIdA,
        satsToCents: dCConverter.fromSatsToCents,
      })

      const aboveThreshold = add(remainingLimit, toCents(10))

      const status = await Wallets.payOnChainByWalletIdWithTwoFA({
        senderAccount: accountA,
        senderWalletId: walletIdA,
        address: RANDOM_ADDRESS,
        amount: dCConverter.fromCentsToSats(aboveThreshold),
        targetConfirmations,
        memo: null,
        sendAll: false,
        twoFAToken: "" as TwoFAToken,
      })

      expect(status).toBeInstanceOf(TwoFANewCodeNeededError)
    })

    it("sends a successful large payment with a 2fa code", async () => {
      await enable2FA(userIdA)

      const initialBalance = await getBalanceHelper(walletIdA)
      const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })
      const twoFAToken = generateTokenHelper(userA.twoFA.secret)
      const amount = userA.twoFA.threshold + 1
      const paid = await Wallets.payOnChainByWalletIdWithTwoFA({
        senderAccount: accountA,
        senderWalletId: walletIdA,
        address,
        amount,
        targetConfirmations,
        memo: null,
        sendAll: false,
        twoFAToken,
      })

      expect(paid).toBe(PaymentSendStatus.Success)

      await mineBlockAndSyncAll()
      const result = await Wallets.updateOnChainReceipt({ logger: baseLogger })
      if (result instanceof Error) {
        throw result
      }

      const { result: txs, error } = await Wallets.getTransactionsForWalletId({
        walletId: walletIdA,
      })

      if (error instanceof Error || txs === null) {
        throw error
      }

      // settlementAmount is negative
      const expectedBalance = initialBalance + txs[0].settlementAmount
      const finalBalance = await getBalanceHelper(walletIdA)
      expect(expectedBalance).toBe(finalBalance)
    })
  })
})
