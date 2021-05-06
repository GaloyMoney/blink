import { mineBlockAndSync, openChannelTesting } from './helper'
import {closeChannel, createInvoice, getChannels, openChannel, pay} from 'lightning'
import { lndMain, lndOutside1, lndOutside2 } from './helper'
import { bitcoindDefaultClient, sleep } from '../utils'
import { updateRoutingFees } from '../lndUtils'
import { MainBook, setupMongoConnection } from '../mongodb'
import { revenueFeePath } from '../ledger/ledger'

beforeAll(async () => {
  await setupMongoConnection()
  // remove direct connection between lndoutside1 and lndoutside2
  const { channels } = await getChannels({ lnd: lndOutside2 })
  await closeChannel({ lnd: lndOutside2, id: channels[channels.length - 1].id })

  const currentBlockCount = await bitcoindDefaultClient.getBlockCount()
  await mineBlockAndSync({ lnds: [lndOutside2, lndOutside1], blockHeight: currentBlockCount + 6 })
  await sleep(10000)
  
  // open channel from lndMain to lndOutside2
  // So that we have a route from lndOutside 1 to lndOutside2 via lndMain
  const socket = `lnd-outside-2:9735`
  await openChannelTesting({ lnd: lndMain, other_lnd: lndOutside2, socket })
})

afterAll(async () => {
  jest.restoreAllMocks();
})

it('records routing fee correctly', async () => {
  const { request } = await createInvoice({ lnd: lndOutside2, tokens: 100000 })
  
  await pay({ lnd: lndOutside1, request })

  const date = Date.now() + 60 * 60 * 1000 * 24 * 2
  jest
      .spyOn(global.Date, 'now')
      .mockImplementation(() =>
      new Date(date).valueOf()
    );

  await updateRoutingFees()

  const {balance} = await MainBook.balance({
    accounts: revenueFeePath
  })

  expect(balance).toBe(1.1)
})