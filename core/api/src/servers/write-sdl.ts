// Initialize mandatory environment variables with dummy values if not set
const envVarsWithDefaults = {
  HELMREVISION: "dummy",
  KRATOS_PG_CON: "pg://dummy",
  OATHKEEPER_DECISION_ENDPOINT: "http://dummy",
  NETWORK: "regtest",
  TWILIO_ACCOUNT_SID: "dummy",
  TWILIO_AUTH_TOKEN: "dummy",
  TWILIO_VERIFY_SERVICE_ID: "dummy",
  KRATOS_PUBLIC_API: "http://dummy",
  KRATOS_ADMIN_API: "http://dummy",
  KRATOS_MASTER_USER_PASSWORD: "dummy",
  KRATOS_CALLBACK_API_KEY: "dummy",
  BRIA_HOST: "dummy",
  BRIA_API_KEY: "dummy",
  MONGODB_CON: "mongodb://dummy",
  REDIS_MASTER_NAME: "dummy",
  REDIS_PASSWORD: "dummy",
  REDIS_0_DNS: "dummy",
}

for (const [envVar, defaultValue] of Object.entries(envVarsWithDefaults)) {
  if (!process.env[envVar]) {
    process.env[envVar] = defaultValue
  }
}

import fs from "fs/promises"
import path from "path"

import { GraphQLSchema, lexicographicSortSchema, printSchema } from "graphql"

import { QueryType as QueryTypeAdmin } from "@/graphql/admin/queries"
import { MutationType as MutationTypeAdmin } from "@/graphql/admin/mutations"
import { ALL_INTERFACE_TYPES as ALL_INTERFACE_TYPES_ADMIN } from "@/graphql/admin/types"

import { ALL_INTERFACE_TYPES } from "@/graphql/public/types"

import { QueryType } from "@/graphql/public/queries"

import { MutationType } from "@/graphql/public/mutations"
import { SubscriptionType } from "@/graphql/public/subscriptions"

export { queryFields } from "@/graphql/public/queries"
export { mutationFields } from "@/graphql/public/mutations"

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

const packageRoot = process.argv[2] || __dirname

;(async () => {
  try {
    console.log("write public schema")

    const schemaPublicPath = path.resolve(
      packageRoot,
      "src/graphql/public/schema.graphql",
    )
    console.log(`Writing to path: ${schemaPublicPath}`)

    const sortedPublicSchema = printSchema(lexicographicSortSchema(gqlPublicSchema))

    const fileHandleMain = await fs.open(schemaPublicPath, "w")
    await fileHandleMain.writeFile(sortedPublicSchema)
    await fileHandleMain.close()

    console.log("write admin schema")

    const schemaAdminPath = path.resolve(packageRoot, "src/graphql/admin/schema.graphql")
    console.log(`Writing to path: ${schemaAdminPath}`)

    const sortedAdminSchema = printSchema(lexicographicSortSchema(gqlAdminSchema))

    const fileHandle = await fs.open(schemaAdminPath, "w")
    await fileHandle.writeFile(sortedAdminSchema)
    await fileHandle.close()

    console.log("done")
  } catch (error) {
    console.error("An error occurred:", error)
  } finally {
    process.exit(0)
  }
})()
