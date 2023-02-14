import { createInvoice } from "lightning"

import { LndService } from "@services/lnd"

import {
  decodeInvoice,
  MaxFeeTooLargeForRoutelessPaymentError,
} from "@domain/bitcoin/lightning"
import { LnFees } from "@domain/payments"
import { AmountCalculator, WalletCurrency } from "@domain/shared"

import { lndOutside1 } from "test/helpers"

const calc = AmountCalculator()

const ONE_SAT = { amount: 1n, currency: WalletCurrency.Btc }

const lndService = LndService()
if (lndService instanceof Error) throw lndService

describe("LndService", () => {
  describe("payInvoiceViaPaymentDetails", () => {
    const btcPaymentAmount = { amount: 1001n, currency: WalletCurrency.Btc }
    const feeAmount = LnFees().maxProtocolAndBankFee(btcPaymentAmount)

    it("pays with fee at the max limit", async () => {
      const { request } = await createInvoice({ lnd: lndOutside1 })
      const decodedInvoice = decodeInvoice(request)
      if (decodedInvoice instanceof Error) throw decodedInvoice

      const paid = await lndService.payInvoiceViaPaymentDetails({
        decodedInvoice,
        btcPaymentAmount,
        maxFeeAmount: feeAmount,
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
      })
      expect(paid).toBeInstanceOf(MaxFeeTooLargeForRoutelessPaymentError)
    })
  })
})
