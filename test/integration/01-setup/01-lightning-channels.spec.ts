import {
  checkIsBalanced,
  closeChannel,
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
import { onChannelUpdated, updateEscrows } from "@services/lnd/utils"
import { ledger } from "@services/mongodb"

jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))
jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

//this is the fixed opening and closing channel fee on devnet
const channelFee = 7637
const lnds = [lnd1, lnd2, lndOutside1, lndOutside1]
let channelLengthMain, channelLengthOutside1

beforeEach(async () => {
  await waitUntilSync({ lnds })
  channelLengthMain = (await getChannels({ lnd: lnd1 })).channels.length
  channelLengthOutside1 = (await getChannels({ lnd: lndOutside1 })).channels.length
})

afterEach(async () => {
  await checkIsBalanced()
})

// Setup the next network
// lnd2 <- lnd1 <-> lndOutside1
// lnd2 <- lnd1 -> lndOutside2
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

    const initFeeInLedger = await ledger.getBankOwnerBalance()

    const { lndNewChannel: channel } = await openChannelTesting({
      lnd: lnd1,
      lndPartner: lndOutside1,
      socket,
    })

    const { channels } = await getChannels({ lnd: lnd1 })
    expect(channels.length).toEqual(channelLengthMain + 1)

    const finalFeeInLedger = await ledger.getBankOwnerBalance()
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

  it("opens channel from lnd1 to lndOutside2", async () => {
    const socket = `lnd-outside-2:9735`

    const initFeeInLedger = await ledger.getBankOwnerBalance()

    const { lndNewChannel: channel } = await openChannelTesting({
      lnd: lnd1,
      lndPartner: lndOutside2,
      socket,
    })

    const { channels } = await getChannels({ lnd: lnd1 })
    expect(channels.length).toEqual(channelLengthMain + 1)

    const finalFeeInLedger = await ledger.getBankOwnerBalance()
    expect(finalFeeInLedger - initFeeInLedger).toBe(channelFee * -1)

    await setChannelFees({ lnd: lnd1, channel, base: 1, rate: 0 })
    await setChannelFees({ lnd: lndOutside2, channel, base: 1, rate: 0 })
  })

  it.skip("opens private channel from lndOutside1 to lndOutside2", async () => {
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

    await setChannelFees({ lnd: lndOutside1, channel, base: 1, rate: 0 })
    await setChannelFees({ lnd: lndOutside2, channel, base: 1, rate: 0 })
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
