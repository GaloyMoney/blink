/**
 * @jest-environment node
 */
import { quit } from "../lock";
import { setupMongoConnection } from "../mongodb";
import { getTokenFromPhoneIndex } from "../walletFactory";
const mongoose = require("mongoose");


let uid

beforeAll(async () => {
  await setupMongoConnection();
  ({ uid } = await getTokenFromPhoneIndex(7))
})

afterAll(async () => {
  await mongoose.connection.close()
  await quit()
})

// to not have jest failing because there is no test in the file
it('test', () => expect(true).toBeTruthy())


// it('getExchangeBalance', async () => {
//   ({ uid } = await getTokenFromPhoneIndex(7))
//   const wallet = new BrokerWallet({ uid, logger: baseLogger })
//   const balance = await wallet.getExchangeBalance()
//   console.log({balance})
// })

// it('getFunding', async () => {
//   const brokerWalletNofixtures = new BrokerWallet({ uid, logger: baseLogger })
//   console.log(await brokerWalletNofixtures.getNextFundingRate())
// })

// it('private Account', async () => {
//   const broker = new BrokerWallet({ uid, logger: baseLogger })
//   await broker.getAccountPosition()
// })
