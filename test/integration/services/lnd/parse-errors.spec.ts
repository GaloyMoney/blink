import { decodeInvoice } from "@domain/bitcoin/lightning"
import { getActiveLnd, parseLndErrorDetails } from "@services/lnd/utils"

import { createInvoice, payViaPaymentDetails, payViaRoutes } from "lightning"

import { lndOutside1 } from "test/helpers"

describe("'lightning' library error handling", () => {
  const activeNode = getActiveLnd()
  if (activeNode instanceof Error) throw activeNode

  const lnd = activeNode.lnd

  // Test construction taken from:
  // https://github.com/alexbosworth/lightning/blob/edcaf671e6a0bd2d8f8aa39b51ef816b2a633560/test/lnd_methods/offchain/test_pay_via_routes.js#L28
  it("parses error message when no additional details are found", async () => {
    const payArgs = { id: "id", lnd, routes: [] }
    try {
      await payViaRoutes(payArgs)
    } catch (err) {
      expect(err).toHaveLength(2)
      expect(err[0]).toEqual(400)

      const parsedErr = parseLndErrorDetails(err)
      expect(parsedErr).toBe("ExpectedStandardHexPaymentHashId")
    }
  })

  it("parses error message from err object", async () => {
    const { request } = await createInvoice({
      lnd: lndOutside1,
      tokens: 1000,
    })
    const decodedInvoice = decodeInvoice(request as EncodedPaymentRequest)
    expect(decodedInvoice).not.toBeInstanceOf(Error)
    if (decodedInvoice instanceof Error) throw decodedInvoice

    const paymentDetailsArgs = {
      lnd,
      id: decodedInvoice.paymentHash,
      destination: decodedInvoice.destination,
      mtokens: decodedInvoice.milliSatsAmount.toString(),
      payment: decodedInvoice.paymentSecret as string,
      cltv_delta: decodedInvoice.cltvDelta || undefined,
      features: decodedInvoice.features
        ? decodedInvoice.features.map((f) => ({
            bit: f.bit,
            is_required: f.isRequired,
            type: f.type,
          }))
        : undefined,
      routes: [],
    }

    try {
      await payViaPaymentDetails(paymentDetailsArgs)
      await payViaPaymentDetails(paymentDetailsArgs)
    } catch (err) {
      expect(err).toHaveLength(3)
      expect(err[0]).toEqual(503)
      expect(err[1]).toBe("UnexpectedPaymentError")
      expect(err[2]).toHaveProperty("err")
      expect(err[2]).not.toHaveProperty("failures")

      const nestedErrObj = err[2].err
      expect(nestedErrObj).toBeInstanceOf(Error)
      expect(nestedErrObj).toHaveProperty("code")
      expect(nestedErrObj).toHaveProperty("metadata")
      expect(nestedErrObj).toHaveProperty("details")

      const expectedDetails = "invoice is already paid"
      expect(nestedErrObj.details).toBe(expectedDetails)

      const parsedErr = parseLndErrorDetails(err)
      expect(parsedErr).toBe(expectedDetails)
    }
  })

  it("parses error message from failures object", async () => {
    const payArgs = {
      lnd,
      routes: [
        {
          fee: 1,
          fee_mtokens: "1000",
          hops: [
            {
              channel: "1x1x1",
              channel_capacity: 1,
              fee: 1,
              fee_mtokens: "1000",
              forward: 1,
              forward_mtokens: "1000",
              public_key: Buffer.alloc(33).toString("hex"),
              timeout: 100,
            },
          ],
          mtokens: "1000",
          timeout: 100,
          tokens: 1,
        },
      ],
    }
    try {
      await payViaRoutes(payArgs)
    } catch (err) {
      expect(err).toHaveLength(3)
      expect(err[0]).toEqual(503)
      expect(err[1]).toBe("UnexpectedErrorWhenPayingViaRoute")

      const nestedFailureErr = err[2].failures[0]
      expect(nestedFailureErr).toHaveLength(3)
      expect(nestedFailureErr[0]).toEqual(err[0])
      expect(nestedFailureErr[1]).toBe(err[1])

      const nestedErrObj = nestedFailureErr[2].err
      expect(nestedErrObj).toBeInstanceOf(Error)
      expect(nestedErrObj).toHaveProperty("code")
      expect(nestedErrObj).toHaveProperty("metadata")
      expect(nestedErrObj).toHaveProperty("details")

      const expectedDetails = "invalid public key: unsupported format: 0"
      expect(nestedErrObj.details).toBe(expectedDetails)

      const parsedErr = parseLndErrorDetails(err)
      expect(parsedErr).toBe(expectedDetails)
    }
  })
})
