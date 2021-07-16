import { btc2sat } from "src/utils"
import { FtxDealerWallet } from "src/dealer/FtxDealerWallet"
import {
  balanceSheetIsBalanced,
  updateUsersPendingPayment,
} from "src/ledger/balanceSheet"
import { waitUntilChannelBalanceSyncAll } from "./lightning"

export * from "./bitcoinCore"
export * from "./lightning"
export * from "./user"

export const amountAfterFeeDeduction = ({ amount, depositFeeRatio }) =>
  Math.round(btc2sat(amount) * (1 - depositFeeRatio))

export const checkIsBalanced = async () => {
  await updateUsersPendingPayment()
  // wait for balance updates because invoice event
  // arrives before wallet balances updates in lnd
  await waitUntilChannelBalanceSyncAll()

  const { assetsLiabilitiesDifference, bookingVersusRealWorldAssets } =
    await balanceSheetIsBalanced()
  expect(assetsLiabilitiesDifference).toBeFalsy() // should be 0

  // FIXME: because safe_fees is doing rounding to the value up
  // balance doesn't match any longer. need to go from sats to msats to properly account for every msats spent
  expect(Math.abs(bookingVersusRealWorldAssets)).toBeLessThanOrEqual(5) // should be 0
}

export const mockGetExchangeBalance = () =>
  jest.spyOn(FtxDealerWallet.prototype, "getExchangeBalance").mockImplementation(
    () =>
      new Promise((resolve) => {
        resolve({ sats: 0, usdPnl: 0 })
      }),
  )

export const resetDatabase = async (mongoose) => {
  const db = mongoose.connection.db
  // Get all collections
  const collections = await db.listCollections().toArray()
  // Create an array of collection names and drop each collection
  collections
    .map((c) => c.name)
    .forEach(async (collectionName) => {
      await db.dropCollection(collectionName)
    })
}
