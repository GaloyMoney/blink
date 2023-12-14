import { SECS_PER_10_MINS, SECS_PER_DAY } from "@/config"

import { toSeconds } from "@/domain/primitives"
import { WalletCurrency } from "@/domain/shared"
import { invoiceExpirationForCurrency } from "@/domain/bitcoin/lightning"

describe("invoiceExpirationForCurrency", () => {
  const BTC = WalletCurrency.Btc
  const USD = WalletCurrency.Usd
  const now = new Date("2000-01-01T00:00:00Z")

  it("should return expiration for BTC currency with default delay", () => {
    const expectedExpiration = new Date("2000-01-02T00:00:00.000Z")
    let expiresAt = invoiceExpirationForCurrency(BTC, now)
    expect(expiresAt).toEqual(expectedExpiration)

    let delay = toSeconds(59)
    expiresAt = invoiceExpirationForCurrency(BTC, now, delay)
    expect(expiresAt).toEqual(expectedExpiration)

    delay = toSeconds(0)
    expiresAt = invoiceExpirationForCurrency(BTC, now, delay)
    expect(expiresAt).toEqual(expectedExpiration)

    delay = toSeconds(2 * SECS_PER_DAY)
    expiresAt = invoiceExpirationForCurrency(BTC, now, delay)
    expect(expiresAt).toEqual(expectedExpiration)
  })

  it("should return expiration for USD currency with default delay", () => {
    const expectedExpiration = new Date("2000-01-01T00:05:00.000Z")
    let expiresAt = invoiceExpirationForCurrency(USD, now)
    expect(expiresAt).toEqual(expectedExpiration)

    let delay = toSeconds(59)
    expiresAt = invoiceExpirationForCurrency(USD, now, delay)
    expect(expiresAt).toEqual(expectedExpiration)

    delay = toSeconds(0)
    expiresAt = invoiceExpirationForCurrency(USD, now, delay)
    expect(expiresAt).toEqual(expectedExpiration)

    delay = toSeconds(SECS_PER_10_MINS)
    expiresAt = invoiceExpirationForCurrency(USD, now, delay)
    expect(expiresAt).toEqual(expectedExpiration)
  })

  it("should return expiration for BTC currency with provided delay", () => {
    const delay = toSeconds(30 * 60)
    const currency = BTC
    const expiration = invoiceExpirationForCurrency(currency, now, delay)
    const expectedExpiration = new Date("2000-01-01T00:30:00Z")
    expect(expiration).toEqual(expectedExpiration)
  })

  it("should return expiration for USD currency with provided delay", () => {
    const delay = toSeconds(3 * 60)
    const currency = USD
    const expiration = invoiceExpirationForCurrency(currency, now, delay)
    const expectedExpiration = new Date("2000-01-01T00:03:00Z")
    expect(expiration).toEqual(expectedExpiration)
  })
})
