import { Lightning } from "@/app"

import { TWO_MONTHS_IN_MS } from "@/config"

import { decodeInvoice } from "@/domain/bitcoin/lightning"
import { CouldNotFindLnPaymentFromHashError } from "@/domain/errors"

import * as LndImpl from "@/services/lnd"
import { LnPayment } from "@/services/lnd/schema"
import { LnPaymentsRepository } from "@/services/mongoose"

const DEFAULT_PUBKEY =
  "03ca1907342d5d37744cb7038375e1867c24a87564c293157c95b2a9d38dcfb4c2" as Pubkey

const randomRequest =
  "lnbcrt10n1p39jatkpp5djwv295kunhe5e0e4whj3dcjzwy7cmcxk8cl2a4dquyrp3dqydesdqqcqzpuxqr23ssp56u5m680x7resnvcelmsngc64ljm7g5q9r26zw0qyq5fenuqlcfzq9qyyssqxv4kvltas2qshhmqnjctnqkjpdfzu89e428ga6yk9jsp8rf382f3t03ex4e6x3a4sxkl7ruj6lsfpkuu9u9ee5kgr5zdyj7x2nwdljgq74025p"
const invoice = decodeInvoice(randomRequest)
if (invoice instanceof Error) throw invoice

afterEach(async () => {
  await LnPayment.deleteMany({})

  jest.restoreAllMocks()
})

describe("deleteLnPaymentsBefore", () => {
  const lnPayments = LnPaymentsRepository()
  const { paymentHash, paymentRequest } = invoice
  const mockedLnPaymentLookup = {
    createdAt: new Date(Date.now()),
    paymentHash,
    paymentRequest,
  }

  it("persists payment to be deleted in ln-payments collection", async () => {
    // Setup mocks
    const { LndService: LnServiceOrig } = jest.requireActual("@/services/lnd")
    jest.spyOn(LndImpl, "LndService").mockReturnValue({
      ...LnServiceOrig(),
      listActivePubkeys: () => [DEFAULT_PUBKEY],
      listSettledPayments: () => ({
        lnPayments: [mockedLnPaymentLookup],
        endCursor: false,
      }),
      lookupPayment: () => mockedLnPaymentLookup,
    })

    // Check doesn't exist
    const lnPaymentBefore = await lnPayments.findByPaymentHash(paymentHash)
    expect(lnPaymentBefore).toBeInstanceOf(CouldNotFindLnPaymentFromHashError)

    // Run deleteLnPaymentsBefore
    const timestampNow = new Date()
    await Lightning.deleteLnPaymentsBefore(timestampNow)

    // Check exists
    const lnPaymentAfter = await lnPayments.findByPaymentHash(paymentHash)
    if (lnPaymentAfter instanceof Error) throw lnPaymentAfter
    expect(lnPaymentAfter.paymentHash).toBe(paymentHash)
  })

  it("deletes ln-payment before appropriate time", async () => {
    // Setup mocks
    const deletePaymentByHash = jest.fn()
    const { LndService: LnServiceOrig } = jest.requireActual("@/services/lnd")
    jest.spyOn(LndImpl, "LndService").mockReturnValue({
      ...LnServiceOrig(),
      listActivePubkeys: () => [DEFAULT_PUBKEY],
      listSettledPayments: () => ({
        lnPayments: [mockedLnPaymentLookup],
        endCursor: false,
      }),
      lookupPayment: () => mockedLnPaymentLookup,
      deletePaymentByHash,
    })

    await lnPayments.persistNew({
      paymentRequest,
      paymentHash,
      sentFromPubkey: DEFAULT_PUBKEY,
    })
    await lnPayments.update({
      paymentHash,
      isCompleteRecord: true,
    } as PersistedLnPaymentLookup)

    // Run deleteLnPaymentsBefore for 2 month old invoices
    const timestamp2Months = new Date(Date.now() - TWO_MONTHS_IN_MS)
    await Lightning.deleteLnPaymentsBefore(timestamp2Months)
    expect(deletePaymentByHash.mock.calls).toHaveLength(0)

    // Run deleteLnPaymentsBefore for all invoices
    const timestampNow = new Date()
    await Lightning.deleteLnPaymentsBefore(timestampNow)
    expect(deletePaymentByHash.mock.calls[0][0]).toStrictEqual({
      paymentHash,
      pubkey: DEFAULT_PUBKEY,
    })
  })
})
