import { sendBalanceToUser } from "../dailyBalanceNotification";
import { customerPath } from "../ledger";
import { quit } from "../lock";
import { MainBook, setupMongoConnection, User } from "../mongodb";
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

it('sends daily balance notification', async () => {
  await sendBalanceToUser()
  const users = await User.find({})
  let numActiveUsers = 0
  for (const user of users) {
    const userWallet = await WalletFactory({ user, uid: user._id, currency: user.currency, logger: baseLogger })
    if (await userWallet.isUserActive()) numActiveUsers += 1
  }
  expect(sendNotification.mock.calls.length).toBe(numActiveUsers)
  for (const [call] of sendNotification.mock.calls) {
    const { balance } = await MainBook.balance({ accounts: customerPath(call.uid) })
    expect(call.body).toBe(`Your balance is \$${price * -balance} (${-balance} sats)`)
  }
})