import { toMilliSats, toSats } from "@domain/bitcoin"
import { LnInvoiceValidator } from "@domain/bitcoin/lightning"
import { ValidationError } from "@domain/errors"

describe("LnInvoiceValidator", () => {
  const makeLnInvoice = (amount: Satoshis) => ({
    paymentHash: "paymentHash" as PaymentHash,
    paymentSecret: "paymentSecret" as PaymentSecret,
    paymentRequest: "paymentRequest" as EncodedPaymentRequest,
    routeHints: [],
    cltvDelta: null,
    destination: "destination" as Pubkey,
    amount,
    milliSatsAmount: toMilliSats(0),
    description: "",
    features: [],
  })

  it("passes for a zero amount invoice and valid amount passed", () => {
    const decodedInvoice = makeLnInvoice(toSats(0))
    const amount = toSats(1)
    const lnInvoiceValidator = LnInvoiceValidator(decodedInvoice)
    const expectedResult = { amount }

    const validatorResult = lnInvoiceValidator.validateToSend(amount)
    expect(validatorResult).not.toBeInstanceOf(ValidationError)
    expect(validatorResult).toStrictEqual(expectedResult)
  })

  it("passes for a valid lnInvoice amount included and no/zero amount passed", () => {
    const decodedInvoice = makeLnInvoice(toSats(1))
    const amount = toSats(0)
    const lnInvoiceValidator = LnInvoiceValidator(decodedInvoice)
    const expectedResult = { amount: decodedInvoice.amount }

    const validatorResult1 = lnInvoiceValidator.validateToSend()
    expect(validatorResult1).not.toBeInstanceOf(ValidationError)
    expect(validatorResult1).toStrictEqual(expectedResult)

    const validatorResult2 = lnInvoiceValidator.validateToSend(amount)
    expect(validatorResult2).not.toBeInstanceOf(ValidationError)
    expect(validatorResult2).toStrictEqual(expectedResult)
  })

  it("passes for a same lnInvoice amount and amount passed", () => {
    const decodedInvoice = makeLnInvoice(toSats(1))
    const amount = toSats(1)
    const lnInvoiceValidator = LnInvoiceValidator(decodedInvoice)
    const expectedResult = { amount }

    const validatorResult = lnInvoiceValidator.validateToSend(amount)
    expect(validatorResult).not.toBeInstanceOf(ValidationError)
    expect(validatorResult).toStrictEqual(expectedResult)
  })

  it("fails for non-zero mismatched lnInvoice amount and amount passed", () => {
    const decodedInvoice = makeLnInvoice(toSats(1))
    const amount = toSats(2)
    const lnInvoiceValidator = LnInvoiceValidator(decodedInvoice)

    const validatorResult = lnInvoiceValidator.validateToSend(amount)
    expect(validatorResult).toBeInstanceOf(ValidationError)
  })

  it("fails for zero amount lnInvoice and no/zero amount passed", () => {
    const decodedInvoice = makeLnInvoice(toSats(0))
    const amount = toSats(0)
    const lnInvoiceValidator = LnInvoiceValidator(decodedInvoice)

    const validatorResult1 = lnInvoiceValidator.validateToSend()
    expect(validatorResult1).toBeInstanceOf(ValidationError)

    const validatorResult2 = lnInvoiceValidator.validateToSend(amount)
    expect(validatorResult2).toBeInstanceOf(ValidationError)
  })

  it("fails for valid amount invoice and negative amount passed", () => {
    const decodedInvoice = makeLnInvoice(toSats(1))
    const amount = toSats(-1)
    const lnInvoiceValidator = LnInvoiceValidator(decodedInvoice)

    const validatorResult = lnInvoiceValidator.validateToSend(amount)
    expect(validatorResult).toBeInstanceOf(ValidationError)
  })

  it("fails for zero amount invoice and negative amount passed", () => {
    const decodedInvoice = makeLnInvoice(toSats(0))
    const amount = toSats(-1)
    const lnInvoiceValidator = LnInvoiceValidator(decodedInvoice)

    const validatorResult = lnInvoiceValidator.validateToSend(amount)
    expect(validatorResult).toBeInstanceOf(ValidationError)
  })
})
