import { LnInvoiceDecodeError } from "@domain/errors"
import { decodeInvoice } from "@domain/ln-invoice"

describe("decoreInvoice", () => {
  const validBolt11Invoice =
    "lnbc20u1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfppqw508d6qejxtdg4y5r3zarvary0c5xw7kxqrrsssp5m6kmam774klwlh4dhmhaatd7al02m0h0m6kmam774klwlh4dhmhs9qypqqqcqpf3cwux5979a8j28d4ydwahx00saa68wq3az7v9jdgzkghtxnkf3z5t7q5suyq2dl9tqwsap8j0wptc82cpyvey9gf6zyylzrm60qtcqsq7egtsq"

  it("returns an invoice", () => {
    const result = decodeInvoice(validBolt11Invoice)
    expect(result).not.toBeInstanceOf(LnInvoiceDecodeError)
    expect((result as LnInvoice).paymentHash).toEqual(
      "0001020304050607080900010203040506070809000102030405060708090102",
    )
  })

  it("returns a decode error", () => {
    const result = decodeInvoice("bad input data")
    expect(result).toBeInstanceOf(LnInvoiceDecodeError)
    expect((result as LnInvoiceDecodeError).message).toEqual(
      "Error: Not a proper lightning payment request",
    )
  })
})
