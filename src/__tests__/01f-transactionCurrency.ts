import { brokerLndPath, customerPath, lndAccountingPath } from "../ledger"
import { MainBook, setupMongoConnection, User } from "../mongodb"
import { payLnd, receiptLnd } from "../transaction"
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


const walletBTC = {
  user: new User({currencies: [{id: "BTC", pct: 1}]}),
  accountPath: customerPath("userBTC")
}

const walletUSD = {
  user: new User({currencies: [{id: "USD", pct: 1}]}),
  accountPath: customerPath("userUSD")
}

const wallet5050 = {
  user: new User({ currencies: [{id: "USD", pct: .5}, {id: "BTC", pct: .5}]}),
  accountPath: customerPath("user5050")
}


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


// it('on us payment', async () => {
  
  // const payer = {
  //   currencies: [{id: "BTC", pct: 1}],
  //   accountPath: customerPath("1234")
  // }
  // 
  // const payee = {
  //   currencies: [{id: "BTC", pct: 1}],
  //   accountPath: lndAccountingPath
  // }

// })