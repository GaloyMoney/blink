import { onChannelUpdated, updateEscrows } from "@services/lnd/utils"
import { ledgerAdmin } from "@services/mongodb"
import { sleep } from "@utils"

import {
  checkIsBalanced,
  closeChannel,
  getChannel,
  getChannels,
  lnd1,
  lnd2,
  lndOutside1,
  lndOutside2,
  mineBlockAndSync,
  openChannelTesting,
  setChannelFees,
  subscribeToChannels,
  waitFor,
  waitUntilSync,
} from "test/helpers"

//this is the fixed opening and closing channel fee on devnet
const channelFee = 7700
const lnds = [lnd1, lnd2, lndOutside1, lndOutside1]
let channelLengthMain: number, channelLengthOutside1: number

beforeEach(async () => {
  await waitUntilSync({ lnds })
  channelLengthMain = (await getChannels({ lnd: lnd1 })).channels.length
  channelLengthOutside1 = (await getChannels({ lnd: lndOutside1 })).channels.length
})

afterEach(async () => {
  await checkIsBalanced()
})

// Setup the next network
// lnd2 <- lnd1 <-> lndOutside1 -> lndOutside2
// this setup avoids close channels for routing fees tests
describe("Lightning channels", () => {
  it("opens channel from lnd1 to lnd2", async () => {
    const socket = `lnd2:9735`
    const { lndNewChannel: channel } = await openChannelTesting({
      lnd: lnd1,
      lndPartner: lnd2,
      socket,
    })

    const { channels } = await getChannels({ lnd: lnd1 })
    expect(channels.length).toEqual(channelLengthMain + 1)

    await setChannelFees({ lnd: lnd1, channel, base: 0, rate: 0 })
    await setChannelFees({ lnd: lnd2, channel, base: 0, rate: 0 })
  })

  it("opens channel from lnd1 to lndOutside1", async () => {
    const socket = `lnd-outside-1:9735`

    const initFeeInLedger = await ledgerAdmin.getBankOwnerBalance()

    const { lndNewChannel: channel } = await openChannelTesting({
      lnd: lnd1,
      lndPartner: lndOutside1,
      socket,
    })

    const { channels } = await getChannels({ lnd: lnd1 })
    expect(channels.length).toEqual(channelLengthMain + 1)

    const finalFeeInLedger = await ledgerAdmin.getBankOwnerBalance()
    expect(finalFeeInLedger - initFeeInLedger).toBe(channelFee * -1)

    await setChannelFees({ lnd: lnd1, channel, base: 1, rate: 0 })
    await setChannelFees({ lnd: lndOutside1, channel, base: 1, rate: 0 })
  })

  it("opens channel from lndOutside1 to lnd1", async () => {
    const socket = `lnd1:9735`

    const { lndNewChannel: channel } = await openChannelTesting({
      lnd: lndOutside1,
      lndPartner: lnd1,
      socket,
    })

    const { channels } = await getChannels({ lnd: lnd1 })
    expect(channels.length).toEqual(channelLengthMain + 1)

    await setChannelFees({ lnd: lnd1, channel, base: 1, rate: 0 })
    await setChannelFees({ lnd: lndOutside1, channel, base: 1, rate: 0 })
  })

  it("opens private channel from lndOutside1 to lndOutside2", async () => {
    const socket = `lnd-outside-2:9735`

    const { lndNewChannel: channel } = await openChannelTesting({
      lnd: lndOutside1,
      lndPartner: lndOutside2,
      socket,
      is_private: true,
    })

    const { channels } = await getChannels({ lnd: lndOutside1 })
    expect(channels.length).toEqual(channelLengthOutside1 + 1)
    expect(channels.some((e) => e.is_private)).toBe(true)

    // Set fee policy on lndOutside1 as routing node between lnd1 and lndOutside2
    let count = 0
    let countMax = 3
    let setOnLndOutside1
    while (count < countMax && setOnLndOutside1 !== true) {
      if (count > 0) await sleep(500)
      count++

      setOnLndOutside1 = await setChannelFees({
        lnd: lndOutside1,
        channel,
        base: 0,
        rate: 5000,
      })
    }
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(countMax)
    expect(setOnLndOutside1).toBe(true)

    let policies
    let errMsg: string | undefined = "FullChannelDetailsNotFound"
    count = 0
    countMax = 8
    // Try to getChannel for up to 2 secs (250ms x 8)
    while (count < countMax && errMsg === "FullChannelDetailsNotFound") {
      count++
      await sleep(250)
      try {
        ;({ policies } = await getChannel({ id: channel.id, lnd: lndOutside1 }))
        errMsg = undefined
      } catch (err) {
        errMsg = err[1]
      }
    }
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(countMax)
    expect(errMsg).not.toBe("FullChannelDetailsNotFound")
    expect(policies && policies.length).toBeGreaterThan(0)

    const { base_fee_mtokens, fee_rate, public_key } = policies[0]
    expect(public_key).toBe(process.env.LND_OUTSIDE_1_PUBKEY)
    expect(base_fee_mtokens).toBe("0")
    expect(fee_rate).toEqual(5000)
  })

  // FIXME: we need a way to calculate the closing fee
  // lnd doesn't give it back to us (undefined)
  // and bitcoind doesn't give fee for "outside" wallet
  it.skip("opensAndCloses channel from lnd1 to lndOutside1", async () => {
    const socket = `lnd-outside-1:9735`

    await openChannelTesting({ lnd: lnd1, lndPartner: lndOutside1, socket })

    const { channels } = await getChannels({ lnd: lnd1 })
    expect(channels.length).toEqual(channelLengthMain + 1)

    let closedChannel
    const sub = subscribeToChannels({ lnd: lnd1 })
    sub.on("channel_closed", async (channel) => {
      await onChannelUpdated({ channel, lnd: lnd1, stateChange: "closed" })
      closedChannel = channel
    })

    await closeChannel({ lnd: lnd1, id: channels[channels.length - 1].id })

    await Promise.all([waitFor(() => closedChannel), mineBlockAndSync({ lnds })])

    // FIXME
    // expect(finalFeeInLedger - initFeeInLedger).toBe(channelFee * -1)
    sub.removeAllListeners()

    await updateEscrows()

    {
      const { channels } = await getChannels({ lnd: lnd1 })
      expect(channels.length).toEqual(channelLengthMain)
    }
  })
})
