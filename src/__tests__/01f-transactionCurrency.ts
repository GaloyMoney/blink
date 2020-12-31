import { brokerLndPath, customerPath, lndAccountingPath } from "../ledger"
import { MainBook, setupMongoConnection, User } from "../mongodb"
import { onUsPayment, payLnd, receiptLnd } from "../transaction"
import { UserWallet } from "../wallet"

UserWallet.setCurrentPrice(0.0001) // sats/USD. BTC at 10k

let mongoose

beforeAll(async () => {
  mongoose = await setupMongoConnection()
});

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


const walletBTC: any = {
  user: new User({currencies: [{id: "BTC", pct: 1}]}),
}
walletBTC.accountPath = customerPath(walletBTC.user._id)

const walletBTC2: any = {
  user: new User({currencies: [{id: "BTC", pct: 1}]}),
}
walletBTC2.accountPath = customerPath(walletBTC2.user._id)

const walletUSD: any = {
  user: new User({currencies: [{id: "USD", pct: 1}]}),
}
walletUSD.accountPath = customerPath(walletUSD.user._id)

const walletUSD2: any = {
  user: new User({currencies: [{id: "USD", pct: 1}]}),
}
walletUSD2.accountPath = customerPath(walletUSD2.user._id)

const wallet5050: any = {
  user: new User({ currencies: [{id: "USD", pct: .5}, {id: "BTC", pct: .5}]}),
}
wallet5050.accountPath = customerPath(wallet5050.user._id)


describe('receipt', () => {

  it('btcReceiptToLnd', async () => {
  
    const user = walletBTC
  
    await receiptLnd({
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
  
    await receiptLnd({
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

    await receiptLnd({
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
  
    await payLnd({
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
  
    await payLnd({
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

    await payLnd({
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
