import { mineBlockAndSync, openChannelTesting } from './helper'
import {closeChannel, createInvoice, getChannels, openChannel, pay} from 'lightning'
import { lndMain, lndOutside1, lndOutside2 } from './helper'
import { bitcoindDefaultClient, sleep } from '../utils'
import { updateRoutingFees } from '../lndUtils'
import { MainBook, setupMongoConnection } from '../mongodb'
import { revenueFeePath } from '../ledger/ledger'

beforeAll(async () => {
  await setupMongoConnection()
  
  // let currentBlockCount = await bitcoindDefaultClient.getBlockCount()
  // await mineBlockAndSync({ lnds: [lndOutside2, lndOutside1, lndMain], blockHeight: currentBlockCount + 6 })
  // await sleep(10000)
})

afterAll(async () => {
  jest.restoreAllMocks();
})

it('records routing fee correctly', async () => {
  const { request } = await createInvoice({ lnd: lndOutside2, tokens: 1000 })
  
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

  expect(balance).toBe(1.001)
})