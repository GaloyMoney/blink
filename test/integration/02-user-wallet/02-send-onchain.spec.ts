import { once } from "events"

import * as Wallets from "@app/wallets"
import {
  getFeeRates,
  getOnChainWalletConfig,
  getUserLimits,
  MS_PER_DAY,
} from "@config/app"
import { TransactionRestrictedError, TwoFAError } from "@core/error"
import { toTargetConfs } from "@domain/bitcoin"
import { LedgerTransactionType } from "@domain/ledger"
import { NotificationType } from "@domain/notifications"
import { PaymentInitiationMethod, SettlementMethod, TxStatus } from "@domain/wallets"
import { onchainTransactionEventHandler } from "@servers/trigger"
import { baseLogger } from "@services/logger"
import { Transaction } from "@services/mongoose/schema"
import { getTitle } from "@services/notifications/payment"
import { sleep } from "@utils"
import last from "lodash.last"

import {
  bitcoindClient,
  bitcoindOutside,
  checkIsBalanced,
  createChainAddress,
  createMandatoryUsers,
  enable2FA,
  generateTokenHelper,
  getAndCreateUserWallet,
  getDefaultWalletIdByTestUserIndex,
  getUserIdByTestUserIndex,
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

let initialBalanceUser0
let userWallet0, userWallet3, userWallet11, userWallet12 // using userWallet11 and userWallet12 to sendAll

let wallet0: WalletId
let user0: UserId

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { sendNotification } = require("@services/notifications/notification")

beforeAll(async () => {
  userWallet0 = await getAndCreateUserWallet(0)
  wallet0 = await getDefaultWalletIdByTestUserIndex(0)
  user0 = await getUserIdByTestUserIndex(0)

  userWallet3 = await getAndCreateUserWallet(3)
  userWallet11 = await getAndCreateUserWallet(11)
  userWallet12 = await getAndCreateUserWallet(12)

  await createMandatoryUsers()

  await bitcoindClient.loadWallet({ filename: "outside" })
})

beforeEach(async () => {
  initialBalanceUser0 = await getBTCBalance(wallet0)
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
      userWallet0.onChainPay({ address, amount, targetConfirmations }),
    ])

    expect(results[1]).toBeTruthy()
    await onchainTransactionEventHandler(results[0][0])

    // we don't send a notification for send transaction for now
    // expect(sendNotification.mock.calls.length).toBe(1)
    // expect(sendNotification.mock.calls[0][0].data.type).toBe(NotificationType.OnchainPayment)
    // expect(sendNotification.mock.calls[0][0].data.title).toBe(`Your transaction has been sent. It may takes some time before it is confirmed`)

    let pendingTxHash: OnChainTxHash

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: wallet0,
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

      const interimBalance = await getBTCBalance(wallet0)
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
    expect(sendNotification.mock.calls[0][0].user._id).toStrictEqual(userWallet0.user._id)
    expect(sendNotification.mock.calls[0][0].data.type).toBe(
      NotificationType.OnchainPayment,
    )

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: wallet0,
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

      const finalBalance = await getBTCBalance(wallet0)
      expect(finalBalance).toBe(initialBalanceUser0 - amount - fee)
    }

    sub.removeAllListeners()
  })

  it("sends all in a successful payment", async () => {
    const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })

    const sub = subscribeToTransactions({ lnd: lndonchain })
    sub.on("chain_transaction", onchainTransactionEventHandler)

    const initialBalanceUser11 = await getBTCBalance(userWallet11.user.walletId)

    const results = await Promise.all([
      once(sub, "chain_transaction"),
      userWallet11.onChainPay({ address, amount: 0, sendAll: true, targetConfirmations }),
    ])

    expect(results[1]).toBeTruthy()
    await onchainTransactionEventHandler(results[0][0])

    // we don't send a notification for send transaction for now
    // expect(sendNotification.mock.calls.length).toBe(1)
    // expect(sendNotification.mock.calls[0][0].data.type).toBe(NotificationType.OnchainPayment)
    // expect(sendNotification.mock.calls[0][0].data.title).toBe(`Your transaction has been sent. It may takes some time before it is confirmed`)

    let pendingTxHash

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: userWallet11.user.walletId,
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

      const interimBalance = await getBTCBalance(userWallet11.user.walletId)
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
        walletId: userWallet11.user.walletId,
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

      const finalBalance = await getBTCBalance(userWallet11.user.walletId)
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
    const paymentResult = await userWallet0.onChainPay({
      address,
      amount,
      memo,
      targetConfirmations,
    })
    expect(paymentResult).toBe(true)
    const { result: txs, error } = await Wallets.getTransactionsForWalletId({
      walletId: wallet0,
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
        walletId: wallet0,
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
    const address = await Wallets.createOnChainAddress(userWallet3.user.walletId)
    if (address instanceof Error) throw address

    const initialBalanceUser3 = await getBTCBalance(userWallet3.user.walletId)

    const paid = await userWallet0.onChainPay({ address, amount, targetConfirmations })

    const finalBalanceUser0 = await getBTCBalance(wallet0)
    const finalBalanceUser3 = await getBTCBalance(userWallet3.user.walletId)

    expect(paid).toBe(true)
    expect(finalBalanceUser0).toBe(initialBalanceUser0 - amount)
    expect(finalBalanceUser3).toBe(initialBalanceUser3 + amount)

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: wallet0,
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

      const finalBalance = await getBTCBalance(wallet0)
      expect(finalBalance).toBe(initialBalanceUser0 - amount)
    }
  })

  it("sends an on us transaction with memo", async () => {
    const memo = "this is my onchain memo"

    const address = await Wallets.createOnChainAddress(userWallet3.user.walletId)
    if (address instanceof Error) throw address

    const paid = await userWallet0.onChainPay({
      address,
      amount,
      memo,
      targetConfirmations,
    })

    expect(paid).toBe(true)

    const matchTx = (tx: WalletTransaction) =>
      tx.initiationVia.type === PaymentInitiationMethod.OnChain &&
      tx.deprecated.type === LedgerTransactionType.OnchainIntraLedger &&
      tx.initiationVia.address === address

    const { result: txs, error } = await Wallets.getTransactionsForWalletId({
      walletId: wallet0,
    })
    if (error instanceof Error || txs === null) {
      throw error
    }
    const filteredTxs = txs.filter(matchTx)
    expect(filteredTxs.length).toBe(1)
    expect(filteredTxs[0].deprecated.description).toBe(memo)

    // receiver should not know memo from sender
    const { result: txsUser3, error: error2 } = await Wallets.getTransactionsForWalletId({
      walletId: userWallet3.user.walletId as WalletId,
    })
    if (error2 instanceof Error || txsUser3 === null) {
      throw error2
    }
    const filteredTxsUser3 = txsUser3.filter(matchTx)
    expect(filteredTxsUser3.length).toBe(1)
    expect(filteredTxsUser3[0].deprecated.description).not.toBe(memo)
  })

  it("sends all with an on us transaction", async () => {
    const initialBalanceUser12 = await getBTCBalance(userWallet12.user.walletId)

    const address = await Wallets.createOnChainAddress(userWallet3.user.walletId)
    if (address instanceof Error) throw address

    const initialBalanceUser3 = await getBTCBalance(userWallet3.user.walletId)

    const paid = await userWallet12.onChainPay({
      address,
      amount: 0,
      sendAll: true,
      targetConfirmations,
    })

    const finalBalanceUser12 = await getBTCBalance(userWallet12.user.walletId)
    const finalBalanceUser3 = await getBTCBalance(userWallet3.user.walletId)

    expect(paid).toBe(true)
    expect(finalBalanceUser12).toBe(0)
    expect(finalBalanceUser3).toBe(initialBalanceUser3 + initialBalanceUser12)

    {
      const txResult = await Wallets.getTransactionsForWalletId({
        walletId: userWallet12.user.walletId,
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

      const finalBalance = await getBTCBalance(userWallet12.user.walletId)
      expect(finalBalance).toBe(0)
    }
  })

  it("fails if try to send a transaction to self", async () => {
    const address = await Wallets.createOnChainAddress(wallet0)
    if (address instanceof Error) throw address

    await expect(
      userWallet0.onChainPay({ address, amount, targetConfirmations }),
    ).rejects.toThrow()
  })

  it("fails if an on us payment has insufficient balance", async () => {
    const address = await Wallets.createOnChainAddress(userWallet3.user.walletId)
    if (address instanceof Error) throw address
    await expect(
      userWallet0.onChainPay({
        address,
        amount: initialBalanceUser0 + 1,
        targetConfirmations,
      }),
    ).rejects.toThrow()
  })

  it("fails if has insufficient balance", async () => {
    const { address } = await createChainAddress({
      lnd: lndOutside1,
      format: "p2wpkh",
    })
    const initialBalanceUser3 = await getBTCBalance(userWallet3.user.walletId)

    //should fail because user does not have balance to pay for on-chain fee
    await expect(
      userWallet3.onChainPay({
        address,
        amount: initialBalanceUser3,
        targetConfirmations,
      }),
    ).rejects.toThrow()
  })

  it("fails if send all with a nonzero amount", async () => {
    const address = await Wallets.createOnChainAddress(userWallet3.user.walletId)
    if (address instanceof Error) throw address

    await expect(
      userWallet0.onChainPay({ address, amount, sendAll: true, targetConfirmations }),
    ).rejects.toThrow()
  })

  it("fails if has negative amount", async () => {
    const amount = -1000
    const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })
    await expect(
      userWallet0.onChainPay({ address, amount, targetConfirmations }),
    ).rejects.toThrow()
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
          accounts: userWallet0.user.walletPath,
          type: { $ne: "on_us" },
          timestamp: { $gte: timestampYesterday },
        },
      },
      { $group: { _id: null, outgoingSats: { $sum: "$debit" } } },
    ])
    const { outgoingSats } = result || { outgoingSats: 0 }

    const userLimits = getUserLimits({ level: userWallet0.user.level })
    const amount = userLimits.withdrawalLimit - outgoingSats + 1

    await expect(
      userWallet0.onChainPay({ address, amount, targetConfirmations }),
    ).rejects.toThrow(TransactionRestrictedError)
  })

  it("fails if the amount is less than on chain dust amount", async () => {
    const address = await bitcoindOutside.getNewAddress()
    const onChainWalletConfig = getOnChainWalletConfig()
    expect(
      userWallet0.onChainPay({
        address,
        amount: onChainWalletConfig.dustThreshold - 1,
        targetConfirmations,
      }),
    ).rejects.toThrow()
  })

  describe("2FA", () => {
    it("fails to pay above 2fa limit without 2fa token", async () => {
      enable2FA(user0)

      const remainingLimit = await getRemainingTwoFALimit(wallet0)
      expect(remainingLimit).not.toBeInstanceOf(Error)
      if (remainingLimit instanceof Error) return remainingLimit

      expect(
        userWallet0.onChainPay({
          address: RANDOM_ADDRESS,
          amount: remainingLimit + 1,
          targetConfirmations,
        }),
      ).rejects.toThrowError(TwoFAError)
    })

    it("sends a successful large payment with a 2fa code", async () => {
      await enable2FA(user0)

      const initialBalance = await getBTCBalance(wallet0)
      const { address } = await createChainAddress({ format: "p2wpkh", lnd: lndOutside1 })
      const twoFAToken = generateTokenHelper(userWallet0.user.twoFA.secret)
      const amount = userWallet0.user.twoFA.threshold + 1
      const paid = await userWallet0.onChainPay({
        address,
        amount,
        twoFAToken,
        targetConfirmations,
      })

      expect(paid).toBe(true)

      await mineBlockAndSyncAll()
      const result = await Wallets.updateOnChainReceipt({ logger: baseLogger })
      if (result instanceof Error) {
        throw result
      }

      const { result: txs, error } = await Wallets.getTransactionsForWalletId({
        walletId: wallet0,
      })

      if (error instanceof Error || txs === null) {
        throw error
      }

      // settlementAmount is negative
      const expectedBalance = initialBalance + txs[0].settlementAmount
      const finalBalance = await getBTCBalance(wallet0)
      expect(expectedBalance).toBe(finalBalance)
    })
  })
})
