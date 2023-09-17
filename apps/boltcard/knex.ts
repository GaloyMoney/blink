const options = {
  client: "pg",
  connection: "postgres://dbuser:secret@localhost:5436/default?sslmode=disable",
}

const knex = require("knex")(options)

export async function createTable() {
  const hasPaymentTable = await knex.schema.hasTable("Payment")

  if (!hasPaymentTable) {
    await knex.schema.createTable("Payment", (table) => {
      table.string("k1", 255).notNullable().index()

      // index on card.id?
      table.string("cardId").notNullable()
      table.boolean("paid").notNullable().defaultTo(false)
      table.timestamp("created_at").defaultTo(knex.fn.now())
    })

    console.log("Payment table created successfully!")
  } else {
    console.log("Payment table already exists, skipping table creation.")
  }

  const hasCardTable = await knex.schema.hasTable("Card")

  if (!hasCardTable) {
    await knex.schema
      .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
      .createTable("Card", (table) => {
        table
          .uuid("id")
          .notNullable()
          .index()
          .unique()
          .defaultTo(knex.raw("uuid_generate_v4()"))

        // if a card is resetted, the uid would stay the same
        table.string("uid").notNullable().index()
        table.string("token").notNullable()

        table.integer("ctr").notNullable()
        table.boolean("enabled").notNullable().defaultTo(true)

        table.string("k0AuthKey").notNullable()
        table.string("k2CmacKey").notNullable()
        table.string("k3").notNullable()
        table.string("k4").notNullable()
      })
    console.log("Card table created successfully!")
  } else {
    console.log("Card table already exists, skipping table creation.")
  }

  const hasCardInitTable = await knex.schema.hasTable("CardInit")

  if (!hasCardInitTable) {
    await knex.schema.createTable("CardInit", (table) => {
      table.string("oneTimeCode").notNullable().index().unique()
      table.timestamp("created_at").defaultTo(knex.fn.now())
      table.string("status").defaultTo("init") // init, fetched, used
      table.string("token").notNullable()

      table.string("k0AuthKey").notNullable()
      table.string("k2CmacKey").notNullable() // .index().unique() enforcing uniqueness would ensure there is no reusage of keys
      table.string("k3").notNullable()
      table.string("k4").notNullable()
    })
    console.log("CardInit table created successfully!")
  } else {
    console.log("CardInit table already exists, skipping table creation.")
  }
}

export async function insertk1({ k1, cardId }: { k1: string; cardId: string }) {
  await knex("Payment").insert({ k1, cardId })
  console.log("k1 inserted successfully!")
}

export async function fetchByK1(k1: string) {
  const result = await knex("Payment").where("k1", k1).first()
  return result
}

export async function fetchByUid(uid: string) {
  const result = await knex("Card").where("uid", uid).first()
  return result
}

export async function fetchByCardId(cardId: string) {
  const result = await knex("Card").where("id", cardId).first()
  return result
}

export interface CardInitInput {
  oneTimeCode: string
  token: string
  k0AuthKey: string
  k2CmacKey: string
  k3: string
  k4: string
}

export async function createCardInit(cardData: CardInitInput) {
  try {
    const { oneTimeCode, k0AuthKey, k2CmacKey, k3, k4, token } = cardData

    const result = await knex("CardInit").insert({
      oneTimeCode,
      k0AuthKey,
      k2CmacKey,
      k3,
      k4,
      token,
    })

    return result
  } catch (error) {
    if (error instanceof Error) console.error(`Error creating card: ${error.message}`)
    throw error
  }
}

interface CardInput {
  uid: string
  k0AuthKey: string
  k2CmacKey: string
  k3: string
  k4: string
  ctr: number
  token: string
}

export async function createCard(cardData: CardInput) {
  try {
    const { uid, k0AuthKey, k2CmacKey, k3, k4, ctr, token } = cardData

    const [result] = await knex("Card")
      .insert({
        uid,
        k0AuthKey,
        k2CmacKey,
        k3,
        k4,
        ctr,
        token,
      })
      .returning("*")

    return result
  } catch (error) {
    if (error instanceof Error) console.error(`Error creating card: ${error.message}`)
    throw error
  }
}

export async function fetchByOneTimeCode(oneTimeCode: string) {
  const result = await knex("CardInit").where("oneTimeCode", oneTimeCode).first()

  if (result) {
    await knex("CardInit").where("oneTimeCode", oneTimeCode).update({ status: "fetched" })
  }

  return result
}

export async function markCardInitAsUsed(k2CmacKey: string) {
  await knex("CardInit").where("k2CmacKey", k2CmacKey).update({ status: "used" })
}

export async function fetchAllWithStatusFetched() {
  const results = await knex("CardInit").where("status", "fetched").select()
  return results
}
