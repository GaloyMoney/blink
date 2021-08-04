import { toTypedError } from "@domain/utils"

describe("toTypedError", () => {
  const testErrorConverter: ErrorConverter<LnInvoiceDecodeErrorType> = toTypedError({
    unknownMessage: "Unknown",
    _type: "LnInvoiceDecodeError",
  })

  it("Embedds an UnknownError", () => {
    const unknownError = testErrorConverter({})
    expect(unknownError.message).toEqual("Unknown")
  })
})
