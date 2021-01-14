import { sendBalanceToUser } from "../dailyBalanceNotification";
import { customerPath } from "../ledger";
import { quit } from "../lock";
import { MainBook, setupMongoConnection, User, Transaction } from "../mongodb";
import { Price } from "../priceImpl";
import { baseLogger } from "../utils";
import { WalletFactory } from "../walletFactory";
jest.mock('../notification')
const { sendNotification } = require("../notification")
let price

beforeAll(async () => {
  await setupMongoConnection()
  price = await new Price({ logger: baseLogger }).lastPrice()
})


afterAll(async () => {
  await quit()
  jest.restoreAllMocks();
});

it('tests isUserActive', async () => {
  const initialActiveUsers = await getActiveUsers()
  expect(initialActiveUsers.length).toBeGreaterThan(0)
  
  for (const activeUserAccountPath of initialActiveUsers) {
    await Transaction.updateMany({ accounts: activeUserAccountPath }, { "$set": { "timestamp": new Date() } })
  }
  const finalNumActiveUsers = (await getActiveUsers()).length
  expect(finalNumActiveUsers).toBe(0)
})

it('sends daily balance notification', async () => {
  await sendBalanceToUser()
  const numActiveUsers = (await getActiveUsers()).length
  expect(sendNotification.mock.calls.length).toBe(numActiveUsers)
  for (const [call] of sendNotification.mock.calls) {
    const { balance } = await MainBook.balance({ accounts: customerPath(call.uid) })
    expect(call.body).toBe(`Your balance is \$${price * -balance} (${-balance} sats)`)
  }
})

const getActiveUsers = async (): Promise<Array<string>> => {
  const users = await User.find({})
  const activeUsers = []
  for (const user of users) {
    const userWallet = await WalletFactory({ user, uid: user._id, currency: user.currency, logger: baseLogger })
    if (await userWallet.isUserActive()) {
      activeUsers.push(userWallet.accountPath)
    }
  }
  return activeUsers
}

