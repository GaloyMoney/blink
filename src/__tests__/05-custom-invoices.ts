/**
 * @jest-environment node
 */
import { decode } from "bip66"
import { createUnsignedRequest, parsePaymentRequest } from "invoices"
import lnService from "ln-service"
import { createInvoice, signBytes } from "lightning"
import util from "util"
import { lnd } from "../lndConfig"

it("add invoice", async () => {
  const username = "abcdef"

  // const request = await userWallet1.addInvoice({ value: 1000, memo: "tx 1" })
  // expect(request.startsWith("lnbcrt10")).toBeTruthy()

  const request_org = (await createInvoice({ lnd, description: "abc" })).request
  const decoded = parsePaymentRequest({ request: request_org })

  decoded["username"] = username

  const { preimage, hrp, tags } = createUnsignedRequest(decoded)

  const { signature } = await signBytes({
    key_family: 6,
    key_index: 0,
    lnd,
    preimage,
  })

  const { r, s } = decode(Buffer.from(signature, "hex"))

  const rValue = r.length === 33 ? r.slice(1) : r

  const { request } = await lnService.createSignedRequest({
    destination: decoded.destination,
    hrp,
    signature: Buffer.concat([rValue, s]).toString("hex"),
    tags,
  })

  // console.log({request_org, request_new: request })
  // console.log(util.inspect({ decoded, signature, hash, request_org, request_new: request }, false, Infinity))
  // console.log(util.inspect({ requestDetails }, false, Infinity))

  // Decoded details of the payment request
  const requestDetails = parsePaymentRequest({ request })

  console.log(
    util.inspect({ request, request_org, requestDetails, decoded }, false, Infinity),
  )

  expect(requestDetails.username).toBe(username)
})
