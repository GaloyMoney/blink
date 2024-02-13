import createKnex, { Knex } from "knex"

const knexConfig: Knex.Config = {
  client: "pg",
  connection: "postgres://dbuser:secret@localhost:5436/default?sslmode=disable",
}

export const knex = createKnex(knexConfig)
