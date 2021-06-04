/**
 * @jest-environment node
 */
//TODO: Choose between camel case or underscores for variable naming
import { getWalletInfo } from 'lightning';
import mongoose from "mongoose";
import { setupMongoConnection } from "../mongodb";
import { redisClient } from "../redis";
import { User } from "../schema";
import { bitcoindDefaultClient } from "../utils";
import { lnd1, lnd2, lndonchain, lndOutside1, lndOutside2 } from "./helper";



jest.mock('../realtimePrice')


it('I can connect to bitcoind', async () => {
	const { chain } = await bitcoindDefaultClient.getBlockchainInfo()
	expect(chain).toEqual('regtest')
})

const lnds = [lnd1, lnd2, lndonchain]
for (let item in lnds) {
  it(`I can connect to lnd index ${item}`, async () => {
    const { public_key } = await getWalletInfo({ lnd: lnds[item] })
    expect(public_key.length).toBe(64 + 2)
  })
}


it('I can connect to outside lnds', async () => {
	const lnds = [lndOutside1, lndOutside2]
	for (const lnd of lnds) {
		const { public_key } = await getWalletInfo({ lnd })
    expect(public_key.length).toBe(64 + 2)
	}
})

it('I can connect to mongodb', async () => {
  await setupMongoConnection()
	expect(mongoose.connection.readyState).toBe(1)
	const users = await User.find()
  expect(users).toEqual(expect.arrayContaining([]))
  await mongoose.connection.close()
})

it('I can connect to redis', async () => {
	const value = "value"

	redisClient.on("error", function(error) {
		throw new Error("redis issue");
	})

	redisClient.set("key", value, (err, res) => {
		redisClient.get("key", (err, res) => {
			expect(res).toBe(value)
		});
	});
})


// uncomment this test for testing if node can reconnect succesfully upon lnd restart
// this test is only run manually 

// it('reconnect', async () => {
//   while (true) {
//     const {lnd} = authenticatedLndGrpc(params[0])
//     try {
//       await getWalletInfo({ lnd })
//       console.log("ok")
//     } catch (err) {
//       console.log({err}, "nok")
//     }
//     await sleep(1000)
//   }
// }, 120000)