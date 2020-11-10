/**
 * @jest-environment node
 */
import { getAuth } from "../utils";
const lnService = require('ln-service')
const lightningPayReq = require('bolt11')
const mongoose = require("mongoose")
const util = require('util')
const {decode} = require('bip66');
const {parsePaymentRequest, createUnsignedRequest} = require('invoices');


const logger = require('pino')({ level: "debug" })

beforeAll(async () => {

});

afterAll(async () => {

});


it('add invoice', async () => {
  const username = "abcdef"

  // const request = await userWallet1.addInvoice({ value: 1000, memo: "tx 1" })
  // expect(request.startsWith("lnbcrt10")).toBeTruthy()

  const { lnd } = lnService.authenticatedLndGrpc(getAuth())

  const request_org = (await lnService.createInvoice({lnd, description: "abc"})).request
  const decoded = parsePaymentRequest({request: request_org});

  decoded["username"] = username

  const { preimage, hash, hrp, tags } = createUnsignedRequest(decoded);

  const {signature} = await lnService.signBytes({
    key_family: 6,
    key_index: 0,
    lnd,
    preimage,
  });

  const {r, s} = decode(Buffer.from(signature, 'hex'));

  const rValue = r.length === 33 ? r.slice(1) : r;

  const {request} = await lnService.createSignedRequest({
    destination: decoded.destination,
    hrp,
    signature: Buffer.concat([rValue, s]).toString('hex'),
    tags,
  });
  
  // console.log({request_org, request_new: request })
  // console.log(util.inspect({ decoded, signature, hash, request_org, request_new: request }, false, Infinity))
  // console.log(util.inspect({ requestDetails }, false, Infinity))

  // Decoded details of the payment request
  const requestDetails = parsePaymentRequest({request});

  expect(requestDetails.username).toBe(username)
})
