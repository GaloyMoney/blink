import { createInvoice, getChannel, getChannels, pay } from "lightning"

import { LndService } from "@services/lnd"

import {
  decodeInvoice,
  MaxFeeTooLargeForRoutelessPaymentError,
  RouteNotFoundError,
} from "@domain/bitcoin/lightning"
import { LnFees, PriceRatio } from "@domain/payments"
import { AmountCalculator, ONE_SAT, WalletCurrency } from "@domain/shared"
import { FEECAP_BASIS_POINTS } from "@domain/bitcoin"

import { sleep } from "@utils"

import { lndOutside1, lndOutside3, setChannelFees } from "test/helpers"

const calc = AmountCalculator()

const lndService = LndService()
if (lndService instanceof Error) throw lndService

describe("LndService", () => {
  describe("payInvoiceViaPaymentDetails", () => {
    const btcPaymentAmount = { amount: 50_000n, currency: WalletCurrency.Btc }
    const usdPaymentAmount = {
      amount: calc.divRound(btcPaymentAmount, FEECAP_BASIS_POINTS).amount,
      currency: WalletCurrency.Usd,
    }
    const feeAmount = LnFees().maxProtocolAndBankFee(btcPaymentAmount)

    const priceRatio = PriceRatio({
      btc: btcPaymentAmount,
      usd: usdPaymentAmount,
    })
    if (priceRatio instanceof Error) throw priceRatio

    it("pays with fee at the max limit", async () => {
      const { request } = await createInvoice({ lnd: lndOutside1 })
      const decodedInvoice = decodeInvoice(request)
      if (decodedInvoice instanceof Error) throw decodedInvoice

      const paid = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice,
        btcPaymentAmount,
        maxFeeAmount: feeAmount,
        priceRatio,
      })
      expect(paid).not.toBeInstanceOf(Error)
    })

    it("pays 1 sat with fee at the max limit", async () => {
      const { request } = await createInvoice({ lnd: lndOutside1 })
      const decodedInvoice = decodeInvoice(request)
      if (decodedInvoice instanceof Error) throw decodedInvoice

      const maxFeeAmount = LnFees().minFeeFromPriceRatio(priceRatio)
      const paid = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice,
        btcPaymentAmount: ONE_SAT,
        maxFeeAmount,
        priceRatio,
      })
      expect(paid).not.toBeInstanceOf(Error)
    })

    it("fails to pay with fee above max limit", async () => {
      const { request } = await createInvoice({ lnd: lndOutside1 })
      const decodedInvoice = decodeInvoice(request)
      if (decodedInvoice instanceof Error) throw decodedInvoice

      const paid = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice,
        btcPaymentAmount,
        maxFeeAmount: calc.add(feeAmount, ONE_SAT),
        priceRatio,
      })
      expect(paid).toBeInstanceOf(MaxFeeTooLargeForRoutelessPaymentError)
    })
  })

  describe("findRouteForInvoice", () => {
    const lndService = LndService()
    if (lndService instanceof Error) throw lndService

    it("probes across route with fee higher than payment amount", async () => {
      const amountInvoice = 1

      // Get routing channel details
      const { channels } = await getChannels({ lnd: lndOutside3 })
      const {
        id: chanId,
        remote_balance: remoteBalance,
        remote_reserve: remoteReserve,
      } = channels[0]

      // Rebalance lndOutside3 route
      const { request: invoice } = await createInvoice({
        lnd: lndOutside1,
        tokens:
          remoteBalance < remoteReserve ? amountInvoice + remoteReserve : amountInvoice,
      })
      const rebalance = await pay({ lnd: lndOutside3, request: invoice })
      expect(rebalance.is_confirmed).toBe(true)
      await sleep(500) // rebalance can take some time to settle even after promise is resolved

      // Bump base fee on routing node for disproportionate probe fee
      const channel = await getChannel({ id: chanId, lnd: lndOutside3 })
      let count = 0
      const countMax = 3
      let setOnLndOutside1
      while (count < countMax && setOnLndOutside1 !== true) {
        if (count > 0) await sleep(500)
        count++

        setOnLndOutside1 = await setChannelFees({
          lnd: lndOutside1,
          channel,
          base: 10,
          rate: 5000,
        })
      }
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThan(countMax)
      expect(setOnLndOutside1).toBe(true)

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
