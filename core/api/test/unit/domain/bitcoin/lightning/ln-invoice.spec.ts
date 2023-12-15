import { LnInvoiceDecodeError, decodeInvoice } from "@/domain/bitcoin/lightning"
import { toSats } from "@/domain/bitcoin"

describe("decodeInvoice", () => {
  const validBolt11Invoice =
    "lnbc20u1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfppqw508d6qejxtdg4y5r3zarvary0c5xw7kxqrrsssp5m6kmam774klwlh4dhmhaatd7al02m0h0m6kmam774klwlh4dhmhs9qypqqqcqpf3cwux5979a8j28d4ydwahx00saa68wq3az7v9jdgzkghtxnkf3z5t7q5suyq2dl9tqwsap8j0wptc82cpyvey9gf6zyylzrm60qtcqsq7egtsq" as EncodedPaymentRequest

  it("returns an invoice", () => {
    const invoice = decodeInvoice(validBolt11Invoice)
    if (invoice instanceof Error) throw invoice
    expect(invoice.paymentHash).toEqual(
      "0001020304050607080900010203040506070809000102030405060708090102",
    )
    expect(invoice.paymentSecret).toEqual(
      "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    )
    expect(invoice.paymentRequest).toEqual(validBolt11Invoice)
    expect(invoice.amount).toEqual(toSats(2000))
    expect(invoice.destination).toEqual(
      "03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad",
    )
    expect(invoice.expiresAt).toEqual(new Date("2017-06-01T11:57:38.000Z"))
    expect(invoice.isExpired).toBeTruthy()
    expect(invoice.routeHints.length).toEqual(0)
    expect(invoice.cltvDelta).toEqual(9)
  })

  it("returns a decode error", () => {
    const result = decodeInvoice("bad input data" as EncodedPaymentRequest)
    expect(result).toBeInstanceOf(LnInvoiceDecodeError)
  })
})
