import { randomUUID, randomBytes } from "crypto"

import { gqlAdminSchema } from "@graphql/admin"
import { ExecutionResult, graphql, Source } from "graphql"
import { ObjMap } from "graphql/jsutils/ObjMap"
import { AccountsRepository } from "@services/mongoose"
import { getCurrencyMajorExponent, priceAmountFromNumber } from "@domain/fiat"

export * from "./apollo-client"
export * from "./bitcoin-core"
export * from "./bria"
export * from "./check-is-balanced"
export * from "./get-error"
export * from "./generate-hash"
export * from "./integration-server"
export * from "./ledger"
export * from "./lightning"
export * from "./price"
export * from "./rate-limit"
export * from "./redis"
export * from "./state-setup-e2e"
export * from "./user"
export * from "./wallet"

export const randomEmail = () =>
  (randomBytes(20).toString("hex") + "@galoy.io") as EmailAddress

export const randomPassword = () => randomBytes(20).toString("hex") as IdentityPassword

export const randomPhone = () =>
  `+1415${Math.floor(Math.random() * 900000 + 100000)}` as PhoneNumber

export const randomUserId = () => randomUUID() as UserId

// TODO: use same function as createUserAndWallet
export const randomAccount = async () => {
  const account = await AccountsRepository().persistNew(randomUserId())
  if (account instanceof Error) throw account
  return account
}

export const amountAfterFeeDeduction = ({
  amount,
  depositFeeRatio,
}: {
  amount: Satoshis
  depositFeeRatio: DepositFeeRatio
}) => Math.round(amount * (1 - depositFeeRatio))

export const resetDatabase = async (mongoose: typeof import("mongoose")) => {
  const db = mongoose.connection.db
  // Get all collections
  const collections = await db.listCollections().toArray()
  // Create an array of collection names and drop each collection
  const collectionNames = collections.map((c) => c.name)
  for (const collectionName of collectionNames) {
    await db.dropCollection(collectionName)
  }
}

export const amountByPriceAsMajor = <
  S extends WalletCurrency,
  T extends DisplayCurrency,
>({
  amount,
  price,
  walletCurrency,
  displayCurrency,
}: {
  amount: Satoshis | UsdCents
  price: WalletMinorUnitDisplayPrice<S, T> | undefined
  walletCurrency: S
  displayCurrency: T
}): number => {
  const priceAmount =
    price === undefined
      ? priceAmountFromNumber({
          priceOfOneSatInMinorUnit: 0,
          displayCurrency,
          walletCurrency,
        })
      : price

  const exponent = getCurrencyMajorExponent(displayCurrency)
  return (
    (amount * Number(priceAmount.base)) / 10 ** (Number(priceAmount.offset) + exponent)
  )
}

export const chunk = (a, n) =>
  [...Array(Math.ceil(a.length / n))].map((_, i) => a.slice(n * i, n + n * i))

export const graphqlAdmin = async <
  T = Promise<ExecutionResult<ObjMap<unknown>, ObjMap<unknown>>>,
>({
  source,
  contextValue,
}: {
  source: string | Source
  contextValue?: Partial<GraphQLContext>
}) => graphql({ schema: gqlAdminSchema, source, contextValue }) as unknown as T
