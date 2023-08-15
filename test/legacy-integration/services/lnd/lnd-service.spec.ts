import { createInvoice, getChannel, getChannels, pay } from "lightning"

import { LndService } from "@services/lnd"

import { decodeInvoice, RouteNotFoundError } from "@domain/bitcoin/lightning"

import { sleep } from "@utils"

import { lndOutside1, lndOutside3, setChannelFees } from "test/helpers"

const lndService = LndService()
if (lndService instanceof Error) throw lndService

describe("LndService", () => {
  const setFeesOnChannel = async ({ localLnd, partnerLnd, base, rate }) => {
    // Get routing channel details
    const { channels } = await getChannels({ lnd: partnerLnd })
    const {
      id: chanId,
      remote_balance: remoteBalance,
      remote_reserve: remoteReserve,
    } = channels[0]

    // Bump base fee on routing node for disproportionate probe fee
    const channel = await getChannel({ id: chanId, lnd: partnerLnd })
    let count = 0
    const countMax = 3
    let setOnLndOutside1
    while (count < countMax && setOnLndOutside1 !== true) {
      if (count > 0) await sleep(500)
      count++

      setOnLndOutside1 = await setChannelFees({
        lnd: localLnd,
        channel,
        base,
        rate,
      })
    }
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(countMax)
    expect(setOnLndOutside1).toBe(true)

    return {
      chanId,
      localBalance: remoteBalance,
      localReserve: remoteReserve,
    }
  }

  describe("findRouteForInvoice", () => {
    const lndService = LndService()
    if (lndService instanceof Error) throw lndService

    it("probes across route with fee higher than payment amount", async () => {
      const amountInvoice = 1

      const { localBalance, localReserve } = await setFeesOnChannel({
        localLnd: lndOutside1,
        partnerLnd: lndOutside3,
        base: 10,
        rate: 5000,
      })

      // Rebalance lndOutside3 route
      const { request: invoice } = await createInvoice({
        lnd: lndOutside1,
        tokens:
          localBalance < localReserve ? amountInvoice + localReserve : amountInvoice,
      })
      const rebalance = await pay({ lnd: lndOutside3, request: invoice })
      expect(rebalance.is_confirmed).toBe(true)
      await sleep(500) // rebalance can take some time to settle even after promise is resolved

      // Execute fee probe
      const { request } = await createInvoice({
        lnd: lndOutside3,
        tokens: amountInvoice,
        is_including_private_channels: true,
      })
      const decodedInvoice = decodeInvoice(request)
      if (decodedInvoice instanceof Error) throw decodedInvoice

      const probed = await lndService.findRouteForInvoice({
        invoice: decodedInvoice,
      })
      expect(probed).toBeInstanceOf(RouteNotFoundError)
    })
  })
})
