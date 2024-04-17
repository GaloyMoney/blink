import createKnex from "knex"

import knexConfig from "./connection"

export const knex = createKnex(knexConfig)
