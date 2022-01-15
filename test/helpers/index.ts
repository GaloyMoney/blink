import { Wallets } from "@app"
import { generate2fa, save2fa } from "@app/users"
import { balanceSheetIsBalanced } from "@core/balance-sheet"
import { TwoFAAlreadySetError } from "@domain/twoFA"
import { baseLogger } from "@services/logger"

import { generateToken } from "node-2fa"

import { waitUntilChannelBalanceSyncAll } from "./lightning"

export * from "./apollo-client"
export * from "./bitcoin-core"
export * from "./integration-server"
export * from "./lightning"
export * from "./user"
export * from "./redis"
export * from "./wallet"
export * from "./price"
export * from "./rate-limit"

export const amountAfterFeeDeduction = ({
  amount,
  depositFeeRatio,
}: {
  amount: Satoshis
  depositFeeRatio: DepositFeeRatio
}) => Math.round(amount * (1 - depositFeeRatio))

const logger = baseLogger.child({ module: "test" })

export const checkIsBalanced = async () => {
  await Promise.all([
    Wallets.updatePendingInvoices(logger),
    Wallets.updatePendingPayments(logger),
    Wallets.updateOnChainReceipt({ logger }),
  ])
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

export const generateTokenHelper = (secret) => {
  const generateTokenResult = generateToken(secret)
  if (generateTokenResult && generateTokenResult.token) {
    return generateTokenResult.token as TwoFAToken
  }

  fail("generateToken returned null")
}

export const enable2FA = async (userId: UserId) => {
  const generateResult = await generate2fa(userId)
  if (generateResult instanceof Error) return generateResult

  const { secret } = generateResult

  const token = generateTokenHelper(secret)

  const user = await save2fa({ secret, token, userId })
  if (user instanceof Error && !(user instanceof TwoFAAlreadySetError)) {
    throw user
  }

  return secret
}

export const chunk = (a, n) =>
  [...Array(Math.ceil(a.length / n))].map((_, i) => a.slice(n * i, n + n * i))
