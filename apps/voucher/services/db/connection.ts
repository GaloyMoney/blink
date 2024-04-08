import { env } from "../../env"
import createKnex, { Knex } from "knex"

const knexConfig: Knex.Config = {
  client: "pg",
  connection: env.PG_CON,
  migrations: {
    directory: "./migrations",
    extension: "ts",
  },
}

export const knex = createKnex(knexConfig)
