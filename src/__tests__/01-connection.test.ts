/**
 * @jest-environment node
 */
import { setupMongoConnection } from "../db";
// this import needs to be before medici
import {lndMain, lndOutside1, lndOutside2, bitcoindClient} from "./import"
const mongoose = require("mongoose");

//TODO: Choose between camel case or underscores for variable naming
const lnService = require('ln-service')

const User = mongoose.model("User")

beforeAll(async () => {
	await setupMongoConnection()
})

afterAll(async () => {
	return await mongoose.connection.close()
})

it('I can connect to bitcoind', async () => {
	const { chain } = await bitcoindClient.getBlockchainInfo()
	expect(chain).toEqual('regtest')
})

it('I can connect to bank lnd', async () => {
	const { current_block_height } = await lnService.getWalletInfo({ lnd: lndMain })
	expect(current_block_height).toBe(0)
})

it('I can connect to outside lnds', async () => {
	const lnds = [lndOutside1, lndOutside2]
	for (const lnd of lnds) {
		const { current_block_height } = await lnService.getWalletInfo({ lnd })
		expect(current_block_height).toBe(0)
	}
})

it('I can connect to mongodb', async () => {
	const users = await User.find()
	expect(users).toStrictEqual([])
})