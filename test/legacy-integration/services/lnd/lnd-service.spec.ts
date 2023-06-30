import { createInvoice, getChannel, getChannels, pay } from "lightning"

import { LndService } from "@services/lnd"

import { decodeInvoice, RouteNotFoundError } from "@domain/bitcoin/lightning"
import { LnFees } from "@domain/payments"
import { WalletCurrency } from "@domain/shared"

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

  const fetchChannelReserves = async ({ localPubkey, partnerLnd }) => {
    const { channels } = await getChannels({ lnd: partnerLnd })
    const {
      id: chanId,
      remote_balance: remoteBalance,
      remote_reserve: remoteReserve,
      partner_public_key: localPubkeyForChannel,
    } = channels[0]

    expect(localPubkey).toBe(localPubkeyForChannel)

    return { chanId, localBalance: remoteBalance, localReserve: remoteReserve }
  }

  describe("payInvoiceViaPaymentDetails", () => {
    const btcPaymentAmount = { amount: 1n, currency: WalletCurrency.Btc }
    const btcAmountAsNumber = Number(btcPaymentAmount.amount)

    const NUM_EXPECTED_PAYMENTS = 2
    const rebalanceAmount = btcAmountAsNumber * NUM_EXPECTED_PAYMENTS

    it("pays high fee route with no max limit", async () => {
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
          localBalance < localReserve ? rebalanceAmount + localReserve : rebalanceAmount,
      })
      const rebalance = await pay({ lnd: lndOutside3, request: invoice })
      expect(rebalance.is_confirmed).toBe(true)
      await sleep(500) // rebalance can take some time to settle even after promise is resolved

      const { localBalance: localBalanceAfter, localReserve: localReserveAfter } =
        await fetchChannelReserves({
          localPubkey: process.env.LND_OUTSIDE_1_PUBKEY as Pubkey,
          partnerLnd: lndOutside3,
        })
      expect(localBalanceAfter - localReserveAfter).toBeGreaterThanOrEqual(
        btcAmountAsNumber,
      )

      const { request } = await createInvoice({ lnd: lndOutside3 })
      const decodedInvoice = decodeInvoice(request)
      if (decodedInvoice instanceof Error) throw decodedInvoice

      const paid = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice,
        btcPaymentAmount,
        maxFeeAmount: undefined,
      })
      if (paid instanceof Error) throw paid
      const { roundedUpFee } = paid
      expect(roundedUpFee).toBeGreaterThan(btcAmountAsNumber)
    })

    it("fails to pay high fee route with max limit set", async () => {
      const { localBalance, localReserve } = await fetchChannelReserves({
        localPubkey: process.env.LND_OUTSIDE_1_PUBKEY as Pubkey,
        partnerLnd: lndOutside3,
      })
      expect(localBalance - localReserve).toBeGreaterThanOrEqual(btcAmountAsNumber)

      const { request } = await createInvoice({ lnd: lndOutside3 })
      const decodedInvoice = decodeInvoice(request)
      if (decodedInvoice instanceof Error) throw decodedInvoice

      const paid = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice,
        btcPaymentAmount,
        maxFeeAmount: LnFees().maxProtocolAndBankFee(btcPaymentAmount),
      })
      expect(paid).toBeInstanceOf(RouteNotFoundError)
    })
  })

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
