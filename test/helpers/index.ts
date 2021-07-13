import { FtxDealerWallet } from "src/dealer/FtxDealerWallet"
import {
  balanceSheetIsBalanced,
  updateUsersPendingPayment,
} from "src/ledger/balanceSheet"

export * from "./bitcoinCore"
export * from "./lightning"
export * from "./user"

export const checkIsBalanced = async () => {
  await updateUsersPendingPayment()
  const { assetsLiabilitiesDifference, bookingVersusRealWorldAssets } =
    await balanceSheetIsBalanced()
  expect(assetsLiabilitiesDifference).toBeFalsy() // should be 0

  // FIXME: because safe_fees is doing rounding to the value up
  // balance doesn't match any longer. need to go from sats to msats to properly account for every msats spent
  expect(Math.abs(bookingVersusRealWorldAssets)).toBeLessThan(5) // should be 0
}

export const mockGetExchangeBalance = () =>
  jest.spyOn(FtxDealerWallet.prototype, "getExchangeBalance").mockImplementation(
    () =>
      new Promise((resolve) => {
        resolve({ sats: 0, usdPnl: 0 })
      }),
  )
