/**
 * @jest-environment node
 */
import { once } from 'events';
import { closeChannel, getChannels, getWalletInfo, openChannel, subscribeToChannels, subscribeToGraph } from 'lightning';
import mongoose from "mongoose";
import { onChannelUpdated } from '../entrypoint/trigger';
import { updateEscrows } from "../ledger/balanceSheet";
import { lndFeePath } from "../ledger/ledger";
import { MainBook, setupMongoConnection } from "../mongodb";
import { bitcoindDefaultClient, sleep } from "../utils";
import { baseLogger } from '../logger'
import { checkIsBalanced, lndMain, lndOutside1, lndOutside2, mockGetExchangeBalance, RANDOM_ADDRESS, waitUntilBlockHeight } from "./helper";

jest.mock('../realtimePrice')


const local_tokens = 1000000

let initBlockCount
let channelLengthMain, channelLengthOutside1


beforeAll(async () => {
  await setupMongoConnection()
  mockGetExchangeBalance()
})

beforeEach(async () => {
  initBlockCount = await bitcoindDefaultClient.getBlockCount()

  channelLengthMain = (await getChannels({ lnd: lndMain })).channels.length
  channelLengthOutside1 = (await getChannels({ lnd: lndOutside1 })).channels.length
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks();
  // return await mongoose.connection.close()
})

const newBlock = 6

//this is the fixed opening and closing channel fee on devnet
const channelFee = 7637

const openChannelTesting = async ({ lnd, other_lnd, socket, is_private = false }) => {

  await waitUntilBlockHeight({ lnd: lndMain, blockHeight: initBlockCount })
  await waitUntilBlockHeight({ lnd: other_lnd, blockHeight: initBlockCount })

  const { public_key: partner_public_key } = await getWalletInfo({ lnd: other_lnd })

  let openChannelPromise = openChannel({
    lnd, local_tokens, is_private, partner_public_key, partner_socket: socket
  })

  const sub = subscribeToChannels({ lnd })

  if (lnd === lndMain) {
    sub.once('channel_opened', (channel) => onChannelUpdated({ channel, lnd, stateChange: "opened" }))
  }

  if (other_lnd === lndMain) {
    sub.once('channel_opened', (channel) => expect(channel.is_partner_initiated).toBe(true))
  }

  await once(sub, 'channel_opening')

  await mineBlockAndSync({ lnds: [lnd, other_lnd], blockHeight: initBlockCount + newBlock })

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

const mineBlockAndSync = async ({ lnds, blockHeight }: { lnds: Array<any>, blockHeight: number }) => {
  await bitcoindDefaultClient.generateToAddress(newBlock, RANDOM_ADDRESS)
  const promiseArray: Array<Promise<any>> = []
  for (const lnd of lnds) {
    promiseArray.push(waitUntilBlockHeight({ lnd, blockHeight }))
  }
  await Promise.all(promiseArray)
}

it('opens channel from lnd1ToLndOutside1', async () => {
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

  expect(finalFeeInLedger - initFeeInLedger).toBe(channelFee * -1 )
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

it('opens private channel from lndOutside1 to lndOutside2', async () => {
  const socket = `lnd-outside-2:9735`

  const subscription = subscribeToGraph({ lnd: lndOutside1 });

  await Promise.all([
    openChannelTesting({ lnd: lndOutside1, other_lnd: lndOutside2, socket, is_private: true }),
    once(subscription, 'channel_updated')
  ])

  subscription.removeAllListeners();

  const { channels } = await getChannels({ lnd: lndOutside1 })
  expect(channels.length).toEqual(channelLengthOutside1 + 1)
  expect(channels.some(e => e.is_private))
})

it('opens channel from lndOutside1 to lnd1', async () => {
  const socket = `lnd:9735`
  await openChannelTesting({ lnd: lndOutside1, other_lnd: lndMain, socket })

  {
    const { channels } = await getChannels({ lnd: lndMain })
    expect(channels.length).toEqual(channelLengthMain + 1)
  }

})

it('escrow update ', async () => {
  await updateEscrows()
  await checkIsBalanced()

  await sleep(100)

  await updateEscrows()
  await checkIsBalanced()
})
