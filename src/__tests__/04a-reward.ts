/**
 * @jest-environment node
 */
import { quit } from "../lock";
import { setupMongoConnection } from "../mongodb";
import { checkIsBalanced, getUserWallet, mockGetExchangeBalance, onBoardingEarnAmt, onBoardingEarnIds } from "../tests/helper";


const mongoose = require("mongoose")

let userWallet1
let initBalance1

jest.mock('../notification')

beforeAll(async () => {
  await setupMongoConnection()
  mockGetExchangeBalance()
  userWallet1 = await getUserWallet(1)
});

beforeEach(async () => {
  ({BTC: initBalance1} = await userWallet1.getBalances())
  jest.clearAllMocks()
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {

    // to make this test re-entrant, we need to remove the fund from userWallet1 and delete the user
  // uncomment when necessary
  
  // const finalBalance = await userWallet1.getBalances()
  // const funderWallet = await getFunderWallet({ logger: baseLogger })

  // if (!!finalBalance) {
  //   const request = await funderWallet.addInvoice({ value: finalBalance })
  //   await userWallet1.pay({ invoice: request })
  // }

  // await User.findOneAndRemove({ _id: userWallet1.uid })

  jest.restoreAllMocks();

  await mongoose.connection.close()
  await quit()
});


it('add earn adds balance correctly', async () => {
  const getAndVerifyRewards = async () => {
    await userWallet1.addEarn(onBoardingEarnIds)
    const {BTC: finalBalance} = await userWallet1.getBalances()

    expect(finalBalance).toBe(onBoardingEarnAmt)
    await checkIsBalanced()
  }

  await getAndVerifyRewards()

  // yet, if we do it another time, the balance should not increase, 
  // because all the rewards has already been been consumed:
  await getAndVerifyRewards()
}, 30000)

