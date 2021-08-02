/**
 * how to run:
 * . ./.envrc && yarn ts-node src/debug/create-custom-invoices.ts
 */

import { decode } from "bip66"
import { createUnsignedRequest, parsePaymentRequest } from "invoices"
import { createInvoice, signBytes } from "lightning"
import util from "util"
import lnService from "ln-service"

import { getActiveLnd } from "@services/lnd/utils"

const { lnd } = getActiveLnd()

const createCustomInvoice = async () => {
  const username = "abcdef"
  const requestOrg = (await createInvoice({ lnd, description: "abc" })).request
  const decoded = parsePaymentRequest({ request: requestOrg })
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

  // console.log({requestOrg, request_new: request })
  // console.log(util.inspect({ decoded, signature, hash, requestOrg, request_new: request }, false, Infinity))
  // console.log(util.inspect({ requestDetails }, false, Infinity))

  // Decoded details of the payment request
  const requestDetails = parsePaymentRequest({ request })

  return { request, requestOrg, requestDetails, decoded }
}

const main = async () => {
  const customInvoice = await createCustomInvoice()
  return util.inspect(customInvoice, false, Infinity)
}

main()
  .then((o) => console.log(o))
  .catch((err) => console.log(err))
