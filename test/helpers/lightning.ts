import { once } from "events"
import {
  AuthenticatedLnd,
  authenticatedLndGrpc,
  getWalletInfo,
  openChannel,
  subscribeToChannels,
} from "lightning"

import { offchainLnds, onchainLnds, onChannelUpdated, updateEscrows } from "src/lndUtils"
import { baseLogger } from "src/logger"
import { bitcoindClient, RANDOM_ADDRESS } from "./bitcoinCore"
import { sleep } from "src/utils"

const newBlock = 6

export * from "lightning"

export const lnd1 = offchainLnds[0].lnd
export const lnd2 = offchainLnds[1].lnd
export const lndonchain = onchainLnds[0].lnd

// TODO: this could be refactored with lndAuth
export const lndOutside1 = authenticatedLndGrpc({
  cert: process.env.TLSOUTSIDE1,
  macaroon: process.env.MACAROONOUTSIDE1,
  socket: `${process.env.LNDOUTSIDE1ADDR}:${process.env.LNDOUTSIDE1RPCPORT ?? 10009}`,
}).lnd

export const lndOutside2 = authenticatedLndGrpc({
  cert: process.env.TLSOUTSIDE2,
  macaroon: process.env.MACAROONOUTSIDE2,
  socket: `${process.env.LNDOUTSIDE2ADDR}:${process.env.LNDOUTSIDE2RPCPORT ?? 10009}`,
}).lnd

export async function waitUntilBlockHeight({ lnd, blockHeight }) {
  let current_block_height: number, is_synced_to_chain: boolean
  ;({ current_block_height, is_synced_to_chain } = await getWalletInfo({ lnd }))

  let time = 0
  const ms = 50
  while (current_block_height < blockHeight || !is_synced_to_chain) {
    await sleep(ms)
    ;({ current_block_height, is_synced_to_chain } = await getWalletInfo({ lnd }))
    // baseLogger.debug({ current_block_height, is_synced_to_chain})
    time++
  }

  baseLogger.debug(
    { current_block_height, is_synced_to_chain },
    `Seconds to sync blockheight ${blockHeight}: ${time / (1000 / ms)}`,
  )
}

export async function openChannelTesting({ lnd, other_lnd, socket, is_private = false }) {
  const local_tokens = 1000000
  const initBlockCount = await bitcoindClient.getBlockCount()

  await waitUntilBlockHeight({ lnd, blockHeight: initBlockCount })
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

  if (lnd === lnd1) {
    sub.once("channel_opened", (channel) =>
      onChannelUpdated({ channel, lnd, stateChange: "opened" }),
    )
  }

  if (other_lnd === lnd1) {
    sub.once("channel_opened", (channel) =>
      expect(channel.is_partner_initiated).toBe(true),
    )
  }

  await once(sub, "channel_opening")

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

export async function mineBlockAndSync({
  lnds,
  blockHeight,
}: {
  lnds: Array<AuthenticatedLnd>
  blockHeight: number
}) {
  await bitcoindClient.generateToAddress(newBlock, RANDOM_ADDRESS)
  const promiseArray: Array<Promise<void>> = []
  for (const lnd of lnds) {
    promiseArray.push(waitUntilBlockHeight({ lnd, blockHeight }))
  }
  await Promise.all(promiseArray)
}
