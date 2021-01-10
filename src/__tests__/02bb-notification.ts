import { baseLogger } from "../utils";
import { sendBalanceToUser } from "../dailyBalanceNotification"
import { setupMongoConnection, MainBook } from "../mongodb";
import { quit } from "../lock";
import { WalletFactory } from "../walletFactory";
import { customerPath } from "../ledger";
import { Price } from "../priceImpl";
jest.mock('../notification')
const { sendNotification } = require("../notification")
let price

beforeAll(async () => {
  await setupMongoConnection()
  price = await new Price({ logger: baseLogger }).lastPrice()
})


afterAll(async () => {
  await quit()
});

it('sends daily balance notification', async () => {
  await sendBalanceToUser()
  for (const [call] of sendNotification.mock.calls) {
    const { balance } = await MainBook.balance({ accounts: customerPath(call.uid) })
    expect(call.body).toBe(`Your balance is \$${price * -balance}`)
  }
})