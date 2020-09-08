import { getAuth, logger, sleep } from "../utils";
import { LightningUserWallet } from "../LightningUserWallet";
const BitcoindClient = require('bitcoin-core')
import * as jwt from 'jsonwebtoken';
import { TEST_NUMBER, login } from "../text";
import { LightningAdminWallet } from "../LightningAdminImpl"
import { User } from "../mongodb";
import { OnboardingEarn } from "../types";
const mongoose = require("mongoose")

const lnService = require('ln-service')
const cert = process.env.TLS

//FIXME: Maybe switch to using single reward
export const onBoardingEarnAmt: number = Object.values(OnboardingEarn).reduce((a, b) => a + b, 0)
export const onBoardingEarnIds: string[] = Object.keys(OnboardingEarn)

export const lndMain = lnService.authenticatedLndGrpc(getAuth()).lnd

export const lndOutside1 = lnService.authenticatedLndGrpc({
  cert: process.env.TLSOUTSIDE1,
  macaroon: process.env.MACAROONOUTSIDE1,
  socket: `${process.env.LNDOUTSIDE1ADDR}:${process.env.LNDOUTSIDE1RPCPORT}`,
}).lnd;

export const lndOutside2 = lnService.authenticatedLndGrpc({
  cert: process.env.TLSOUTSIDE2,
  macaroon: process.env.MACAROONOUTSIDE2,
  socket: `${process.env.LNDOUTSIDE2ADDR}:${process.env.LNDOUTSIDE2RPCPORT}`,
}).lnd;

const connection_obj = {
  network: 'regtest', username: 'rpcuser', password: 'rpcpass',
  host: process.env.BITCOINDADDR, port: process.env.BITCOINDPORT
}

export const bitcoindClient = new BitcoindClient(connection_obj)

export const RANDOM_ADDRESS = "2N1AdXp9qihogpSmSBXSSfgeUFgTYyjVWqo"

export const getTestUserUid = async userNumber => {
  const raw_token = await login(TEST_NUMBER[userNumber])
  const token = jwt.verify(raw_token, process.env.JWT_SECRET);
  return token.uid
}

export const getUserWallet = async userNumber => {
  const uid = await getTestUserUid(userNumber)
  const userWallet = new LightningUserWallet({ uid })
  return userWallet
}

export const checkIsBalanced = async () => {
	const admin = await User.findOne({ role: "admin" })
	const adminWallet = new LightningAdminWallet({ uid: admin._id })
	const { assetsLiabilitiesDifference, lndBalanceSheetDifference } = await adminWallet.balanceSheetIsBalanced()
	expect(assetsLiabilitiesDifference).toBeFalsy() // should be 0
	expect(lndBalanceSheetDifference).toBeFalsy() // should be 0
}

export async function waitUntilBlockHeight({ lnd, blockHeight }) {
  let current_block_height, is_synced_to_chain
  ({ current_block_height, is_synced_to_chain } = await lnService.getWalletInfo({ lnd }))
  logger.debug({ current_block_height, is_synced_to_chain })

  let time = 0
  const ms = 50
  while (current_block_height < blockHeight || !is_synced_to_chain) {
      await sleep(ms);
      ({ current_block_height, is_synced_to_chain } = await lnService.getWalletInfo({ lnd }))
      // logger.debug({ current_block_height, is_synced_to_chain})
      time++
  }
  logger.debug(`Seconds to sync blockheight ${blockHeight}: ${time / (1000 / ms)}`)
  return
}