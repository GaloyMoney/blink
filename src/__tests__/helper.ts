import {
  balanceSheetIsBalanced,
  updateEscrows,
  updateUsersPendingPayment,
} from "../ledger/balanceSheet"
import { FtxDealerWallet } from "../dealer/FtxDealerWallet"
import { lnd } from "../lndConfig"
import { User } from "../schema"
import { bitcoindDefaultClient, sleep } from "../utils"
import { baseLogger } from "../logger"
import { WalletFactory } from "../walletFactory"
import {
  AuthenticatedLnd,
  authenticatedLndGrpc,
  getWalletInfo,
  openChannel,
  subscribeToChannels,
} from "lightning"
import { yamlConfig } from "../config"
import { login } from "../text"
import * as jwt from "jsonwebtoken"
import { once } from "events"
import { onChannelUpdated } from "../entrypoint/trigger"

export const lndMain = lnd

export const lndOutside1 = authenticatedLndGrpc({
  cert: process.env.TLSOUTSIDE1,
  macaroon: process.env.MACAROONOUTSIDE1,
  socket: `${process.env.LNDOUTSIDE1ADDR}:${process.env.LNDOUTSIDE1RPCPORT}`,
}).lnd

export const lndOutside2 = authenticatedLndGrpc({
  cert: process.env.TLSOUTSIDE2,
  macaroon: process.env.MACAROONOUTSIDE2,
  socket: `${process.env.LNDOUTSIDE2ADDR}:${process.env.LNDOUTSIDE2RPCPORT}`,
}).lnd

export const RANDOM_ADDRESS = "2N1AdXp9qihogpSmSBXSSfgeUFgTYyjVWqo"

export const getTokenFromPhoneIndex = async (index) => {
  const entry = yamlConfig.test_accounts[index]
  const raw_token = await login({ ...entry, logger: baseLogger, ip: "127.0.0.1" })
  const token = jwt.verify(raw_token, process.env.JWT_SECRET)

  const { uid } = token

  if (entry.username) {
    await User.findOneAndUpdate({ _id: uid }, { username: entry.username })
  }

  if (entry.currencies) {
    await User.findOneAndUpdate({ _id: uid }, { currencies: entry.currencies })
  }

  if (entry.role) {
    await User.findOneAndUpdate({ _id: uid }, { role: entry.role })
  }

  if (entry.title) {
    await User.findOneAndUpdate({ _id: uid }, { title: entry.title })
  }

  return token
}

export const getUserWallet = async (userNumber) => {
  const token = await getTokenFromPhoneIndex(userNumber)
  const user = await User.findOne({ _id: token.uid })
  const userWallet = await WalletFactory({ user, logger: baseLogger })
  return userWallet
}

export const checkIsBalanced = async () => {
  await updateUsersPendingPayment()
  const { assetsLiabilitiesDifference, bookingVersusRealWorldAssets } =
    await balanceSheetIsBalanced()
  expect(assetsLiabilitiesDifference).toBeFalsy() // should be 0

  // FIXME: because safe_fees is doing rounding to the value up
  // balance doesn't match any longer. need to go from sats to msats to properly account for every msats spent
  expect(Math.abs(bookingVersusRealWorldAssets)).toBeLessThan(5) // should be 0
}

export async function waitUntilBlockHeight({ lnd, blockHeight }) {
  let current_block_height, is_synced_to_chain
  ;({ current_block_height, is_synced_to_chain } = await getWalletInfo({ lnd }))

  let time = 0
  const ms = 50
  while (current_block_height < blockHeight || !is_synced_to_chain) {
    await sleep(ms)
    ;({ current_block_height, is_synced_to_chain } = await getWalletInfo({ lnd }))
    // logger.debug({ current_block_height, is_synced_to_chain})
    time++
  }

  baseLogger.debug(
    { current_block_height, is_synced_to_chain },
    `Seconds to sync blockheight ${blockHeight}: ${time / (1000 / ms)}`,
  )
}

export const mockGetExchangeBalance = () =>
  jest.spyOn(FtxDealerWallet.prototype, "getExchangeBalance").mockImplementation(
    () =>
      new Promise((resolve) => {
        resolve({ sats: 0, usdPnl: 0 })
      }),
  )

export const openChannelTesting = async ({
  lnd,
  other_lnd,
  socket,
  is_private = false,
}) => {
  const local_tokens = 1000000
  const initBlockCount = await bitcoindDefaultClient.getBlockCount()

  await waitUntilBlockHeight({ lnd: lndMain, blockHeight: initBlockCount })
  await waitUntilBlockHeight({ lnd: other_lnd, blockHeight: initBlockCount })

  const { public_key: partner_public_key } = await getWalletInfo({ lnd: other_lnd })

  const openChannelPromise = openChannel({
    lnd,
    local_tokens,
    is_private,
    partner_public_key,
    partner_socket: socket,
  })

  const sub = subscribeToChannels({ lnd })

  if (lnd === lndMain) {
    sub.once("channel_opened", (channel) =>
      onChannelUpdated({ channel, lnd, stateChange: "opened" }),
    )
  }

  if (other_lnd === lndMain) {
    sub.once("channel_opened", (channel) =>
      expect(channel.is_partner_initiated).toBe(true),
    )
  }

  await once(sub, "channel_opening")

  await mineBlockAndSync({
    lnds: [lnd, other_lnd],
    blockHeight: initBlockCount + newBlock,
  })

  baseLogger.debug("mining blocks and waiting for channel being opened")

  await Promise.all([
    openChannelPromise,
    // error: https://github.com/alexbosworth/ln-service/issues/122
    // need to investigate.
    // once(sub, 'channel_opened'),
    mineBlockAndSync({ lnds: [lnd, other_lnd], blockHeight: initBlockCount + newBlock }),
  ])

  await sleep(5000)
  await updateEscrows()
  sub.removeAllListeners()
}
const newBlock = 6

export const mineBlockAndSync = async ({
  lnds,
  blockHeight,
}: {
  lnds: Array<AuthenticatedLnd>
  blockHeight: number
}) => {
  await bitcoindDefaultClient.generateToAddress(newBlock, RANDOM_ADDRESS)
  const promiseArray: Array<Promise<void>> = []
  for (const lnd of lnds) {
    promiseArray.push(waitUntilBlockHeight({ lnd, blockHeight }))
  }
  await Promise.all(promiseArray)
}
