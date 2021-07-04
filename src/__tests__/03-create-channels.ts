/**
 * @jest-environment node
 */
import { once } from "events"
import { getChannels, subscribeToGraph, updateRoutingFees } from "lightning"
import _ from "lodash"
import { lndFeePath } from "../ledger/ledger"
import { offchainLnds, updateEscrows } from "../lndUtils"
import { MainBook, setupMongoConnection } from "../mongodb"
import { bitcoindDefaultClient, sleep } from "../utils"
import {
  checkIsBalanced,
  lnd1,
  lnd2,
  lndOutside1,
  lndOutside2,
  mockGetExchangeBalance,
  openChannelTesting,
} from "./helper"

jest.mock("../realtimePrice")

let channelLengthMain, channelLengthOutside1

beforeAll(async () => {
  await setupMongoConnection()
  mockGetExchangeBalance()
})

beforeEach(async () => {
  await bitcoindDefaultClient.getBlockCount()

  channelLengthMain = (await getChannels({ lnd: lnd1 })).channels.length
  channelLengthOutside1 = (await getChannels({ lnd: lndOutside1 })).channels.length
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks()
  // return await mongoose.connection.close()
})

//this is the fixed opening and closing channel fee on devnet
const channelFee = 7637

it("opens channel from lnd1ToLndOutside1", async () => {
  const socket = `lnd-outside-1:9735`
  const { balance: initFeeInLedger } = await MainBook.balance({
    account: lndFeePath,
    currency: "BTC",
  })
  await openChannelTesting({ lnd: lnd1, other_lnd: lndOutside1, socket })

  const { channels } = await getChannels({ lnd: lnd1 })
  expect(channels.length).toEqual(channelLengthMain + 1)
  const { balance: finalFeeInLedger } = await MainBook.balance({
    account: lndFeePath,
    currency: "BTC",
  })

  expect(finalFeeInLedger - initFeeInLedger).toBe(channelFee * -1)
})

// FIXME: we need a way to calculate the closing fee
// lnd doesn't give it back to us (undefined)
// and bitcoind doesn't give fee for "outside" wallet

// it('opensAndCloses channel from lnd1 to lndOutside1', async () => {

//   try {
//     const socket = `lnd-outside-1:9735`

//     await openChannelTesting({ lnd: lnd1, other_lnd: lndOutside1, socket })

//     let channels

//     ({ channels } = await getChannels({ lnd: lnd1 }));
//     expect(channels.length).toEqual(channelLengthMain + 1)

//     const sub = subscribeToChannels({ lnd: lnd1 })
//     sub.on('channel_closed', async (channel) => {
//       // onChannelUpdated({ channel, lnd: lnd1, stateChange: "closed" })
//     })

//     await lnService.closeChannel({ lnd: lnd1, id: channels[channels.length - 1].id })
//     const currentBlockCount = await bitcoindDefaultClient.getBlockCount()
//     await mineBlockAndSync({ lnds: [lnd1, lndOutside1], blockHeight: currentBlockCount + newBlock })

//     await sleep(10000)

//     // FIXME
//     // expect(finalFeeInLedger - initFeeInLedger).toBe(channelFee * -1)
//     sub.removeAllListeners()

//     await updateEscrows();

//     ({ channels } = await getChannels({ lnd: lnd1 }))
//     expect(channels.length).toEqual(channelLengthMain)
//   } catch (err) {
//     console.log({err}, "error with opensAndCloses")
//   }
// })

it("opens private channel from lndOutside1 to lndOutside2", async () => {
  const socket = `lnd-outside-2:9735`

  const subscription = subscribeToGraph({ lnd: lndOutside1 })

  await Promise.all([
    openChannelTesting({
      lnd: lndOutside1,
      other_lnd: lndOutside2,
      socket,
      is_private: true,
    }),
    once(subscription, "channel_updated"),
  ])

  subscription.removeAllListeners()

  const { channels } = await getChannels({ lnd: lndOutside1 })
  expect(channels.length).toEqual(channelLengthOutside1 + 1)
  expect(channels.some((e) => e.is_private))
})

it("opens channel from lndOutside1 to lnd1", async () => {
  const socket = `lnd1:9735`
  await openChannelTesting({ lnd: lndOutside1, other_lnd: lnd1, socket })

  {
    const { channels } = await getChannels({ lnd: lnd1 })
    expect(channels.length).toEqual(channelLengthMain + 1)
  }
})

it("opens channel from lnd1 to lnd2", async () => {
  const socket = `lnd2:9735`
  await openChannelTesting({ lnd: lnd1, other_lnd: lnd2, socket })
  const partner_public_key = offchainLnds[1].pubkey

  const { channels } = await getChannels({ lnd: lnd1 })
  expect(channels.length).toEqual(channelLengthMain + 1)

  const channel = _.find(channels, { partner_public_key })
  const input = {
    fee_rate: 0,
    base_fee_tokens: 0,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    transaction_id: channel!.transaction_id,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    transaction_vout: channel!.transaction_vout,
  }

  await updateRoutingFees({ lnd: lnd1, ...input })
  await updateRoutingFees({ lnd: lnd2, ...input })
})

it("escrow update ", async () => {
  await updateEscrows()
  await checkIsBalanced()

  await sleep(100)

  await updateEscrows()
  await checkIsBalanced()
})
