import { balanceSheetIsBalanced, updateUsersPendingPayment } from "../ledger/balanceSheet";
import { FtxDealerWallet } from "../dealer/FtxDealerWallet";
import { lnd } from "../lndConfig";
import { User } from "../schema";
import { baseLogger, sleep } from "../utils";
import { getTokenFromPhoneIndex, WalletFactory } from "../walletFactory";
import {authenticatedLndGrpc} from 'lightning';


import { getWalletInfo } from 'lightning'

export const lndMain = lnd

export const lndOutside1 = authenticatedLndGrpc({
  cert: process.env.TLSOUTSIDE1,
  macaroon: process.env.MACAROONOUTSIDE1,
  socket: `${process.env.LNDOUTSIDE1ADDR}:${process.env.LNDOUTSIDE1RPCPORT}`,
}).lnd;

export const lndOutside2 = authenticatedLndGrpc({
  cert: process.env.TLSOUTSIDE2,
  macaroon: process.env.MACAROONOUTSIDE2,
  socket: `${process.env.LNDOUTSIDE2ADDR}:${process.env.LNDOUTSIDE2RPCPORT}`,
}).lnd;

export const RANDOM_ADDRESS = "2N1AdXp9qihogpSmSBXSSfgeUFgTYyjVWqo"

export const getUserWallet = async userNumber => {
  const token = await getTokenFromPhoneIndex(userNumber)
  const user = await User.findOne({_id: token.uid})
  const userWallet = await WalletFactory({ user, logger: baseLogger})
  return userWallet
}

export const checkIsBalanced = async () => {
  await updateUsersPendingPayment()
  const { assetsLiabilitiesDifference, bookingVersusRealWorldAssets } = await balanceSheetIsBalanced()
	expect(assetsLiabilitiesDifference).toBeFalsy() // should be 0
  
  // FIXME: because safe_fees is doing rounding to the value up
  // balance doesn't match any longer. need to go from sats to msats to properly account for every msats spent
  expect(Math.abs(bookingVersusRealWorldAssets)).toBeLessThan(5) // should be 0
}

export async function waitUntilBlockHeight({ lnd, blockHeight }) {
  let current_block_height, is_synced_to_chain
  ({ current_block_height, is_synced_to_chain } = await getWalletInfo({ lnd }))

  let time = 0
  const ms = 50
  while (current_block_height < blockHeight || !is_synced_to_chain) {
      await sleep(ms);
      ({ current_block_height, is_synced_to_chain } = await getWalletInfo({ lnd }))
      // logger.debug({ current_block_height, is_synced_to_chain})
      time++
  }

  baseLogger.debug({ current_block_height, is_synced_to_chain }, `Seconds to sync blockheight ${blockHeight}: ${time / (1000 / ms)}`)
}

export const mockGetExchangeBalance = () => jest.spyOn(FtxDealerWallet.prototype, 'getExchangeBalance').mockImplementation(() => new Promise((resolve, reject) => {
  resolve({ sats : 0, usdPnl: 0 }) 
}));