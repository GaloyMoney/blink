import { Prices } from "@app"
import { UserWallet } from "@core/user-wallet"
import { WalletFactory } from "@core/wallet-factory"
import { toSats } from "@domain/bitcoin"
import { LedgerTransactionType, toLiabilitiesWalletId } from "@domain/ledger"
import { DepositFeeCalculator } from "@domain/wallets"
import { LedgerService } from "@services/ledger"
import { MainBook } from "@services/ledger/books"
import { baseLogger } from "@services/logger"
import { ledger, setupMongoConnection } from "@services/mongodb"
import { User } from "@services/mongoose/schema"
import { clearAccountLocks } from "test/helpers/redis"

let mongoose

let fullWalletBTC, fullWalletUSD
let dealerPath, lndAccountingPath

beforeAll(async () => {
  await clearAccountLocks()
  mongoose = await setupMongoConnection()
  dealerPath = toLiabilitiesWalletId(await ledger.getDealerWalletId())
  lndAccountingPath = ledger.lndAccountingPath
})

afterAll(async () => {
  await mongoose.connection.close()
})

beforeEach(async () => {
  await mongoose.connection.db.dropCollection("medici_journals")
  await mongoose.connection.db.dropCollection("medici_transactions")

  fullWalletBTC = await WalletFactory({ user: new User(fullBTCmeta), logger: baseLogger })
  fullWalletUSD = await WalletFactory({ user: new User(fullUSDmeta), logger: baseLogger })

  // FIXME: price is set twice. override the price by wallet factory
  UserWallet.setCurrentPrice(0.0001) // sats/USD. BTC at 10k
})

// TODO: this is deprecated, but this file will be completely revamped with
// api v2 and USD integration so not making more work on this for now.
const getAccountBalance = async (account: string, query = {}) => {
  const params = { account, currency: "BTC", ...query }
  const { balance } = await MainBook.balance(params)
  return balance
}

const expectBalance = async ({ account, currency, balance }) => {
  baseLogger.warn({ currency, account }, "expectBalance")
  const balanceResult = await getAccountBalance(account, { currency })
  expect(balanceResult).toBe(balance)
}

const fullBTCmeta = { currencies: [{ id: "BTC", ratio: 1 }], phone: "1234" }
const fullUSDmeta = { currencies: [{ id: "USD", ratio: 1 }], phone: "2345" }
const _5050meta = {
  currencies: [
    { id: "USD", ratio: 0.5 },
    { id: "BTC", ratio: 0.5 },
  ],
}

const walletBTC2 = new User(fullBTCmeta)
const walletUSD2 = new User(fullUSDmeta)
const wallet5050 = new User(_5050meta)
const walletBTC = new User(fullBTCmeta)
const walletUSD = new User(fullUSDmeta)

describe("receipt via Ledger Service", () => {
  it("btc receive on lightning via ledger service", async () => {
    const price = await Prices.getCurrentPrice()
    expect(price).not.toBeInstanceOf(Error)
    if (price instanceof Error) throw price
    const fee = DepositFeeCalculator().lnDepositFee()

    const sats = toSats(1000)
    const usd = sats * price
    const usdFee = fee * price

    const result = await LedgerService().addLnTxReceive({
      walletId: walletBTC.walletId,
      paymentHash: "paymentHash" as PaymentHash,
      description: "transaction test",
      sats,
      fee,
      usd,
      usdFee,
    })
    expect(result).not.toBeInstanceOf(Error)

    await expectBalance({
      account: walletBTC.walletPath,
      currency: "BTC",
      balance: 1000,
    })
    await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: -1000 })
  })
})

describe("receipt", () => {
  it("btcReceiptToLnd", async () => {
    await ledger.addLndReceipt({
      description: "transaction test",
      payeeUser: walletBTC,
      metadata: { type: "invoice", pending: false },
      sats: 1000,
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({
      account: walletBTC.walletPath,
      currency: "BTC",
      balance: 1000,
    })
    await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: -1000 })
  })

  it("usd receipt to lnd", async () => {
    await ledger.addLndReceipt({
      description: "transaction test",
      payeeUser: walletUSD,
      metadata: { type: "invoice", pending: false },
      sats: 1000,
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({ account: walletUSD.walletPath, currency: "BTC", balance: 0 })
    await expectBalance({ account: dealerPath, currency: "BTC", balance: 1000 })
    await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: -1000 })

    await expectBalance({ account: walletUSD.walletPath, currency: "USD", balance: 0.1 })
    await expectBalance({ account: dealerPath, currency: "USD", balance: -0.1 })
  })

  it("50/50 usd/btc receipt to lnd", async () => {
    await ledger.addLndReceipt({
      description: "transaction test",
      payeeUser: wallet5050,
      metadata: { type: "invoice", pending: false },
      sats: 1000,
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({
      account: wallet5050.walletPath,
      currency: "BTC",
      balance: 500,
    })
    await expectBalance({ account: dealerPath, currency: "BTC", balance: 500 })
    await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: -1000 })

    await expectBalance({
      account: wallet5050.walletPath,
      currency: "USD",
      balance: 0.05,
    })
    await expectBalance({ account: dealerPath, currency: "USD", balance: -0.05 })
  })
})

describe("payment with lnd via Ledger Service", () => {
  it("btc send on lightning via ledger service", async () => {
    const price = await Prices.getCurrentPrice()
    expect(price).not.toBeInstanceOf(Error)
    if (price instanceof Error) throw price
    const fee = DepositFeeCalculator().lnDepositFee()

    const sats = toSats(1000)
    const usd = sats * price
    const usdFee = fee * price

    const result = await LedgerService().addLnTxSend({
      walletId: walletBTC.walletId,
      paymentHash: "paymentHash" as PaymentHash,
      description: "transaction test",
      sats,
      fee,
      usd,
      usdFee,
      pubkey: "pubkey" as Pubkey,
      feeKnownInAdvance: false,
    })
    expect(result).not.toBeInstanceOf(Error)

    await expectBalance({
      account: walletBTC.walletPath,
      currency: "BTC",
      balance: -1000,
    })
    await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: 1000 })
  })
})

describe("payment with lnd", () => {
  it("btc send on lightning", async () => {
    await ledger.addLndPayment({
      description: "transaction test",
      payerUser: walletBTC,
      sats: 1000,
      metadata: { type: "payment", pending: true },
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({
      account: walletBTC.walletPath,
      currency: "BTC",
      balance: -1000,
    })
    await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: 1000 })
  })

  it("btcSendFromUsdOnLightning", async () => {
    await ledger.addLndPayment({
      description: "transaction test",
      payerUser: walletUSD,
      sats: 1000,
      metadata: { type: "payment", pending: true },
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({ account: dealerPath, currency: "BTC", balance: -1000 })
    await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: 1000 })

    await expectBalance({ account: dealerPath, currency: "USD", balance: 0.1 })
    await expectBalance({
      account: walletUSD.walletPath,
      currency: "USD",
      balance: -0.1,
    })
  })

  it("btcSend5050", async () => {
    await ledger.addLndPayment({
      description: "transaction test",
      payerUser: wallet5050,
      sats: 1000,
      metadata: { type: "payment", pending: true },
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({ account: dealerPath, currency: "BTC", balance: -500 })
    await expectBalance({
      account: wallet5050.walletPath,
      currency: "BTC",
      balance: -500,
    })

    await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: 1000 })

    await expectBalance({ account: dealerPath, currency: "USD", balance: 0.05 })
    await expectBalance({
      account: wallet5050.walletPath,
      currency: "USD",
      balance: -0.05,
    })
  })
})

describe("on us payment via Ledger Service", () => {
  it("intraledger", async () => {
    const sender = walletBTC
    const recipient = walletBTC2

    const price = await Prices.getCurrentPrice()
    expect(price).not.toBeInstanceOf(Error)
    if (price instanceof Error) throw price
    const fee = DepositFeeCalculator().lnDepositFee()

    const sats = toSats(1000)
    const lnFee = toSats(0)
    const usd = sats * price
    const usdFee = fee * price

    const result = await LedgerService().addWalletIdIntraledgerTxSend({
      senderWalletId: sender.walletId,
      description: "desc",
      sats,
      fee: lnFee,
      usd,
      usdFee,
      recipientWalletId: recipient.walletId,
      payerUsername: "payerUsername" as Username,
      recipientUsername: "recipientUsername" as Username,
      memoPayer: null,
    })
    if (result instanceof Error) throw result

    for (const txId of result.transactionIds) {
      const tx = await LedgerService().getTransactionById(txId)
      if (tx instanceof Error) throw tx
      expect(tx.type).toBe(LedgerTransactionType.IntraLedger)
    }
    await expectBalance({ account: sender.walletPath, currency: "BTC", balance: -1000 })
    await expectBalance({ account: recipient.walletPath, currency: "BTC", balance: 1000 })
  })
})

describe("on us payment", () => {
  it("onUsBtcOnly", async () => {
    const payer = walletBTC
    const payee = walletBTC2

    await ledger.addOnUsPayment({
      description: "desc",
      sats: 1000,
      metadata: { type: "on_us", pending: false },
      payerUser: payer,
      payeeUser: payee,
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({ account: payer.walletPath, currency: "BTC", balance: -1000 })
    await expectBalance({ account: payee.walletPath, currency: "BTC", balance: 1000 })
    await expectBalance({ account: payer.walletPath, currency: "USD", balance: 0 })
    await expectBalance({ account: payee.walletPath, currency: "USD", balance: 0 })
  })

  it("onUsUSDOnly", async () => {
    const payer = walletUSD
    const payee = walletUSD2

    await ledger.addOnUsPayment({
      description: "desc",
      sats: 1000,
      metadata: { type: "on_us", pending: false },
      payerUser: payer,
      payeeUser: payee,
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({ account: payer.walletPath, currency: "USD", balance: -0.1 })
    await expectBalance({ account: payee.walletPath, currency: "USD", balance: 0.1 })
    await expectBalance({ account: payer.walletPath, currency: "BTC", balance: 0 })
    await expectBalance({ account: payee.walletPath, currency: "BTC", balance: 0 })
  })

  it("onUsBtcToUSD", async () => {
    const payer = walletBTC
    const payee = walletUSD

    await ledger.addOnUsPayment({
      description: "desc",
      sats: 1000,
      metadata: { type: "on_us", pending: false },
      payerUser: payer,
      payeeUser: payee,
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({ account: payer.walletPath, currency: "BTC", balance: -1000 })
    await expectBalance({ account: dealerPath, currency: "BTC", balance: 1000 })
    await expectBalance({ account: payee.walletPath, currency: "BTC", balance: 0 })

    await expectBalance({ account: payer.walletPath, currency: "USD", balance: 0 })
    await expectBalance({ account: dealerPath, currency: "USD", balance: -0.1 })
    await expectBalance({ account: payee.walletPath, currency: "USD", balance: 0.1 })
  })

  it("onUsBtcTo5050", async () => {
    const payer = walletBTC
    const payee = wallet5050

    await ledger.addOnUsPayment({
      description: "desc",
      sats: 1000,
      metadata: { type: "on_us", pending: false },
      payerUser: payer,
      payeeUser: payee,
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({ account: payer.walletPath, currency: "BTC", balance: -1000 })
    await expectBalance({ account: dealerPath, currency: "BTC", balance: 500 })
    await expectBalance({ account: payee.walletPath, currency: "BTC", balance: 500 })
    await expectBalance({ account: payer.walletPath, currency: "USD", balance: 0 })

    await expectBalance({ account: dealerPath, currency: "USD", balance: -0.05 })
    await expectBalance({ account: payee.walletPath, currency: "USD", balance: 0.05 })
  })

  it("onUs5050ToBtc", async () => {
    const payer = wallet5050
    const payee = walletBTC

    await ledger.addOnUsPayment({
      description: "desc",
      sats: 1000,
      metadata: { type: "on_us", pending: false },
      payerUser: payer,
      payeeUser: payee,
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({ account: payer.walletPath, currency: "BTC", balance: -500 })

    await expectBalance({ account: payer.walletPath, currency: "USD", balance: -0.05 })
    await expectBalance({ account: dealerPath, currency: "USD", balance: 0.05 })
    await expectBalance({ account: dealerPath, currency: "BTC", balance: -500 })

    await expectBalance({ account: payee.walletPath, currency: "BTC", balance: 1000 })
    await expectBalance({ account: payee.walletPath, currency: "USD", balance: 0 })
  })

  it("onUsUsdTo5050", async () => {
    const payer = walletUSD
    const payee = wallet5050

    await ledger.addOnUsPayment({
      description: "desc",
      sats: 1000,
      metadata: { type: "on_us", pending: false },
      payerUser: payer,
      payeeUser: payee,
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({ account: payer.walletPath, currency: "BTC", balance: 0 })
    await expectBalance({ account: payer.walletPath, currency: "USD", balance: -0.1 })

    await expectBalance({ account: dealerPath, currency: "USD", balance: 0.05 })
    await expectBalance({ account: dealerPath, currency: "BTC", balance: -500 })

    await expectBalance({ account: payee.walletPath, currency: "BTC", balance: 500 })
    await expectBalance({ account: payee.walletPath, currency: "USD", balance: 0.05 })
  })

  it("onUs5050ToUsd", async () => {
    const payer = wallet5050
    const payee = walletUSD

    await ledger.addOnUsPayment({
      description: "desc",
      sats: 1000,
      metadata: { type: "on_us", pending: false },
      payerUser: payer,
      payeeUser: payee,
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({ account: payer.walletPath, currency: "BTC", balance: -500 })
    await expectBalance({ account: payer.walletPath, currency: "USD", balance: -0.05 })

    await expectBalance({ account: dealerPath, currency: "USD", balance: -0.05 })
    await expectBalance({ account: dealerPath, currency: "BTC", balance: 500 })

    await expectBalance({ account: payee.walletPath, currency: "BTC", balance: 0 })
    await expectBalance({ account: payee.walletPath, currency: "USD", balance: 0.1 })
  })
})

describe("rebalancePortfolio", () => {
  it("BtcNoOp", async () => {
    const wallet = fullWalletBTC

    await ledger.addLndReceipt({
      description: "first tx to have a balance",
      payeeUser: wallet.user,
      metadata: { type: "invoice", pending: false },
      sats: 1000,
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({
      account: wallet.user.walletPath,
      currency: "BTC",
      balance: 1000,
    })
    await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: -1000 })

    await ledger.rebalancePortfolio({
      description: "rebalancePortfolio",
      metadata: { type: "user_rebalance" },
      wallet,
    })

    await expectBalance({
      account: wallet.user.walletPath,
      currency: "BTC",
      balance: 1000,
    })
    await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: -1000 })
  })

  it("Btcto5050", async () => {
    const wallet = fullWalletBTC

    await ledger.addLndReceipt({
      description: "first tx to have a balance",
      payeeUser: wallet.user,
      metadata: { type: "invoice", pending: false },
      sats: 1000,
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({
      account: wallet.user.walletPath,
      currency: "BTC",
      balance: 1000,
    })
    await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: -1000 })

    wallet.user.currencies = _5050meta.currencies
    const error = wallet.user.validateSync()
    expect(error).toBeFalsy()

    await ledger.rebalancePortfolio({
      description: "rebalancePortfolio",
      metadata: { type: "user_rebalance", pending: false },
      wallet,
    })

    await expectBalance({
      account: wallet.user.walletPath,
      currency: "BTC",
      balance: 500,
    })
    await expectBalance({
      account: wallet.user.walletPath,
      currency: "USD",
      balance: 0.05,
    })

    await expectBalance({ account: dealerPath, currency: "BTC", balance: 500 })
    await expectBalance({ account: dealerPath, currency: "USD", balance: -0.05 })
    await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: -1000 })
  })

  it("Usdto5050", async () => {
    const wallet = fullWalletUSD

    await ledger.addLndReceipt({
      description: "first tx to have a balance",
      payeeUser: wallet.user,
      metadata: { type: "invoice", pending: false },
      sats: 1000,
      lastPrice: UserWallet.lastPrice,
    })

    await expectBalance({ account: wallet.user.walletPath, currency: "BTC", balance: 0 })
    await expectBalance({ account: dealerPath, currency: "BTC", balance: 1000 })
    await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: -1000 })

    await expectBalance({
      account: wallet.user.walletPath,
      currency: "USD",
      balance: 0.1,
    })
    await expectBalance({ account: dealerPath, currency: "USD", balance: -0.1 })

    wallet.user.currencies = _5050meta.currencies
    const error = wallet.user.validateSync()
    expect(error).toBeFalsy()

    // need a way to reliably get a USD balance.
    // TODO(nicolas): will work on getting this back properly after v1 core deletion

    // await ledger.rebalancePortfolio({
    //   description: "rebalancePortfolio",
    //   metadata: { type: "user_rebalance", pending: false },
    //   wallet,
    // })

    // await expectBalance({
    //   account: wallet.user.walletPath,
    //   currency: "BTC",
    //   balance: 500,
    // })
    // await expectBalance({
    //   account: wallet.user.walletPath,
    //   currency: "USD",
    //   balance: 0.05,
    // })

    // await expectBalance({ account: dealerPath, currency: "BTC", balance: 500 })
    // await expectBalance({ account: dealerPath, currency: "USD", balance: -0.05 })
    // await expectBalance({ account: lndAccountingPath, currency: "BTC", balance: -1000 })
  })
})
