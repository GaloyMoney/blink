import knex from "knex"

export const getKratosKnex = () =>
  knex({
    client: "pg", // specify the database client
    connection: {
      host: process.env.KRATOS_PG_HOST ?? "kratos-pg",
      port: Number(process.env.KRATOS_PG_PORT) ?? 5432,
      user: "dbuser",
      password: "secret",
      database: "default",
    },
  })

export const getEmailCode = async ({ email }) => {
  const knex = getKratosKnex()

  const table = "courier_messages"

  // make the query
  const res = await knex
    .select(["recipient", "body", "created_at"])
    .from(table)
    .orderBy("created_at", "desc")

  const code = res
    .find((item) => item.recipient === email)
    .body.split("code:\n\n")[1]
    .slice(0, 6)

  await knex.destroy()

  return code
}

export const removeIdentities = async () => {
  const knex = getKratosKnex()

  const table = "identities"

  // truncate the table
  const resTruncate = await getKratosKnex()(table).truncate()

  knex.destroy()

  console.log({ resTruncate })
}
