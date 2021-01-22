import { sendBalanceToUser } from "../dailyBalanceNotification";
import { customerPath } from "../ledger";
import { quit } from "../lock";
import { MainBook, setupMongoConnection, User, Transaction } from "../mongodb";
import { Price } from "../priceImpl";
import { baseLogger } from "../utils";
import { WalletFactory, getFunderWallet } from "../walletFactory";
import { getUserWallet } from "../tests/helper";
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

it('sends daily balance notification', async () => {
  await sendBalanceToUser()
  const numActiveUsers = (await User.getActiveUsers()).length
  expect(sendNotification.mock.calls.length).toBe(numActiveUsers)
  for (const [call] of sendNotification.mock.calls) {
    const { balance } = await MainBook.balance({ accounts: customerPath(call.uid) })
    const expectedUsdBalance = (price * -balance).toLocaleString("en", { maximumFractionDigits: 2 })
    const expectedSatsBalance = (-balance).toLocaleString("en", { maximumFractionDigits: 2 })
    expect(call.title).toBe(`Your balance today is \$${expectedUsdBalance} (${expectedSatsBalance} sats)`)
  }
})

it('tests isUserActive', async () => {
  await getUserWallet(8)

  const initialActiveUsersAccountPath = (await User.getActiveUsers()).map(user => customerPath(user._id))
  const userWallet0AccountPath = (await getUserWallet(0)).accountPath
  const funderWalletAccountPath = (await getFunderWallet({ logger: baseLogger })).accountPath

  //user0 and funder wallet are active users
  expect(initialActiveUsersAccountPath.length).toBe(2)
  expect(initialActiveUsersAccountPath.indexOf(userWallet0AccountPath)).toBeGreaterThan(-1)
  expect(initialActiveUsersAccountPath.indexOf(funderWalletAccountPath)).toBeGreaterThan(-1)

  for (const activeUserAccountPath of initialActiveUsersAccountPath) {
    await Transaction.updateMany({ accounts: activeUserAccountPath }, { "$set": { "timestamp": new Date(Date.now() - (31 * 24 * 60 * 60 * 1000)) } })
  }
  const finalNumActiveUsers = (await User.getActiveUsers()).length
  expect(finalNumActiveUsers).toBe(0)
})
