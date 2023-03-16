import { exit } from "process"

import { lexicographicSortSchema, printSchema } from "graphql"

import { writeSDLFile } from "@services/fs"

import { gqlAdminSchema } from "@graphql/admin"

import { gqlMainSchema } from "../graphql/main"

const updateSchemaGraphql = async () => {
  console.log("updating schema.graphql")
  try {
    await writeSDLFile(
      __dirname + "/../../src/graphql/main/schema.graphql",
      printSchema(lexicographicSortSchema(gqlMainSchema)),
    )
    console.log("updated main schema.graphql successfully")
    await writeSDLFile(
      __dirname + "/../../src/graphql/admin/schema.graphql",
      printSchema(lexicographicSortSchema(gqlAdminSchema)),
    )
    console.log("updated admin schema.graphql successfully")
  } catch (err) {
    console.log({ err }, "issue updating schema.graphql")
  }
}

if (require.main === module) {
  updateSchemaGraphql().then(() => exit(0))
}
