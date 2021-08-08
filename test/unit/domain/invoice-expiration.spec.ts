import { invoiceExpirationForCurrency } from "@domain/invoice-expiration"

describe("invoice-expiration", () => {
  it("BTC invoice expires in 1 days", () => {
    const creationDate = new Date("2000-01-01T00:00:00.000Z")
    const expiresAt = invoiceExpirationForCurrency("BTC", creationDate)
    expect(expiresAt).toEqual(new Date("2000-01-02T00:00:00.000Z"))
  })

  it("USD invoice expires in 2 minutes", () => {
    const creationDate = new Date("2000-01-01T00:00:00.000Z")
    const expiresAt = invoiceExpirationForCurrency("USD", creationDate)
    expect(expiresAt).toEqual(new Date("2000-01-01T00:02:00.000Z"))
  })
})
