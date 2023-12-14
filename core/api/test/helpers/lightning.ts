import { once } from "events"

import {
  authenticatedLndGrpc,
  closeChannel,
  createChainAddress,
  getChainBalance,
  getChannelBalance,
  getChannels,
  getInvoice,
  getNetworkGraph,
  getWalletInfo,
  openChannel,
  pay,
  sendToChainAddress,
  subscribeToChannels,
  subscribeToGraph,
  updateRoutingFees,
} from "lightning"

import { parsePaymentRequest } from "invoices"

import {
  bitcoindClient,
  bitcoindOutside,
  RANDOM_ADDRESS,
  sendToAddressAndConfirm,
} from "./bitcoin-core"

import { waitFor } from "./shared"

import { onChannelUpdated, updateEscrows } from "@/services/lnd/utils"
import { baseLogger } from "@/services/logger"

import { sleep } from "@/utils"

import { offchainLnds, onchainLnds } from "@/services/lnd/config"

export * from "lightning"

export const lnd1 = offchainLnds[0].lnd
export const lnd2 = offchainLnds[1].lnd
export const lndonchain = onchainLnds[0].lnd

export const getHash = (request: EncodedPaymentRequest) => {
  return parsePaymentRequest({ request }).id as PaymentHash
}

export const getAmount = (request: EncodedPaymentRequest) => {
  return parsePaymentRequest({ request }).tokens as Satoshis
}

export const getPubKey = (request: EncodedPaymentRequest) => {
  return parsePaymentRequest({ request }).destination as Pubkey
}

export const getInvoiceAttempt = async ({
  lnd,
  id,
}: {
  lnd: AuthenticatedLnd
  id: string
}) => {
  try {
    const result = await getInvoice({ lnd, id })
    return result
  } catch (err) {
    const invoiceNotFound = "unable to locate invoice"
    if (
      Array.isArray(err) &&
      err.length === 3 &&
      err[2]?.err?.details === invoiceNotFound
    ) {
      return null
    }
    // must be wrapped error?
    throw err
  }
}

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

export const lndsIntegration = [lnd1, lndOutside1, lndOutside2]
export const lndsLegacyIntegration = [lnd1, lnd2, lndOutside1, lndOutside2]
export const lndsE2e = [lnd1, lnd2, lndOutside1, lndOutside2]

export const waitUntilBlockHeight = async ({
  lnd,
  blockHeight = 0,
}: {
  lnd: AuthenticatedLnd
  blockHeight?: number
}) => {
  let block = blockHeight
  if (block <= 0) {
    block = await bitcoindClient.getBlockCount()
  }

  let current_block_height: number, is_synced_to_chain: boolean
  ;({ current_block_height, is_synced_to_chain } = await getWalletInfo({ lnd }))

  let time = 0
  const ms = 50
  while (current_block_height < block || !is_synced_to_chain) {
    await sleep(ms)
    ;({ current_block_height, is_synced_to_chain } = await getWalletInfo({ lnd }))
    time++
  }

  baseLogger.debug(
    { current_block_height, is_synced_to_chain },
    `Seconds to sync blockheight ${block}: ${time / (1000 / ms)}`,
  )
}

export const openChannelTesting = async ({
  lnd,
  lndPartner,
  socket,
  is_private = false,
}: {
  lnd: AuthenticatedLnd
  lndPartner: AuthenticatedLnd
  socket: string
  is_private?: boolean
}) => {
  await waitUntilSync({ lnds: [lnd, lndPartner] })

  const local_tokens = 1000000
  const { public_key: partner_public_key } = await getWalletInfo({ lnd: lndPartner })

  const openChannelPromise = waitFor(async () => {
    try {
      return openChannel({
        lnd,
        local_tokens,
        is_private,
        partner_public_key,
        partner_socket: socket,
      })
    } catch (error) {
      baseLogger.warn({ error }, "openChannel failed. trying again.")
      return Promise.resolve(null)
    }
  })

  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  let lndNewChannel, lndPartnerNewChannel
  const sub = subscribeToChannels({ lnd })
  sub.once("channel_opened", (channel) => {
    lndNewChannel = channel
  })

  const subPartner = subscribeToChannels({ lnd: lndPartner })
  subPartner.once("channel_opened", (channel) => {
    lndPartnerNewChannel = channel
  })

  await Promise.all([once(sub, "channel_opening"), openChannelPromise])

  baseLogger.debug("mining blocks and waiting for channel being opened")
  await Promise.all([
    // error: https://github.com/alexbosworth/ln-service/issues/122
    // once(sub, 'channel_opened'),

    // @ts-ignore-next-line no-implicit-any error
    waitFor(() => lndNewChannel && lndPartnerNewChannel),
    mineBlockAndSync({ lnds: [lnd, lndPartner] }),
  ])

  if (lnd === lnd1) {
    baseLogger.debug({ lndNewChannel }, "lnd is lnd1 - onChannelUpdated")
    // @ts-ignore-next-line no-implicit-any error
    await onChannelUpdated({ channel: lndNewChannel, lnd, stateChange: "opened" })
  }

  if (lndPartner === lnd1) {
    // @ts-ignore-next-line no-implicit-any error
    expect(lndPartnerNewChannel.is_partner_initiated).toBe(true)
  }

  sub.removeAllListeners()
  subPartner.removeAllListeners()

  await updateEscrows()
  baseLogger.debug({ lndNewChannel, lndPartnerNewChannel }, "new channels")

  return { lndNewChannel, lndPartnerNewChannel }
}

export const openChannelTestingNoAccounting = async ({
  lnd,
  lndPartner,
  socket,
  is_private = false,
}: {
  lnd: AuthenticatedLnd
  lndPartner: AuthenticatedLnd
  socket: string
  is_private?: boolean
}) => {
  await waitUntilSync({ lnds: [lnd, lndPartner] })

  const local_tokens = 1000000
  const { public_key: partner_public_key } = await getWalletInfo({ lnd: lndPartner })

  const openChannelPromise = waitFor(async () => {
    try {
      return openChannel({
        lnd,
        local_tokens,
        is_private,
        partner_public_key,
        partner_socket: socket,
      })
    } catch (error) {
      baseLogger.warn({ error }, "openChannel failed. trying again.")
      return Promise.resolve(null)
    }
  })

  // @ts-ignore-next-line no-implicit-any error
  let lndNewChannel
  const sub = subscribeToChannels({ lnd })
  sub.once("channel_opened", (channel) => {
    lndNewChannel = channel
  })

  // @ts-ignore-next-line no-implicit-any error
  let lndPartnerNewChannel
  const subPartner = subscribeToChannels({ lnd: lndPartner })
  subPartner.once("channel_opened", (channel) => {
    lndPartnerNewChannel = channel
  })

  await Promise.all([once(sub, "channel_opening"), openChannelPromise])

  await Promise.all([
    // @ts-ignore-next-line no-implicit-any error
    waitFor(() => lndNewChannel && lndPartnerNewChannel),
    mineBlockAndSync({ lnds: [lnd, lndPartner] }),
  ])

  sub.removeAllListeners()
  subPartner.removeAllListeners()

  return { lndNewChannel, lndPartnerNewChannel }
}

// all the following uses of bitcoind client that send/receive coin must be "outside"

export const fundLnd = async (lnd: AuthenticatedLnd, amount = 1) => {
  const { address } = (await createChainAddress({
    format: "p2wpkh",
    lnd,
  })) as { address: OnChainAddress }
  await sendToAddressAndConfirm({ walletClient: bitcoindOutside, address, amount })
  // @ts-ignore-next-line no-implicit-any error
  await waitUntilBlockHeight({ lnd })
}

const resetLnds = async (lnds: AuthenticatedLnd[]) => {
  const block = await bitcoindClient.getBlockCount()
  if (!block) return // skip if we are just getting started
  // just in case pending transactions
  await mineBlockAndSync({ lnds })

  for (const lnd of lnds) {
    await closeAllChannels({ lnd })
    await waitUntilSync({ lnds })
  }

  await mineBlockAndSync({ lnds })

  for (const lnd of lnds) {
    const chainBalance = (await getChainBalance({ lnd })).chain_balance
    if (chainBalance > 0) {
      const address = await bitcoindOutside.getNewAddress()
      await sendToChainAddress({
        lnd,
        address,
        is_send_all: true,
        fee_tokens_per_vbyte: 1,
      })
    }
  }

  await mineBlockAndSync({ lnds })
}

export const resetIntegrationLnds = () => resetLnds(lndsIntegration)
export const resetLegacyIntegrationLnds = () => resetLnds(lndsLegacyIntegration)
export const resetE2eLnds = () => resetLnds(lndsE2e)

export const closeAllChannels = async ({ lnd }: { lnd: AuthenticatedLnd }) => {
  let channels
  try {
    ;({ channels } = await getChannels({ lnd }))
  } catch (err) {
    baseLogger.error({ err }, "Impossible to get channels")
    throw err
  }

  try {
    for (const channel of channels) {
      if (channel.is_partner_initiated === false) {
        await closeChannel({
          lnd,
          transaction_id: channel.transaction_id,
          transaction_vout: channel.transaction_vout,
        })
      }
    }
  } catch (error) {
    baseLogger.error(
      { error },
      "Channels could not be closed, please reset your environment",
    )
    throw error
  }
}

export const setChannelFees = async ({
  lnd,
  channel,
  base,
  rate,
}: {
  lnd: AuthenticatedLnd
  channel: Record<string, string>
  base: number
  rate: number
}) => {
  const input = {
    fee_rate: rate,
    base_fee_mtokens: `${base * 1000}`,
    transaction_id: channel.transaction_id,
    transaction_vout: channel.transaction_vout,
  }

  const updateRoutingFeesPromise = waitFor(async () => {
    try {
      // @ts-ignore-next-line no-implicit-any error
      const { failures } = await updateRoutingFees({ lnd, ...input })
      if (failures && failures.length) {
        return failures[0].failure
      }
      return true
    } catch (error) {
      baseLogger.warn({ error }, "updateRoutingFees failed. trying again.")
      return error
    }
  })

  const sub = subscribeToGraph({ lnd })
  const [updateFeesRes] = await Promise.all([
    updateRoutingFeesPromise,
    once(sub, "channel_updated"),
  ])

  sub.removeAllListeners()
  return updateFeesRes
}

export const mineBlockAndSync = async ({
  lnds,
  blockHeight = 0,
  newBlock = 6,
}: {
  lnds: Array<AuthenticatedLnd>
  blockHeight?: number
  newBlock?: number
}) => {
  await bitcoindOutside.generateToAddress({ nblocks: newBlock, address: RANDOM_ADDRESS })
  const promiseArray: Array<Promise<void>> = []
  for (const lnd of lnds) {
    promiseArray.push(waitUntilBlockHeight({ lnd, blockHeight }))
  }
  await Promise.all(promiseArray)
}

export const mineBlockAndSyncAll = (newBlock = 6) =>
  mineBlockAndSync({ lnds: lndsIntegration, newBlock })
export const mineBlockAndSyncAllE2e = (newBlock = 6) =>
  mineBlockAndSync({ lnds: lndsE2e, newBlock })

export const waitUntilSyncAll = () => waitUntilSync({ lnds: lndsIntegration })
export const waitUntilSyncAllE2e = () => waitUntilSync({ lnds: lndsE2e })

export const waitUntilSync = async ({ lnds }: { lnds: Array<AuthenticatedLnd> }) => {
  const promiseArray: Array<Promise<void>> = []
  for (const lnd of lnds) {
    // @ts-ignore-next-line no-implicit-any error
    promiseArray.push(waitUntilBlockHeight({ lnd }))
  }
  await Promise.all(promiseArray)
}

const waitUntilChannelBalanceSyncAll = async (lnds: AuthenticatedLnd[]) => {
  const promiseArray: Array<Promise<void>> = []
  for (const lnd of lnds) {
    /* eslint @typescript-eslint/ban-ts-comment: "off" */
    // @ts-ignore-next-line no-implicit-any error
    promiseArray.push(waitUntilChannelBalanceSync({ lnd }))
  }
  await Promise.all(promiseArray)
}
export const waitUntilChannelBalanceSyncIntegration = () =>
  waitUntilChannelBalanceSyncAll(lndsIntegration)

export const waitUntilChannelBalanceSyncE2e = () =>
  waitUntilChannelBalanceSyncAll(lndsE2e)

// @ts-ignore-next-line no-implicit-any error
export const waitUntilChannelBalanceSync = ({ lnd }) =>
  waitFor(async () => {
    const { unsettled_balance } = await getChannelBalance({ lnd })
    return unsettled_balance === 0
  })

export const waitUntilGraphIsReady = async ({
  lnd,
  numNodes = 4,
}: {
  lnd: AuthenticatedLnd
  numNodes: number
}) => {
  await waitFor(async () => {
    const graph = await getNetworkGraph({ lnd })
    if (graph.nodes.length < numNodes) {
      baseLogger.warn({ nodeLength: graph.nodes.length }, "missing nodes in graph")
      return false
    }
    if (graph.nodes.every((node) => node.updated_at === "")) {
      const nodesUpdated = graph.nodes.filter((node) => node.updated_at === "").length
      baseLogger.warn({ nodesUpdated }, "graph metadata not ready")
      return false
    }
    return true
  })
}

// @ts-ignore-next-line no-implicit-any error
export const safePay = async (args) => {
  try {
    const res = await pay(args) // 'await' is explicitly needed here
    return res
  } catch (err) {
    // If we get here, error
    expect(err).toBeUndefined()
  }
}

// @ts-ignore-next-line no-implicit-any error
export const safePayNoExpect = async (args) => {
  try {
    return await pay(args) // 'await' is explicitly needed here
  } catch (err) {
    return err
  }
}
