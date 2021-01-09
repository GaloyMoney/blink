import { brokerLndPath, customerPath, lndAccountingPath } from "../ledger"
import { MainBook, setupMongoConnection, User } from "../mongodb"
import { rebalance } from "../transaction"
import { onUsPayment, accountingLndPayment, accountingLndReceipt } from "../transaction"
import { UserWallet } from "../wallet"
import { WalletFactory } from "../walletFactory"
import { baseLogger } from "../utils";


let mongoose

let walletBTC, walletUSD

beforeAll(async () => {
  mongoose = await setupMongoConnection()
});

beforeEach(async () => {
  walletBTC = await WalletFactory({user: new User(fullBTCmeta), logger: baseLogger})
  walletUSD = await WalletFactory({user: new User(fullUSDmeta), logger: baseLogger})

  // FIXME: price is set twice. override the price by wallet factory
  UserWallet.setCurrentPrice(0.0001) // sats/USD. BTC at 10k
})

afterEach(async () => {
  await mongoose.connection.db.dropCollection("medici_journals")
  await mongoose.connection.db.dropCollection("medici_transactions")
})

const expectBalance = async ({account, currency, balance}) => {
  const { balance: balanceResult } = await MainBook.balance({
    account,
    currency
  })
  expect(balanceResult).toBe(balance)
}

const fullBTCmeta = {currencies: [{id: "BTC", pct: 1}], phone: "1234"}
const fullUSDmeta = {currencies: [{id: "USD", pct: 1}], phone: "2345"}
const _5050meta = {currencies: [{id: "USD", pct: .5}, {id: "BTC", pct: .5}]}



const walletBTC2: any = {
  user: new User(fullBTCmeta),
}
walletBTC2.accountPath = customerPath(walletBTC2.user._id)

const walletUSD2: any = {
  user: new User(fullUSDmeta),
}
walletUSD2.accountPath = customerPath(walletUSD2.user._id)

const wallet5050: any = {
  user: new User(_5050meta),
}
wallet5050.accountPath = customerPath(wallet5050.user._id)


describe('receipt', () => {

  it('btcReceiptToLnd', async () => {
  
    const user = walletBTC
  
    await accountingLndReceipt({
      description: "transaction test",
      payee: user,
      metadata: { type: "invoice" },
      sats: 1000,
    })
  
    await expectBalance({account: user.accountPath, currency: "BTC", balance: -1000})
    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: 1000})
  })

  it('usd receipt to lnd', async () => {
  
    const user = walletUSD
  
    await accountingLndReceipt({
      description: "transaction test",
      payee: user,
      metadata: { type: "invoice" },
      sats: 1000,
    })
  
    await expectBalance({account: user.accountPath, currency: "BTC", balance: 0})
    await expectBalance({account: await brokerLndPath(), currency: "BTC", balance: -1000})
    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: 1000})

    await expectBalance({account: user.accountPath, currency: "USD", balance: -0.10})
    await expectBalance({account: await brokerLndPath(), currency: "USD", balance: 0.10})
  })

  it('50/50 usd/btc receipt to lnd', async () => {
  
    const user = wallet5050

    await accountingLndReceipt({
      description: "transaction test",
      payee: user,
      metadata: { type: "invoice" },
      sats: 1000,
    })
  
    await expectBalance({account: user.accountPath, currency: "BTC", balance: -500})
    await expectBalance({account: await brokerLndPath(), currency: "BTC", balance: -500})
    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: 1000})

    await expectBalance({account: user.accountPath, currency: "USD", balance: -0.05})
    await expectBalance({account: await brokerLndPath(), currency: "USD", balance: 0.05})
  })
})




describe('send outside', () => {

  it('btc send on lightning', async () => {
  
    const user = walletBTC
  
    await accountingLndPayment({
      description: "transaction test",
      payer: user,
      sats: 1000,
      metadata: {type: "payment", pending: true}
    })
  
    await expectBalance({account: user.accountPath, currency: "BTC", balance: 1000})
    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: -1000})
  })

  it('btcSendFromUsdOnLightning', async () => {

    const user = walletUSD
  
    await accountingLndPayment({
      description: "transaction test",
      payer: user,
      sats: 1000,
      metadata: {type: "payment", pending: true}
    })
  
    await expectBalance({account: await brokerLndPath(), currency: "BTC", balance: 1000})
    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: -1000})

    await expectBalance({account: await brokerLndPath(), currency: "USD", balance: - 0.1})
    await expectBalance({account: user.accountPath, currency: "USD", balance: 0.1})
  })

  it('btcSend5050', async () => {
    
    const user = wallet5050

    await accountingLndPayment({
      description: "transaction test",
      payer: user,
      sats: 1000,
      metadata: {type: "payment", pending: true}
    })
  
    await expectBalance({account: await brokerLndPath(), currency: "BTC", balance: 500})
    await expectBalance({account: user.accountPath, currency: "BTC", balance: 500})

    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: -1000})

    await expectBalance({account: await brokerLndPath(), currency: "USD", balance: - 0.05})
    await expectBalance({account: user.accountPath, currency: "USD", balance: 0.05})
  })

})


describe('on us payment', () => {

  it('onUsBtcOnly', async () => {
  
    const payer = walletBTC
    const payee = walletBTC2
  
    await onUsPayment({
      description: "desc",
      sats: 1000,
      metadata: {type: "on_us"},
      payer,
      payeeUser: payee.user,
      memoPayer: null
    })
  
    await expectBalance({account: payer.accountPath, currency: "BTC", balance: 1000})
    await expectBalance({account: payee.accountPath, currency: "BTC", balance: -1000})
    await expectBalance({account: payer.accountPath, currency: "USD", balance: 0})
    await expectBalance({account: payee.accountPath, currency: "USD", balance: 0})
  })

  it('onUsUSDOnly', async () => {
  
    const payer = walletUSD
    const payee = walletUSD2
  
    await onUsPayment({
      description: "desc",
      sats: 1000,
      metadata: {type: "on_us"},
      payer,
      payeeUser: payee.user,
      memoPayer: null
    })
  
    await expectBalance({account: payer.accountPath, currency: "USD", balance: 0.1})
    await expectBalance({account: payee.accountPath, currency: "USD", balance: -0.1})
    await expectBalance({account: payer.accountPath, currency: "BTC", balance: 0})
    await expectBalance({account: payee.accountPath, currency: "BTC", balance: 0})
  })

  it('onUsBtcToUSD', async () => {
  
    const payer = walletBTC
    const payee = walletUSD
  
    await onUsPayment({
      description: "desc",
      sats: 1000,
      metadata: {type: "on_us"},
      payer,
      payeeUser: payee.user,
      memoPayer: null
    })
  
    await expectBalance({account: payer.accountPath, currency: "BTC", balance: 1000})
    await expectBalance({account: await brokerLndPath(), currency: "BTC", balance: -1000})
    await expectBalance({account: payer.accountPath, currency: "USD", balance: 0})
    
    await expectBalance({account: await brokerLndPath(), currency: "USD", balance: 0.1})
    await expectBalance({account: payee.accountPath, currency: "USD", balance: -0.1})
    await expectBalance({account: payee.accountPath, currency: "BTC", balance: 0})
  })

  it('onUsBtcTo5050', async () => {
  
    const payer = walletBTC
    const payee = wallet5050
  
    await onUsPayment({
      description: "desc",
      sats: 1000,
      metadata: {type: "on_us"},
      payer,
      payeeUser: payee.user,
      memoPayer: null
    })
  
    await expectBalance({account: payer.accountPath, currency: "BTC", balance: 1000})
    await expectBalance({account: await brokerLndPath(), currency: "BTC", balance: -500})
    await expectBalance({account: payee.accountPath, currency: "BTC", balance: -500})
    await expectBalance({account: payer.accountPath, currency: "USD", balance: 0})
    
    await expectBalance({account: await brokerLndPath(), currency: "USD", balance: 0.05})
    await expectBalance({account: payee.accountPath, currency: "USD", balance: -0.05})
  })

  it('onUs5050ToBtc', async () => {
  
    const payer = wallet5050
    const payee = walletBTC
  
    await onUsPayment({
      description: "desc",
      sats: 1000,
      metadata: {type: "on_us"},
      payer,
      payeeUser: payee.user,
      memoPayer: null
    })
  
    await expectBalance({account: payer.accountPath, currency: "BTC", balance: 500})

    await expectBalance({account: payer.accountPath, currency: "USD", balance: 0.05})
    await expectBalance({account: await brokerLndPath(), currency: "USD", balance: -0.05})
    await expectBalance({account: await brokerLndPath(), currency: "BTC", balance: 500})

    await expectBalance({account: payee.accountPath, currency: "BTC", balance: -1000})
    await expectBalance({account: payee.accountPath, currency: "USD", balance: 0})
  })


  it('onUsUsdTo5050', async () => {
  
    const payer = walletUSD
    const payee = wallet5050
  
    await onUsPayment({
      description: "desc",
      sats: 1000,
      metadata: {type: "on_us"},
      payer,
      payeeUser: payee.user,
      memoPayer: null
    })
  
    await expectBalance({account: payer.accountPath, currency: "BTC", balance: 0})
    await expectBalance({account: payer.accountPath, currency: "USD", balance: 0.1})

    await expectBalance({account: await brokerLndPath(), currency: "USD", balance: -0.05})
    await expectBalance({account: await brokerLndPath(), currency: "BTC", balance: 500})

    await expectBalance({account: payee.accountPath, currency: "BTC", balance: -500})
    await expectBalance({account: payee.accountPath, currency: "USD", balance: -0.05})
  })


  it('onUs5050ToUsd', async () => {
  
    const payer = wallet5050
    const payee = walletUSD
  
    await onUsPayment({
      description: "desc",
      sats: 1000,
      metadata: {type: "on_us"},
      payer,
      payeeUser: payee.user,
      memoPayer: null
    })
  
    await expectBalance({account: payer.accountPath, currency: "BTC", balance: 500})
    await expectBalance({account: payer.accountPath, currency: "USD", balance: 0.05})

    await expectBalance({account: await brokerLndPath(), currency: "USD", balance: 0.05})
    await expectBalance({account: await brokerLndPath(), currency: "BTC", balance: -500})

    await expectBalance({account: payee.accountPath, currency: "BTC", balance: 0})
    await expectBalance({account: payee.accountPath, currency: "USD", balance: -0.1})
  })

})

describe('rebalance', () => {

  it('BtcNoOp', async () => {

    const wallet = walletBTC
  
    await accountingLndReceipt({
      description: "first tx to have a balance",
      payee: walletBTC,
      metadata: { type: "invoice" },
      sats: 1000,
    })

    await expectBalance({account: wallet.accountPath, currency: "BTC", balance: -1000})
    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: 1000})

    await rebalance({
      description: "rebalance",
      metadata: {type: "user_rebalance"},
      wallet,
    })

    await expectBalance({account: wallet.accountPath, currency: "BTC", balance: -1000})
    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: 1000})

  })

  it('Btcto5050', async () => {

    const wallet = walletBTC
  
    await accountingLndReceipt({
      description: "first tx to have a balance",
      payee: wallet,
      metadata: { type: "invoice" },
      sats: 1000,
    })

    await expectBalance({account: wallet.accountPath, currency: "BTC", balance: -1000})
    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: 1000})

    wallet.user.currencies = _5050meta.currencies
    const error = wallet.user.validateSync()
    expect(error).toBeFalsy()

    await rebalance({
      description: "rebalance",
      metadata: {type: "user_rebalance"},
      wallet,
    })

    await expectBalance({account: wallet.accountPath, currency: "BTC", balance: -500})
    await expectBalance({account: wallet.accountPath, currency: "USD", balance: -0.05})

    await expectBalance({account: await brokerLndPath(), currency: "BTC", balance: -500})
    await expectBalance({account: await brokerLndPath(), currency: "USD", balance: 0.05})
    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: 1000})

  })

  it('Usdto5050', async () => {

    const wallet = walletUSD
  
    await accountingLndReceipt({
      description: "first tx to have a balance",
      payee: wallet,
      metadata: { type: "invoice" },
      sats: 1000,
    })

    await expectBalance({account: wallet.accountPath, currency: "BTC", balance: 0})
    await expectBalance({account: await brokerLndPath(), currency: "BTC", balance: -1000})
    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: 1000})

    await expectBalance({account: wallet.accountPath, currency: "USD", balance: -0.10})
    await expectBalance({account: await brokerLndPath(), currency: "USD", balance: 0.10})

    wallet.user.currencies = _5050meta.currencies
    const error = wallet.user.validateSync()
    expect(error).toBeFalsy()

    await rebalance({
      description: "rebalance",
      metadata: {type: "user_rebalance"},
      wallet,
    })

    await expectBalance({account: wallet.accountPath, currency: "BTC", balance: -500})
    await expectBalance({account: wallet.accountPath, currency: "USD", balance: -0.05})

    await expectBalance({account: await brokerLndPath(), currency: "BTC", balance: -500})
    await expectBalance({account: await brokerLndPath(), currency: "USD", balance: 0.05})
    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: 1000})

  })
})