import fs from "fs/promises"
import path from "path"

import { GraphQLSchema, lexicographicSortSchema, printSchema } from "graphql"

import { QueryType as QueryTypeAdmin } from "@graphql/admin/queries"
import { MutationType as MutationTypeAdmin } from "@graphql/admin/mutations"
import { ALL_INTERFACE_TYPES as ALL_INTERFACE_TYPES_ADMIN } from "@graphql/admin/types"

import { ALL_INTERFACE_TYPES } from "@graphql/public/types"

import { QueryType } from "@graphql/public/queries"

import { MutationType } from "@graphql/public/mutations"
import { SubscriptionType } from "@graphql/public/subscriptions"

export { queryFields } from "@graphql/public/queries"
export { mutationFields } from "@graphql/public/mutations"

export const gqlAdminSchema = new GraphQLSchema({
  query: QueryTypeAdmin,
  mutation: MutationTypeAdmin,
  types: ALL_INTERFACE_TYPES_ADMIN,
})

export const gqlPublicSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  subscription: SubscriptionType,
  types: ALL_INTERFACE_TYPES,
})
;(async () => {
  try {
    console.log("write public schema")

    const schemaPublicPath = path.resolve(
      __dirname,
      "../../src/graphql/public/schema.graphql",
    )
    console.log(`Writing to path: ${schemaPublicPath}`)

    const sortedPublicSchema = printSchema(lexicographicSortSchema(gqlPublicSchema))

    const fileHandleMain = await fs.open(path.resolve(schemaPublicPath), "w")
    await fileHandleMain.writeFile(sortedPublicSchema)
    await fileHandleMain.close()

    console.log("write admin schema")

    const schemaAdminPath = path.resolve(
      __dirname,
      "../../src/graphql/admin/schema.graphql",
    )
    console.log(`Writing to path: ${schemaAdminPath}`)

    const sortedAdminSchema = printSchema(lexicographicSortSchema(gqlAdminSchema))

    const fileHandle = await fs.open(path.resolve(schemaAdminPath), "w")
    await fileHandle.writeFile(sortedAdminSchema)
    await fileHandle.close()

    console.log("done")
  } catch (error) {
    console.error("An error occurred:", error)
  } finally {
    process.exit(0)
  }
})()
