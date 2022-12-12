import { randomUUID } from "crypto"

import { gqlAdminSchema } from "@graphql/admin"
import { ExecutionResult, graphql, Source } from "graphql"
import { ObjMap } from "graphql/jsutils/ObjMap"
import { AccountsRepository } from "@services/mongoose"

export * from "./apollo-client"
export * from "./bitcoin-core"
export * from "./check-is-balanced"
export * from "./integration-server"
export * from "./lightning"
export * from "./price"
export * from "./rate-limit"
export * from "./redis"
export * from "./state-setup-e2e"
export * from "./user"
export * from "./wallet"

export const randomEmail = () => (Math.random().toString(36) + "@galoy.io") as KratosEmail

export const randomPassword = () => Math.random().toString(36) as IdentityPassword

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

export const chunk = (a, n) =>
  [...Array(Math.ceil(a.length / n))].map((_, i) => a.slice(n * i, n + n * i))

export const graphqlAdmin = <
  T = Promise<ExecutionResult<ObjMap<unknown>, ObjMap<unknown>>>,
>({
  source,
  contextValue,
}: {
  source: string | Source
  contextValue?: Partial<GraphQLContext>
}) => graphql({ schema: gqlAdminSchema, source, contextValue }) as unknown as T
