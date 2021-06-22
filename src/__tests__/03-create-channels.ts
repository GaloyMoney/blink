/**
 * @jest-environment node
 */
import { once } from "events"
import { getChannels, subscribeToGraph } from "lightning"
import { updateEscrows } from "../ledger/balanceSheet"
import { lndFeePath } from "../ledger/ledger"
import { MainBook, setupMongoConnection } from "../mongodb"
import { bitcoindDefaultClient, sleep } from "../utils"
import {
  checkIsBalanced,
  lndMain,
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

  channelLengthMain = (await getChannels({ lnd: lndMain })).channels.length
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
  await openChannelTesting({ lnd: lndMain, other_lnd: lndOutside1, socket })

  const { channels } = await getChannels({ lnd: lndMain })
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

//     await openChannelTesting({ lnd: lndMain, other_lnd: lndOutside1, socket })

//     let channels

//     ({ channels } = await getChannels({ lnd: lndMain }));
//     expect(channels.length).toEqual(channelLengthMain + 1)

//     const sub = subscribeToChannels({ lnd: lndMain })
//     sub.on('channel_closed', async (channel) => {
//       // onChannelUpdated({ channel, lnd: lndMain, stateChange: "closed" })
//     })

//     await lnService.closeChannel({ lnd: lndMain, id: channels[channels.length - 1].id })
//     const currentBlockCount = await bitcoindDefaultClient.getBlockCount()
//     await mineBlockAndSync({ lnds: [lndMain, lndOutside1], blockHeight: currentBlockCount + newBlock })

//     await sleep(10000)

//     // FIXME
//     // expect(finalFeeInLedger - initFeeInLedger).toBe(channelFee * -1)
//     sub.removeAllListeners()

//     await updateEscrows();

//     ({ channels } = await getChannels({ lnd: lndMain }))
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
  await openChannelTesting({ lnd: lndOutside1, other_lnd: lndMain, socket })

  {
    const { channels } = await getChannels({ lnd: lndMain })
    expect(channels.length).toEqual(channelLengthMain + 1)
  }
})

it("escrow update ", async () => {
  await updateEscrows()
  await checkIsBalanced()

  await sleep(100)

  await updateEscrows()
  await checkIsBalanced()
})
