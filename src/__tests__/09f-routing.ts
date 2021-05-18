import { mineBlockAndSync, openChannelTesting } from './helper'
import {closeChannel, createInvoice, getChannels, getNetworkGraph, getPendingChannels, getNetworkInfo, getWalletInfo, openChannel, pay} from 'lightning'
import { lnd1, lndOutside1, lndOutside2 } from './helper'
import { bitcoindDefaultClient, sleep } from '../utils'
import { addPeer } from 'ln-service'
import { updateRoutingFees } from '../lndUtils'
import { MainBook, setupMongoConnection } from '../mongodb'
import { revenueFeePath } from '../ledger/ledger'

beforeAll(async () => {
  await setupMongoConnection()
})

afterAll(async () => {
  jest.restoreAllMocks();
})

it('records routing fee correctly', async () => {
  console.log(await getNetworkGraph({lnd: lndOutside1}))
  console.log(await getNetworkGraph({lnd: lndOutside2}))
  console.log(await getNetworkGraph({lnd: lnd1}))

  console.log(await getNetworkInfo({lnd: lndOutside1}))
  console.log(await getNetworkInfo({lnd: lndOutside2}))
  console.log(await getNetworkInfo({lnd: lnd1}))

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