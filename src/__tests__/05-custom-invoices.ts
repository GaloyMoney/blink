/**
 * @jest-environment node
 */
import { getAuth } from "../utils";
const lnService = require('ln-service')
const lightningPayReq = require('bolt11')
const mongoose = require("mongoose")
const util = require('util')
const {decode} = require('bip66');


const logger = require('pino')({ level: "debug" })

beforeAll(async () => {

});

afterAll(async () => {

});


it('add invoice', async () => {
  // const request = await userWallet1.addInvoice({ value: 1000, memo: "tx 1" })
  // expect(request.startsWith("lnbcrt10")).toBeTruthy()

  const { lnd } = lnService.authenticatedLndGrpc(getAuth())
  const {parsePaymentRequest, createUnsignedRequest} = require('invoices');

  const request_org = (await lnService.createInvoice({lnd, description: "abc"})).request
  const decoded = parsePaymentRequest({request: request_org});

  decoded["username"] = "abcdef"

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
  console.log(util.inspect({ decoded, signature, hash, request_org, request_new: request }, false, Infinity))

  // decoded["features"].push({
  //   bit: 60, 
  // })


  const decoded_new = lightningPayReq.decode(request)
  // const decodedHash = decoded.tags.filter(item => item.tagName === "payment_hash")[0].data
  console.log(util.inspect({ decoded_new }, false, Infinity))

  // decoded['tags'].push({ 
  //   tagName: 'unknownTag',
  //   data: {
  //     tagCode: 60,
  //     words: "unknown19qsqwv58yh"
  // }})

  // delete decoded["signature"]
  // delete decoded["payeeNodeKey"]
  // delete decoded["recoveryFlag"]

  // console.log(util.inspect({ decoded }, false, Infinity))

  // console.log(util.inspect({ decoded }, false, Infinity))
  // const encoded = lightningPayReq.encode(decoded)
  // console.log(util.inspect({ decoded, encoded }, false, Infinity))


  // const privateKeyHex = 'e126f68f7eafcc8b74f54d269fe206be715000f94dac067d1c04a8ca3b2db734'
  // const signed = lightningPayReq.sign(encoded, privateKeyHex)
  
  // console.log({signed})

  // const { uid } = await InvoiceUser.findById(decodedHash)
  // //expect(uid).toBe(user1) does not work
  // expect(uid).toBe(uidFromToken1)
})
