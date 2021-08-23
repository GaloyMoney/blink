import { btc2sat } from "@core/utils"
import { balanceSheetIsBalanced, updateUsersPendingPayment } from "@core/balance-sheet"
import { waitUntilChannelBalanceSyncAll } from "./lightning"
import { generateToken } from "node-2fa"

export * from "./bitcoin-core"
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
  expect(assetsLiabilitiesDifference).toBe(0)

  // TODO: need to go from sats to msats to properly account for every msats spent
  expect(Math.abs(bookingVersusRealWorldAssets)).toBe(0)
}

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

export const generateTokenHelper = ({ secret }) => {
  const generateTokenResult = generateToken(secret)
  if (generateTokenResult && generateTokenResult.token) {
    return generateTokenResult.token
  }

  fail("generateToken returned null")
}

export const enable2FA = async ({ wallet }) => {
  if (!wallet.user.twoFactorEnabled) {
    const { secret } = wallet.generate2fa()
    const token = generateTokenHelper({ secret })
    await wallet.save2fa({ secret, token })
  }
}
