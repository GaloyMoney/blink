import type { Knex } from "knex"

// Update with your config settings.

const config: { [key: string]: Knex.Config } = {
  client: "pg",
  connection: "postgres://dbuser:secret@localhost:5436/default?sslmode=disable",
}

module.exports = config
