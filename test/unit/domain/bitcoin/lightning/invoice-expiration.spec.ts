import { invoiceExpirationForCurrency } from "@domain/bitcoin/lightning"

describe("invoice-expiration", () => {
  it("BTC invoice expires in 1 days", () => {
    const creationDate = new Date("2000-01-01T00:00:00.000Z")
    const expiresAt = invoiceExpirationForCurrency("BTC", creationDate)
    expect(expiresAt).toEqual(new Date("2000-01-02T00:00:00.000Z"))
  })

  it("USD invoice expires in 5 minutes", () => {
    const creationDate = new Date("2000-01-01T00:00:00.000Z")
    const expiresAt = invoiceExpirationForCurrency("USD", creationDate)
    expect(expiresAt).toEqual(new Date("2000-01-01T00:05:00.000Z"))
  })
})
