import createKnex, { Knex } from "knex"

import { env } from "@/env"

const knexConfig: Knex.Config = {
  client: "pg",
  connection: env.PG_CON,
}

export const knex = createKnex(knexConfig)
