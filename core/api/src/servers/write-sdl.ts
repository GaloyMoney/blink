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

// Define the schemas
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

// Main function to handle the script's logic
const main = async () => {
  const schemaType = process.argv[2] // Accepts 'admin' or 'public'

  try {
    let schema
    if (schemaType === "admin") {
      schema = gqlAdminSchema
    } else if (schemaType === "public") {
      schema = gqlPublicSchema
    } else {
      throw new Error('Please specify "admin" or "public" as an argument.')
    }

    const sortedSchema = printSchema(lexicographicSortSchema(schema))

    console.log(sortedSchema) // Prints the sorted schema to stdout

    process.exit(0)
  } catch (error) {
    console.error("An error occurred:", error)
    process.exit(1) // Exit with a non-zero status code to indicate an error
  }
}

// Execute the main function
main()
