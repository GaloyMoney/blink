import * as jwt from 'jsonwebtoken';
import { AdminWallet } from "../AdminWallet";
import { find } from "lodash";
import { login, TEST_NUMBER } from "../text";
import { OnboardingEarn } from "../types";
import { getAuth, logger, sleep } from "../utils";
import { WalletFactory } from "../walletFactory";
const BitcoindClient = require('bitcoin-core')

const lnService = require('ln-service')

const earnsToGet = ['buyFirstSats', 'debitCardActivation', 'firstCardSpending']
export const onBoardingEarnAmt: number = Object.keys(OnboardingEarn).filter(k => find(earnsToGet, o => o === k) ).reduce((p, k) => p + OnboardingEarn[k], 0)
export const onBoardingEarnIds: string[] = earnsToGet

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

export const getTestUserToken = async (userNumber) => {
  const raw_token = await login(TEST_NUMBER[userNumber])
  const token = jwt.verify(raw_token, process.env.JWT_SECRET);
  return token
}

export const getUserWallet = async userNumber => {
  const token = await getTestUserToken(userNumber)
  const userWallet = WalletFactory(token)
  return userWallet
}

export const checkIsBalanced = async () => {
	const adminWallet = new AdminWallet()
  await adminWallet.updateUsersPendingPayment()
	const { assetsLiabilitiesDifference, lndBalanceSheetDifference } = await adminWallet.balanceSheetIsBalanced()
	expect(assetsLiabilitiesDifference).toBeFalsy() // should be 0
	expect(lndBalanceSheetDifference).toBeFalsy() // should be 0
}

export async function waitUntilBlockHeight({ lnd, blockHeight }) {
  let current_block_height, is_synced_to_chain
  ({ current_block_height, is_synced_to_chain } = await lnService.getWalletInfo({ lnd }))

  let time = 0
  const ms = 50
  while (current_block_height < blockHeight || !is_synced_to_chain) {
      await sleep(ms);
      ({ current_block_height, is_synced_to_chain } = await lnService.getWalletInfo({ lnd }))
      // logger.debug({ current_block_height, is_synced_to_chain})
      time++
  }

  logger.debug({ current_block_height, is_synced_to_chain }, `Seconds to sync blockheight ${blockHeight}: ${time / (1000 / ms)}`)
}