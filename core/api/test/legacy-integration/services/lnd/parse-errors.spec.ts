import {
  createInvoice,
  payViaPaymentDetails,
  payViaRoutes,
  LightningError as LnError,
} from "lightning"

import { decodeInvoice } from "@/domain/bitcoin/lightning"
import { getActiveLnd, parseLndErrorDetails } from "@/services/lnd/config"

import { getError, lndOutside1 } from "test/helpers"

describe("'lightning' library error handling", () => {
  const activeNode = getActiveLnd()
  if (activeNode instanceof Error) throw activeNode

  const lnd = activeNode.lnd

  // Test construction taken from:
  // https://github.com/alexbosworth/lightning/blob/edcaf671e6a0bd2d8f8aa39b51ef816b2a633560/test/lnd_methods/offchain/test_pay_via_routes.js#L28
  it("parses error message when no additional details are found", async () => {
    const payArgs = { id: "id", lnd, routes: [] }
    const err = await getError<LnError>(() => payViaRoutes(payArgs))
    expect(err).toHaveLength(2)
    expect(err[0]).toEqual(400)

    const parsedErr = parseLndErrorDetails(err)
    expect(parsedErr).toBe("ExpectedStandardHexPaymentHashId")
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

    await payViaPaymentDetails(paymentDetailsArgs)

    const err = await getError<LnError>(() => payViaPaymentDetails(paymentDetailsArgs))
    expect(err).toHaveLength(3)
    expect(err[0]).toEqual(503)
    expect(err[1]).toBe("UnexpectedPaymentError")
    expect(err[2]).toHaveProperty("err")
    expect(err[2]).not.toHaveProperty("failures")

    const nestedErrObj = err[2].err
    expect(nestedErrObj).toBeInstanceOf(Error)
    expect(nestedErrObj).toHaveProperty("code")
    expect(nestedErrObj).toHaveProperty("metadata")

    const expectedDetails = "invoice is already paid"
    expect(nestedErrObj).toHaveProperty("details", expectedDetails)

    const parsedErr = parseLndErrorDetails(err)
    expect(parsedErr).toBe(expectedDetails)
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

    const err = await getError<LnError<{ failures: LnError }>>(() =>
      payViaRoutes(payArgs),
    )
    expect(err).toHaveLength(3)
    expect(err[0]).toEqual(503)
    expect(err[1]).toBe("UnexpectedErrorWhenPayingViaRoute")

    const nestedFailureErr = err[2].failures[0]
    expect(nestedFailureErr).toHaveLength(3)

    /* eslint @typescript-eslint/ban-ts-comment: "off" */
    // @ts-ignore-next-line no-implicit-any error
    expect(nestedFailureErr[0]).toEqual(err[0])

    // @ts-ignore-next-line no-implicit-any error
    expect(nestedFailureErr[1]).toBe(err[1])

    // @ts-ignore-next-line no-implicit-any error
    const nestedErrObj = nestedFailureErr[2].err
    expect(nestedErrObj).toBeInstanceOf(Error)
    expect(nestedErrObj).toHaveProperty("code")
    expect(nestedErrObj).toHaveProperty("metadata")

    const expectedDetails = "invalid public key: unsupported format: 0"
    expect(nestedErrObj).toHaveProperty("details", expectedDetails)

    const parsedErr = parseLndErrorDetails(err)
    expect(parsedErr).toBe(expectedDetails)
  })
})
