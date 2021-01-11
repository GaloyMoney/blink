import { sendBalanceToUser } from "../dailyBalanceNotification";
import { customerPath } from "../ledger";
import { quit } from "../lock";
import { MainBook, setupMongoConnection } from "../mongodb";
import { Price } from "../priceImpl";
import { baseLogger } from "../utils";
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
  for (const [call] of sendNotification.mock.calls) {
    const { balance } = await MainBook.balance({ accounts: customerPath(call.uid) })
    expect(call.body).toBe(`Your balance is \$${price * -balance}`)
  }
})