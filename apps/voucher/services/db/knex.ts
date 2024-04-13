import knexConfig from "./connection"
import createKnex from "knex"

export const knex = createKnex(knexConfig)
