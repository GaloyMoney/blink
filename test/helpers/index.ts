import { gqlAdminSchema } from "@graphql/admin"
import { ExecutionResult, graphql, Source } from "graphql"
import { ObjMap } from "graphql/jsutils/ObjMap"

export * from "./apollo-client"
export * from "./bitcoin-core"
export * from "./integration-server"
export * from "./lightning"
export * from "./price"
export * from "./rate-limit"
export * from "./redis"
export * from "./state-setup"
export * from "./user"
export * from "./wallet"
export * from "./check-is-balanced"

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
}: {
  source: string | Source
}) => graphql({ schema: gqlAdminSchema, source }) as unknown as T
