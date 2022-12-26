import knex from "knex"

export const kratos_knex_db = knex({
  client: "pg", // specify the database client
  connection: {
    host: "localhost",
    port: 5433,
    user: "dbuser",
    password: "secret",
    database: "default",
  },
})

export const getEmailCode = async ({ email }) => {
  const table = "courier_messages"

  // make the query
  const res = await kratos_knex_db
    .select(["recipient", "body", "created_at"])
    .from(table)
    .orderBy("created_at", "desc")

  const code = res
    .find((item) => item.recipient === email)
    .body.split("code:\n\n")[1]
    .slice(0, 6)

  return code
}

export const removeIdentities = async () => {
  const table = "identities"

  // truncate the table
  const resTruncate = await kratos_knex_db(table).truncate()
  console.log({ resTruncate })
}
