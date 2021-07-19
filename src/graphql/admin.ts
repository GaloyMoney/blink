import fs from "fs"
import path from "path"
import { GraphQLSchema, printSchema } from "graphql"

import { isDev } from "../utils"
import QueryType from "./admin-queries"
import MutationType from "./admin-mutations"

export const gqlAdminSchema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
})

if (isDev) {
  fs.writeFileSync(
    path.resolve("./src/graphql/admin.graphql"),
    printSchema(gqlAdminSchema),
  )
}
