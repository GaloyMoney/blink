import fs from "fs"
import path from "path"
import { GraphQLSchema, printSchema } from "graphql"

import { isDev } from "@core/utils"
import QueryType from "./queries"
import MutationType from "./mutations"

export const gqlSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
})

if (isDev) {
  fs.writeFileSync(
    path.resolve("./src/graphql/main/schema.graphql"),
    printSchema(gqlSchema),
  )
}
