import fs from "fs"
import path from "path"
import { GraphQLSchema, printSchema } from "graphql"

import { isDev } from "@core/utils"
import QueryType from "./queries"
import MutationType from "./mutations"

export const gqlAdminSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
})

if (isDev) {
  fs.writeFileSync(
    path.resolve("./src/graphql/admin/schema.graphql"),
    printSchema(gqlAdminSchema),
  )
}
