import { Lightning } from "@/app"

import { decodeInvoice } from "@/domain/bitcoin/lightning"
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

describe("updateLnPayments", () => {
  const lnPayments = LnPaymentsRepository()
  const { paymentHash, paymentRequest } = invoice
  const mockedLnPaymentLookup = {
    createdAt: new Date(Date.now()),
    paymentHash,
    paymentRequest,
  }

  it("updates an incomplete record", async () => {
    const { LndService: LnServiceOrig } = jest.requireActual("@/services/lnd")
    jest.spyOn(LndImpl, "LndService").mockReturnValue({
      ...LnServiceOrig(),
      listSettledPayments: () => ({
        lnPayments: [mockedLnPaymentLookup],
        endCursor: false,
      }),
    })

    await lnPayments.persistNew({
      paymentRequest,
      paymentHash,
      sentFromPubkey: DEFAULT_PUBKEY,
    })

    // Check initial status
    const lnPaymentBefore = await lnPayments.findByPaymentHash(paymentHash)
    if (lnPaymentBefore instanceof Error) throw lnPaymentBefore
    expect(lnPaymentBefore.isCompleteRecord).toBe(false)

    // Run update
    await Lightning.updateLnPayments()

    // Check final status
    const lnPaymentAfter = await lnPayments.findByPaymentHash(paymentHash)
    if (lnPaymentAfter instanceof Error) throw lnPaymentAfter
    expect(lnPaymentAfter.isCompleteRecord).toBe(true)
  })
})
