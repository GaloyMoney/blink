import { brokerLndPath, customerPath, lndAccountingPath } from "../ledger"
import { MainBook, setupMongoConnection } from "../mongodb"
import { receiptLnd } from "../transaction"
import { UserWallet } from "../wallet"

UserWallet.updatePrice(0.0001) // sats/USD. BTC at 10k

let mongoose

beforeAll(async () => {
  mongoose = await setupMongoConnection()
});

const expectBalance = async ({account, currency, balance}) => {
  const { balance: balanceResult } = await MainBook.balance({
    account,
    currency
  })
  expect(balanceResult).toBe(balance)
}

describe('receipt', () => {

  afterEach(async () => {
    await mongoose.connection.db.dropCollection("medici_journals")
    await mongoose.connection.db.dropCollection("medici_transactions")
  })

  it('btc receipt to lnd', async () => {
  
    const user = "user1"

    const payee = {
      currencies: [{id: "BTC", pct: 1}],
      accountPath: customerPath(user)
    }
  
    await receiptLnd({
      description: "transaction test",
      payee,
      hash: "abcd",
      sats: 1000,
    })
  
    await expectBalance({account: customerPath(user), currency: "BTC", balance: -1000})
    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: 1000})
  })

  it('usd receipt to lnd', async () => {
  
    const user = "user2"

    const payee = {
      currencies: [{id: "USD", pct: 1}],
      accountPath: customerPath(user)
    }
  
    await receiptLnd({
      description: "transaction test",
      payee,
      hash: "abcd",
      sats: 1000,
    })
  
    await expectBalance({account: customerPath(user), currency: "BTC", balance: 0})
    await expectBalance({account: await brokerLndPath(), currency: "BTC", balance: -1000})
    await expectBalance({account: lndAccountingPath, currency: "BTC", balance: 1000})

    await expectBalance({account: customerPath(user), currency: "USD", balance: -0.10})
    await expectBalance({account: await brokerLndPath(), currency: "USD", balance: 0.10})

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