/**
 * @jest-environment node
 */
import { AdminWallet } from "../AdminWallet";
import { setupMongoConnection } from "../mongodb";
import { checkIsBalanced, lndMain, lndOutside1, lndOutside2, RANDOM_ADDRESS, waitUntilBlockHeight, mockGetExchangeBalance } from "../tests/helper";
import { baseLogger, bitcoindClient, nodeStats, sleep } from "../utils";
import { onChannelOpened } from '../trigger'
const mongoose = require("mongoose");
const { once } = require('events');

const lnService = require('ln-service')



const local_tokens = 10000000

let initBlockCount
let adminWallet
let channelLengthMain, channelLengthOutside1


beforeAll(async () => {
  await setupMongoConnection()
  mockGetExchangeBalance()

  adminWallet = new AdminWallet()

  channelLengthMain = (await lnService.getChannels({ lnd: lndMain })).channels.length
  channelLengthOutside1 = (await lnService.getChannels({ lnd: lndOutside1 })).channels.length
})

beforeEach(async () => {
  initBlockCount = await bitcoindClient.getBlockCount()
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  return await mongoose.connection.close()
})

const newBlock = 6

const openChannel = async ({ lnd, other_lnd, socket, is_private = false }) => {

  await waitUntilBlockHeight({ lnd: lndMain, blockHeight: initBlockCount })
  await waitUntilBlockHeight({ lnd: other_lnd, blockHeight: initBlockCount })

  const { public_key: partner_public_key } = await lnService.getWalletInfo({ lnd: other_lnd })

  let openChannelPromise = lnService.openChannel({
    lnd, local_tokens, is_private, partner_public_key, partner_socket: socket
  })

  const sub = lnService.subscribeToChannels({ lnd })


  await once(sub, 'channel_opening')

  const mineBlock = async () => {
    await bitcoindClient.generateToAddress(newBlock, RANDOM_ADDRESS)
    await waitUntilBlockHeight({ lnd: lndMain, blockHeight: initBlockCount + newBlock })
    await waitUntilBlockHeight({ lnd: other_lnd, blockHeight: initBlockCount + newBlock })
  }

  baseLogger.debug("mining blocks and waiting for channel being opened")

  await Promise.all([
    openChannelPromise,
    // error: https://github.com/alexbosworth/ln-service/issues/122
    // need to investigate.
    // once(sub, 'channel_opened'),
    mineBlock(),
  ])

  if (lnd === lndMain) {
    await sub.once('channel_opened', (channel) => onChannelOpened({ channel, lnd }))
  }
  
  await sleep(5000)
  await adminWallet.updateEscrows()
  sub.removeAllListeners()
}

it('opens channel from lnd1 to lndOutside1', async () => {
  const socket = `lnd-outside-1:9735`
  await openChannel({ lnd: lndMain, other_lnd: lndOutside1, socket })

  const { channels } = await lnService.getChannels({ lnd: lndMain })
  expect(channels.length).toEqual(channelLengthMain + 1)

})

it('opens private channel from lndOutside1 to lndOutside2', async () => {
  const socket = `lnd-outside-2:9735`

  // const {subscribeToGraph} = require('ln-service');
  const subscription = lnService.subscribeToGraph({ lnd: lndOutside1 });

  await Promise.all([
    openChannel({ lnd: lndOutside1, other_lnd: lndOutside2, socket, is_private: true }),
    once(subscription, 'channel_updated')
  ])

  subscription.removeAllListeners();

  const { channels } = await lnService.getChannels({ lnd: lndOutside1 })
  expect(channels.length).toEqual(channelLengthOutside1 + 2)
  expect(channels.some(e => e.is_private))
})

it('opens channel from lndOutside1 to lnd1', async () => {
  const socket = `lnd-service:9735`
  await openChannel({ lnd: lndOutside1, other_lnd: lndMain, socket })

  {
    const { channels } = await lnService.getChannels({ lnd: lndMain })
    expect(channels.length).toEqual(channelLengthMain + 2)
  }

})

it('returns correct nodeStats', async () => {
  const { peersCount, channelsCount } = await nodeStats({ lnd: lndMain })
  expect(peersCount).toBe(1)
  expect(channelsCount).toBe(channelLengthMain + 2)
})

it('escrow update 1', async () => {
  await adminWallet.updateEscrows()
  await checkIsBalanced()
})

it('escrow update 2', async () => {
  await adminWallet.updateEscrows()
  await checkIsBalanced()
})
