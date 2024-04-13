import { env } from "../../env"
import { Knex } from "knex"

const knexConfig: Knex.Config = {
  client: "pg",
  connection: env.PG_CON,
  migrations: {
    directory: "./migrations",
    extension: "ts",
  },
}

export default knexConfig
