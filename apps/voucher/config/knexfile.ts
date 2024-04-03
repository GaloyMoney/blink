import type { Knex } from "knex"
import { env } from "../env"

const config: Knex.Config = {
  client: "pg",
  connection: env.PG_CON,
}

export default config
