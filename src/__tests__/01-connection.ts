/**
 * @jest-environment node
 */
import { setupMongoConnection, User } from "../mongodb";
const redis = require('redis')

import {lndMain, lndOutside1, lndOutside2} from "../tests/helper"
import { bitcoindClient } from "../utils";
const mongoose = require("mongoose");

//TODO: Choose between camel case or underscores for variable naming
const lnService = require('ln-service')

beforeAll(async () => {
	await setupMongoConnection()
})

afterAll(async () => {
  await mongoose.connection.close()
})

it('I can connect to bitcoind', async () => {
	const { chain } = await bitcoindClient.getBlockchainInfo()
	expect(chain).toEqual('regtest')
})

it('I can connect to bank lnd', async () => {
	const { public_key } = await lnService.getWalletInfo({ lnd: lndMain })
	expect(public_key.length).toBe(64 + 2)
})

it('I can connect to outside lnds', async () => {
	const lnds = [lndOutside1, lndOutside2]
	for (const lnd of lnds) {
		const { public_key } = await lnService.getWalletInfo({ lnd })
    expect(public_key.length).toBe(64 + 2)
	}
})

it('I can connect to mongodb', async () => {
	expect(mongoose.connection.readyState).toBe(1)
	const users = await User.find()
	expect(users).toEqual(expect.arrayContaining([]))
})

it('I can connect to redis', async () => {
	const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IP)
	const value = "value"

	client.on("error", function(error) {
		throw new Error("redis issue");
	})

	client.set("key", value, (err, res) => {
		client.get("key", (err, res) => {
			expect(res).toBe(value)
			client.quit()
		});
	});
})