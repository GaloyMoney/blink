import knex from "knex"

import { KRATOS_PG_CON } from "@/config"

const getKratosKnex = () =>
  knex({
    client: "pg", // specify the database client
    connection: KRATOS_PG_CON,
  })

export const getEmailCode = async (email: EmailAddress) => {
  const knex = getKratosKnex()

  const table = "courier_messages"

  // make the query
  const res = await knex
    .select(["recipient", "body", "created_at"])
    .from(table)
    .orderBy("created_at", "desc")

  await knex.destroy()

  const message = res.find((item) => item.recipient === email)

  if (!message) {
    throw new Error(`no message for email ${email}`)
  }

  const code = message.body.split("code:\n\n")[1].slice(0, 6)
  return code
}
