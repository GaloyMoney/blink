import { once } from "events"

import { Wallets } from "@app"
import { getFeeRates, getOnChainWalletConfig, getUserLimits, MS_PER_DAY } from "@config"
import { toTargetConfs } from "@domain/bitcoin"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import {
  InsufficientBalanceError,
  InvalidSatoshiAmount,
  LessThanDustThresholdError,
  LimitsExceededError,
  SelfPaymentError,
} from "@domain/errors"
import { LedgerTransactionType, toLiabilitiesWalletId } from "@domain/ledger"
import { NotificationType } from "@domain/notifications"
import { TwoFANewCodeNeededError } from "@domain/twoFA"
import { PaymentInitiationMethod, SettlementMethod, TxStatus } from "@domain/wallets"
import { onchainTransactionEventHandler } from "@servers/trigger"
import { Transaction } from "@services/ledger/schema"
import { baseLogger } from "@services/logger"
import { getTitle } from "@services/notifications/payment"
import { sleep } from "@utils"
import last from "lodash.last"

import {
  bitcoindClient,
  bitcoindOutside,
  checkIsBalanced,
  createChainAddress,
  createMandatoryUsers,
  createUserWallet,
  enable2FA,
  generateTokenHelper,
  getAccountByTestUserIndex,
  getDefaultWalletIdByTestUserIndex,
  getUserIdByTestUserIndex,
  getUserRecordByTestUserIndex,
  lndonchain,
  lndOutside1,
  mineBlockAndSync,
  mineBlockAndSyncAll,
  RANDOM_ADDRESS,
  subscribeToTransactions,
} from "test/helpers"
import { getBTCBalance, getRemainingTwoFALimit } from "test/helpers/wallet"

jest.mock("@services/notifications/notification")

const date = Date.now() + 1000 * 60 * 60 * 24 * 8

jest.spyOn(global.Date, "now").mockImplementation(() => new Date(date).valueOf())

let initialBalanceUser0: Satoshis
let user0: UserRecord

let account0: Account

let walletId0: WalletId
let account1: Account
let walletId1: WalletId
let walletId3: WalletId

// using walletId11 and walletId12 to sendAll
let walletId11: WalletId
let walletId12: WalletId
let userId0: UserId

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("@services/notifications/notification")

beforeAll(async () => {
  await createMandatoryUsers()

  await createUserWallet(1)
  await createUserWallet(3)
  await createUserWallet(11)
  await createUserWallet(12)

  user0 = await getUserRecordByTestUserIndex(0)
  walletId0 = await getDefaultWalletIdByTestUserIndex(0)
  userId0 = await getUserIdByTestUserIndex(0)
  account0 = await getAccountByTestUserIndex(0)

  walletId1 = await getDefaultWalletIdByTestUserIndex(1)
  account1 = await getAccountByTestUserIndex(1)
  walletId3 = await getDefaultWalletIdByTestUserIndex(3)
  walletId11 = await getDefaultWalletIdByTestUserIndex(11)
  walletId12 = await getDefaultWalletIdByTestUserIndex(12)

  await bitcoindClient.loadWallet({ filename: "outside" })
})

beforeEach(async () => {
  initialBalanceUser0 = await getBTCBalance(walletId0)
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

const amount = 10040 // sats
const targetConfirmations = toTargetConfs(1)

describe("UserWallet - onChainPay", () => {
  it("sends a successful payment", async () => {
    const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })

    const sub = subscribeToTransactions({ lnd: lndonchain })
    sub.on("chain_transaction", onchainTransactionEventHandler)

    const results = await Promise.all([
      once(sub, "chain_transaction"),
      Wallets.payOnChainByWalletId({
        senderAccount: account0,
        senderWalletId: walletId0,
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
        walletId: walletId0,
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

      const interimBalance = await getBTCBalance(walletId0)
      expect(interimBalance).toBe(initialBalanceUser0 - amount - pendingTx.settlementFee)
      await checkIsBalanced()
    }

    // const subSpend = subscribeToChainSpend({ lnd: lndonchain, bech32_address: address, min_height: 1 })

    await Promise.all([
      once(sub, "chain_transaction"),
      mineBlockAndSync({ lnds: [lndonchain] }),
    ])

    await sleep(1000)

    // expect(sendNotification.mock.calls.length).toBe(2)  // FIXME: should be 1

    expect(sendNotification.mock.calls[0][0].title).toBe(
      getTitle[NotificationType.OnchainPayment]({ amount }),
    )
    expect(sendNotification.mock.calls[0][0].user.id.toString()).toStrictEqual(userId0)
    expect(sendNotification.mock.calls[0][0].data.type).toBe(
      NotificationType.OnchainPayment,
    )

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: walletId0,
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

      const feeRates = getFeeRates()
      const fee = feeRates.withdrawFeeFixed + 7050

      expect(settledTx.settlementFee).toBe(fee)
      expect(settledTx.settlementAmount).toBe(-amount - fee)

      expect(settledTx.settlementUsdPerSat).toBeGreaterThan(0)

      const finalBalance = await getBTCBalance(walletId0)
      expect(finalBalance).toBe(initialBalanceUser0 - amount - fee)
    }

    sub.removeAllListeners()
  })

  it("sends all in a successful payment", async () => {
    const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })

    const sub = subscribeToTransactions({ lnd: lndonchain })
    sub.on("chain_transaction", onchainTransactionEventHandler)

    const initialBalanceUser11 = await getBTCBalance(walletId11)
    const senderAccount = await getAccountByTestUserIndex(11)

    const results = await Promise.all([
      once(sub, "chain_transaction"),
      Wallets.payOnChainByWalletId({
        senderAccount,
        senderWalletId: walletId11,
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
        walletId: walletId11,
      })
      if (txResult.error instanceof Error || txResult.result === null) {
        throw txResult.error
      }
      const pendingTxs = txResult.result.filter(
        ({ status }) => status === TxStatus.Pending,
      )
      expect(pendingTxs.length).toBe(1)
      const pendingTx = pendingTxs[0]
      expect(pendingTx.settlementAmount).toBe(-initialBalanceUser11)
      pendingTxHash = pendingTx.id as OnChainTxHash

      const interimBalance = await getBTCBalance(walletId11)
      expect(interimBalance).toBe(0)
      await checkIsBalanced()
    }

    // const subSpend = subscribeToChainSpend({ lnd: lndonchain, bech32_address: address, min_height: 1 })

    await Promise.all([
      once(sub, "chain_transaction"),
      mineBlockAndSync({ lnds: [lndonchain] }),
    ])

    await sleep(1000)

    // expect(sendNotification.mock.calls.length).toBe(2)  // FIXME: should be 1

    /// TODO Still showing amount, find where this happens...
    // expect(sendNotification.mock.calls[0][0].title).toBe(
    //   getTitle[NotificationType.OnchainPayment]({ amount: initialBalanceUser1 }),
    // )
    expect(sendNotification.mock.calls[0][0].data.type).toBe(
      NotificationType.OnchainPayment,
    )

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: walletId11,
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

      const feeRates = getFeeRates()
      const fee = feeRates.withdrawFeeFixed + 7050

      const finalBalance = await getBTCBalance(walletId11)
      expect(finalBalance).toBe(0)

      expect(settledTx.settlementFee).toBe(fee)
      expect(settledTx.settlementAmount).toBe(-initialBalanceUser11)
      expect(settledTx.settlementUsdPerSat).toBeGreaterThan(0)
    }

    sub.removeAllListeners()
  })

  it("sends a successful payment with memo", async () => {
    const memo = "this is my onchain memo"
    const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })
    const paymentResult = await Wallets.payOnChainByWalletId({
      senderAccount: account0,
      senderWalletId: walletId0,
      address,
      amount,
      targetConfirmations,
      memo,
      sendAll: false,
    })
    expect(paymentResult).toBe(PaymentSendStatus.Success)
    const { result: txs, error } = await Wallets.getTransactionsForWalletId({
      walletId: walletId0,
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
        walletId: walletId0,
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

    sub.removeAllListeners()
  })

  it("sends an on us transaction", async () => {
    const address = await Wallets.createOnChainAddress(walletId3)
    if (address instanceof Error) throw address

    const initialBalanceUser3 = await getBTCBalance(walletId3)

    const paid = await Wallets.payOnChainByWalletId({
      senderAccount: account0,
      senderWalletId: walletId0,
      address,
      amount,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })

    const finalBalanceUser0 = await getBTCBalance(walletId0)
    const finalBalanceUser3 = await getBTCBalance(walletId3)

    expect(paid).toBe(PaymentSendStatus.Success)
    expect(finalBalanceUser0).toBe(initialBalanceUser0 - amount)
    expect(finalBalanceUser3).toBe(initialBalanceUser3 + amount)

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: walletId0,
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
      expect(settledTx.settlementUsdPerSat).toBeGreaterThan(0)

      const finalBalance = await getBTCBalance(walletId0)
      expect(finalBalance).toBe(initialBalanceUser0 - amount)
    }
  })

  it("sends an on us transaction with memo", async () => {
    const memo = "this is my onchain memo"

    const address = await Wallets.createOnChainAddress(walletId3)
    if (address instanceof Error) throw address

    const paid = await Wallets.payOnChainByWalletId({
      senderAccount: account0,
      senderWalletId: walletId0,
      address,
      amount,
      targetConfirmations,
      memo,
      sendAll: false,
    })

    expect(paid).toBe(PaymentSendStatus.Success)

    const matchTx = (tx: WalletTransaction) =>
      tx.initiationVia.type === PaymentInitiationMethod.OnChain &&
      tx.deprecated.type === LedgerTransactionType.OnchainIntraLedger &&
      tx.initiationVia.address === address

    const { result: txs, error } = await Wallets.getTransactionsForWalletId({
      walletId: walletId0,
    })
    if (error instanceof Error || txs === null) {
      throw error
    }
    const filteredTxs = txs.filter(matchTx)
    expect(filteredTxs.length).toBe(1)
    expect(filteredTxs[0].deprecated.description).toBe(memo)

    // receiver should not know memo from sender
    const { result: txsUser3, error: error2 } = await Wallets.getTransactionsForWalletId({
      walletId: walletId3,
    })
    if (error2 instanceof Error || txsUser3 === null) {
      throw error2
    }
    const filteredTxsUser3 = txsUser3.filter(matchTx)
    expect(filteredTxsUser3.length).toBe(1)
    expect(filteredTxsUser3[0].deprecated.description).not.toBe(memo)
  })

  it("sends all with an on us transaction", async () => {
    const initialBalanceUser12 = await getBTCBalance(walletId12)

    const address = await Wallets.createOnChainAddress(walletId3)
    if (address instanceof Error) throw address

    const initialBalanceUser3 = await getBTCBalance(walletId3)
    const senderAccount = await getAccountByTestUserIndex(12)

    const paid = await Wallets.payOnChainByWalletId({
      senderAccount,
      senderWalletId: walletId12,
      address,
      amount: 0,
      targetConfirmations,
      memo: null,
      sendAll: true,
    })

    const finalBalanceUser12 = await getBTCBalance(walletId12)
    const finalBalanceUser3 = await getBTCBalance(walletId3)

    expect(paid).toBe(PaymentSendStatus.Success)
    expect(finalBalanceUser12).toBe(0)
    expect(finalBalanceUser3).toBe(initialBalanceUser3 + initialBalanceUser12)

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: walletId12,
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
      expect(settledTx.settlementAmount).toBe(-initialBalanceUser12)
      expect(settledTx.settlementUsdPerSat).toBeGreaterThan(0)

      const finalBalance = await getBTCBalance(walletId12)
      expect(finalBalance).toBe(0)
    }
  })

  it("fails if try to send a transaction to self", async () => {
    const address = await Wallets.createOnChainAddress(walletId0)
    if (address instanceof Error) throw address

    const status = await Wallets.payOnChainByWalletId({
      senderAccount: account0,
      senderWalletId: walletId0,
      address,
      amount,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })
    expect(status).toBeInstanceOf(SelfPaymentError)
  })

  it("fails if an on us payment has insufficient balance", async () => {
    const address = await Wallets.createOnChainAddress(walletId3)
    if (address instanceof Error) throw address

    const initialBalanceUser11 = await getBTCBalance(walletId11)
    const senderAccount = await getAccountByTestUserIndex(11)

    const status = await Wallets.payOnChainByWalletId({
      senderAccount,
      senderWalletId: walletId11,
      address,
      amount: initialBalanceUser11 + 1,
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
    const initialBalanceUser1 = await getBTCBalance(walletId1)

    const status = await Wallets.payOnChainByWalletId({
      senderAccount: account1,
      senderWalletId: walletId1,
      address,
      amount: initialBalanceUser1,
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
      senderAccount: account0,
      senderWalletId: walletId0,
      address,
      amount,
      targetConfirmations,
      memo: null,
      sendAll: false,
    })
    expect(status).toBeInstanceOf(InvalidSatoshiAmount)
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
          accounts: toLiabilitiesWalletId(walletId0),
          type: { $ne: "on_us" },
          timestamp: { $gte: timestampYesterday },
        },
      },
      { $group: { _id: null, outgoingSats: { $sum: "$debit" } } },
    ])
    const { outgoingSats } = result || { outgoingSats: 0 }

    if (!user0.level) throw new Error("Invalid user level")

    const userLimits = getUserLimits({ level: user0.level })
    const amount = userLimits.withdrawalLimit - outgoingSats + 1

    const status = await Wallets.payOnChainByWalletId({
      senderAccount: account0,
      senderWalletId: walletId0,
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
      senderAccount: account0,
      senderWalletId: walletId0,
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
      enable2FA(userId0)

      const remainingLimit = await getRemainingTwoFALimit(walletId0)
      expect(remainingLimit).not.toBeInstanceOf(Error)
      if (remainingLimit instanceof Error) return remainingLimit

      const status = await Wallets.payOnChainByWalletIdWithTwoFA({
        senderAccount: account0,
        senderWalletId: walletId0,
        address: RANDOM_ADDRESS,
        amount: remainingLimit + 1,
        targetConfirmations,
        memo: null,
        sendAll: false,
        twoFAToken: "" as TwoFAToken,
      })

      expect(status).toBeInstanceOf(TwoFANewCodeNeededError)
    })

    it("sends a successful large payment with a 2fa code", async () => {
      await enable2FA(userId0)

      const initialBalance = await getBTCBalance(walletId0)
      const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })
      const twoFAToken = generateTokenHelper(user0.twoFA.secret)
      const amount = user0.twoFA.threshold + 1
      const paid = await Wallets.payOnChainByWalletIdWithTwoFA({
        senderAccount: account0,
        senderWalletId: walletId0,
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
        walletId: walletId0,
      })

      if (error instanceof Error || txs === null) {
        throw error
      }

      // settlementAmount is negative
      const expectedBalance = initialBalance + txs[0].settlementAmount
      const finalBalance = await getBTCBalance(walletId0)
      expect(expectedBalance).toBe(finalBalance)
    })
  })
})
