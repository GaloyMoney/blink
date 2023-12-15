// This is a test suite added to document stablesats behaviour in a way that devs can
// reason about what to expect from the different methods under different scenarios.
//
// This is also placed in '02-user-wallet' and not 'services/dealer' because it acts
// as a canary for the rest of these tests. This is because we have some places in
// our tests where we hardcode expected values that depend on the exchange rate.
//
// This test suite can probably be removed if we remove all those hardcoded places (i.e.
// can change the mocked rates without breaking tests), and we find some other way to
// communicate how the different stablesats methods work.

import { WalletCurrency } from "@/domain/shared"
import { DealerPriceService } from "@/services/dealer-price"

const dealerFns = DealerPriceService()

const centsFromSats = async (btc: BtcPaymentAmount) => {
  // Conversions with spreads
  const getCentsFromSatsForImmediateBuy =
    await dealerFns.getCentsFromSatsForImmediateBuy(btc)
  if (getCentsFromSatsForImmediateBuy instanceof Error) {
    throw getCentsFromSatsForImmediateBuy
  }

  const getCentsFromSatsForImmediateSell =
    await dealerFns.getCentsFromSatsForImmediateSell(btc)
  if (getCentsFromSatsForImmediateSell instanceof Error) {
    throw getCentsFromSatsForImmediateSell
  }

  const getCentsFromSatsForFutureBuy = await dealerFns.getCentsFromSatsForFutureBuy(btc)
  if (getCentsFromSatsForFutureBuy instanceof Error) throw getCentsFromSatsForFutureBuy

  const getCentsFromSatsForFutureSell = await dealerFns.getCentsFromSatsForFutureSell(btc)
  if (getCentsFromSatsForFutureSell instanceof Error) throw getCentsFromSatsForFutureSell

  // Mid-rate conversions
  const priceRatio = await dealerFns.getCentsPerSatsExchangeMidRate()
  if (priceRatio instanceof Error) throw priceRatio

  const convertFromBtc = priceRatio.convertFromBtc(btc)
  const convertFromBtcToFloor = priceRatio.convertFromBtcToFloor(btc)
  const convertFromBtcToCeil = priceRatio.convertFromBtcToCeil(btc)

  return {
    btc,
    convertFromBtc,
    convertFromBtcToFloor,
    convertFromBtcToCeil,

    getCentsFromSatsForImmediateBuy,
    getCentsFromSatsForImmediateSell,
    getCentsFromSatsForFutureBuy,
    getCentsFromSatsForFutureSell,
  }
}

const satsFromCents = async (usd: UsdPaymentAmount) => {
  //  Conversions with spreads
  const getSatsFromCentsForImmediateBuy =
    await dealerFns.getSatsFromCentsForImmediateBuy(usd)
  if (getSatsFromCentsForImmediateBuy instanceof Error) {
    throw getSatsFromCentsForImmediateBuy
  }

  const getSatsFromCentsForImmediateSell =
    await dealerFns.getSatsFromCentsForImmediateSell(usd)
  if (getSatsFromCentsForImmediateSell instanceof Error) {
    throw getSatsFromCentsForImmediateSell
  }

  const getSatsFromCentsForFutureBuy = await dealerFns.getSatsFromCentsForFutureBuy(usd)
  if (getSatsFromCentsForFutureBuy instanceof Error) throw getSatsFromCentsForFutureBuy

  const getSatsFromCentsForFutureSell = await dealerFns.getSatsFromCentsForFutureSell(usd)
  if (getSatsFromCentsForFutureSell instanceof Error) throw getSatsFromCentsForFutureSell

  // Mid-rate conversions
  const priceRatio = await dealerFns.getCentsPerSatsExchangeMidRate()
  if (priceRatio instanceof Error) throw priceRatio

  const convertFromUsd = priceRatio.convertFromUsd(usd)

  return {
    usd,
    convertFromUsd,

    getSatsFromCentsForImmediateBuy,
    getSatsFromCentsForImmediateSell,
    getSatsFromCentsForFutureBuy,
    getSatsFromCentsForFutureSell,
  }
}

describe("define stablesats expected behavior", () => {
  it("is the expected nominal rate", async () => {
    const priceRatio = await dealerFns.getCentsPerSatsExchangeMidRate()
    if (priceRatio instanceof Error) throw priceRatio

    expect(priceRatio.usdPerSat()).toEqual(0.02)
  })

  it("large values, round exact", async () => {
    // ==========
    // BTC TO USD
    // ==========
    const BTC = { amount: 10_000_000n, currency: WalletCurrency.Btc } as BtcPaymentAmount
    const centsFromSatsRes = await centsFromSats(BTC)

    // Mid-rate values
    expect(centsFromSatsRes.convertFromBtc.amount).toEqual(200_000n)
    expect(centsFromSatsRes.convertFromBtcToFloor.amount).toEqual(200_000n)
    expect(centsFromSatsRes.convertFromBtcToCeil.amount).toEqual(200_000n)

    // Values with spreads
    expect(centsFromSatsRes.getCentsFromSatsForImmediateBuy.amount).toEqual(199_800n)
    expect(centsFromSatsRes.getCentsFromSatsForImmediateSell.amount).toEqual(200_200n)
    expect(centsFromSatsRes.getCentsFromSatsForFutureBuy.amount).toEqual(199_760n)
    expect(centsFromSatsRes.getCentsFromSatsForFutureSell.amount).toEqual(200_240n)

    // ==========
    // USD TO BTC
    // ==========
    const USD = { amount: 200_000n, currency: WalletCurrency.Usd } as UsdPaymentAmount
    const satsFromCentsRes = await satsFromCents(USD)

    // Mid-rate values
    expect(satsFromCentsRes.convertFromUsd.amount).toEqual(10_000_000n)

    // Values with spreads
    expect(satsFromCentsRes.getSatsFromCentsForImmediateBuy.amount).toEqual(10_010_000n)
    expect(satsFromCentsRes.getSatsFromCentsForImmediateSell.amount).toEqual(9_990_000n)
    expect(satsFromCentsRes.getSatsFromCentsForFutureBuy.amount).toEqual(10_012_000n)
    expect(satsFromCentsRes.getSatsFromCentsForFutureSell.amount).toEqual(9_988_000n)
  })

  it("large values, round up", async () => {
    // ==========
    // BTC TO USD
    // ==========
    const BTC = { amount: 9_999_950n, currency: WalletCurrency.Btc } as BtcPaymentAmount
    const centsFromSatsRes = await centsFromSats(BTC)

    // Mid-rate values
    expect(centsFromSatsRes.convertFromBtc.amount).toEqual(199_999n)
    expect(centsFromSatsRes.convertFromBtcToFloor.amount).toEqual(199_999n)
    expect(centsFromSatsRes.convertFromBtcToCeil.amount).toEqual(199_999n)

    // Values with spreads
    expect(centsFromSatsRes.getCentsFromSatsForImmediateBuy.amount).toEqual(199_799n)
    expect(centsFromSatsRes.getCentsFromSatsForImmediateSell.amount).toEqual(200_199n)
    expect(centsFromSatsRes.getCentsFromSatsForFutureBuy.amount).toEqual(199_759n)
    expect(centsFromSatsRes.getCentsFromSatsForFutureSell.amount).toEqual(200_239n)

    // ==========
    // USD TO BTC
    // ==========
    const USD = { amount: 199_950n, currency: WalletCurrency.Usd } as UsdPaymentAmount
    const satsFromCentsRes = await satsFromCents(USD)

    // Mid-rate values
    expect(satsFromCentsRes.convertFromUsd.amount).toEqual(9_997_500n)

    // Values with spreads
    expect(satsFromCentsRes.getSatsFromCentsForImmediateBuy.amount).toEqual(10_007_498n)
    expect(satsFromCentsRes.getSatsFromCentsForImmediateSell.amount).toEqual(9_987_502n)
    expect(satsFromCentsRes.getSatsFromCentsForFutureBuy.amount).toEqual(10_009_497n)
    expect(satsFromCentsRes.getSatsFromCentsForFutureSell.amount).toEqual(9_985_503n)
  })

  it("small values, round exact", async () => {
    // ==========
    // BTC TO USD
    // ==========
    const BTC = { amount: 1_000n, currency: WalletCurrency.Btc } as BtcPaymentAmount
    const centsFromSatsRes = await centsFromSats(BTC)

    // Mid-rate values
    expect(centsFromSatsRes.convertFromBtc.amount).toEqual(20n)
    expect(centsFromSatsRes.convertFromBtcToFloor.amount).toEqual(20n)
    expect(centsFromSatsRes.convertFromBtcToCeil.amount).toEqual(20n)

    // Values with spreads
    expect(centsFromSatsRes.getCentsFromSatsForImmediateBuy.amount).toEqual(19n)
    expect(centsFromSatsRes.getCentsFromSatsForImmediateSell.amount).toEqual(21n)
    expect(centsFromSatsRes.getCentsFromSatsForFutureBuy.amount).toEqual(19n)
    expect(centsFromSatsRes.getCentsFromSatsForFutureSell.amount).toEqual(21n)

    // ==========
    // USD TO BTC
    // ==========
    const USD = { amount: 20n, currency: WalletCurrency.Usd } as UsdPaymentAmount
    const satsFromCentsRes = await satsFromCents(USD)

    // Mid-rate values
    expect(satsFromCentsRes.convertFromUsd.amount).toEqual(1_000n)

    // Values with spreads
    expect(satsFromCentsRes.getSatsFromCentsForImmediateBuy.amount).toEqual(1_001n)
    expect(satsFromCentsRes.getSatsFromCentsForImmediateSell.amount).toEqual(999n)
    expect(satsFromCentsRes.getSatsFromCentsForFutureBuy.amount).toEqual(1_002n)
    expect(satsFromCentsRes.getSatsFromCentsForFutureSell.amount).toEqual(998n)
  })

  it("small values, round up", async () => {
    // ==========
    // BTC TO USD
    // ==========
    const BTC = { amount: 999n, currency: WalletCurrency.Btc } as BtcPaymentAmount
    const centsFromSatsRes = await centsFromSats(BTC)

    // Mid-rate values
    expect(centsFromSatsRes.convertFromBtc.amount).toEqual(20n)
    expect(centsFromSatsRes.convertFromBtcToFloor.amount).toEqual(19n)
    expect(centsFromSatsRes.convertFromBtcToCeil.amount).toEqual(20n)

    // Values with spreads
    expect(centsFromSatsRes.getCentsFromSatsForImmediateBuy.amount).toEqual(19n)
    expect(centsFromSatsRes.getCentsFromSatsForImmediateSell.amount).toEqual(20n)
    expect(centsFromSatsRes.getCentsFromSatsForFutureBuy.amount).toEqual(19n)
    expect(centsFromSatsRes.getCentsFromSatsForFutureSell.amount).toEqual(21n)

    // ==========
    // USD TO BTC
    // ==========
    const USD = { amount: 19n, currency: WalletCurrency.Usd } as UsdPaymentAmount
    const satsFromCentsRes = await satsFromCents(USD)

    // Mid-rate values
    expect(satsFromCentsRes.convertFromUsd.amount).toEqual(950n)

    // Values with spreads
    expect(satsFromCentsRes.getSatsFromCentsForImmediateBuy.amount).toEqual(951n)
    expect(satsFromCentsRes.getSatsFromCentsForImmediateSell.amount).toEqual(949n)
    expect(satsFromCentsRes.getSatsFromCentsForFutureBuy.amount).toEqual(952n)
    expect(satsFromCentsRes.getSatsFromCentsForFutureSell.amount).toEqual(948n)
  })

  it("small values, round down", async () => {
    // ==========
    // BTC TO USD
    // ==========
    const BTC = { amount: 1_001n, currency: WalletCurrency.Btc } as BtcPaymentAmount
    const centsFromSatsRes = await centsFromSats(BTC)

    // Mid-rate values
    expect(centsFromSatsRes.convertFromBtc.amount).toEqual(20n)
    expect(centsFromSatsRes.convertFromBtcToFloor.amount).toEqual(20n)
    expect(centsFromSatsRes.convertFromBtcToCeil.amount).toEqual(21n)

    // Values with spreads
    expect(centsFromSatsRes.getCentsFromSatsForImmediateBuy.amount).toEqual(19n)
    expect(centsFromSatsRes.getCentsFromSatsForImmediateSell.amount).toEqual(21n)
    expect(centsFromSatsRes.getCentsFromSatsForFutureBuy.amount).toEqual(19n)
    expect(centsFromSatsRes.getCentsFromSatsForFutureSell.amount).toEqual(21n)

    // ==========
    // USD TO BTC
    // ==========
    const USD = { amount: 21n, currency: WalletCurrency.Usd } as UsdPaymentAmount
    const satsFromCentsRes = await satsFromCents(USD)

    // Mid-rate values
    expect(satsFromCentsRes.convertFromUsd.amount).toEqual(1_050n)

    // Values with spreads
    expect(satsFromCentsRes.getSatsFromCentsForImmediateBuy.amount).toEqual(1_052n)
    expect(satsFromCentsRes.getSatsFromCentsForImmediateSell.amount).toEqual(1_048n)
    expect(satsFromCentsRes.getSatsFromCentsForFutureBuy.amount).toEqual(1_052n)
    expect(satsFromCentsRes.getSatsFromCentsForFutureSell.amount).toEqual(1_048n)
  })

  it("min values", async () => {
    // ==========
    // BTC TO USD
    // ==========
    const BTC = { amount: 1n, currency: WalletCurrency.Btc } as BtcPaymentAmount
    const centsFromSatsRes = await centsFromSats(BTC)

    // Mid-rate values
    expect(centsFromSatsRes.convertFromBtc.amount).toEqual(1n)
    expect(centsFromSatsRes.convertFromBtcToFloor.amount).toEqual(0n)
    expect(centsFromSatsRes.convertFromBtcToCeil.amount).toEqual(1n)

    // Values with spreads
    expect(centsFromSatsRes.getCentsFromSatsForImmediateBuy.amount).toEqual(0n)
    expect(centsFromSatsRes.getCentsFromSatsForImmediateSell.amount).toEqual(1n)
    expect(centsFromSatsRes.getCentsFromSatsForFutureBuy.amount).toEqual(0n)
    expect(centsFromSatsRes.getCentsFromSatsForFutureSell.amount).toEqual(1n)

    // ==========
    // USD TO BTC
    // ==========
    const USD = { amount: 1n, currency: WalletCurrency.Usd } as UsdPaymentAmount
    const satsFromCentsRes = await satsFromCents(USD)

    // Mid-rate values
    expect(satsFromCentsRes.convertFromUsd.amount).toEqual(50n)

    // Values with spreads
    expect(satsFromCentsRes.getSatsFromCentsForImmediateBuy.amount).toEqual(51n)
    expect(satsFromCentsRes.getSatsFromCentsForImmediateSell.amount).toEqual(49n)
    expect(satsFromCentsRes.getSatsFromCentsForFutureBuy.amount).toEqual(51n)
    expect(satsFromCentsRes.getSatsFromCentsForFutureSell.amount).toEqual(49n)
  })
})
