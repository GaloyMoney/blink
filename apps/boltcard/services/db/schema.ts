import { knex } from "./connection"

async function createTables() {
  const hasPaymentTable = await knex.schema.hasTable("Payment")
  console.log("hasPaymentTable", hasPaymentTable)

  if (!hasPaymentTable) {
    await knex.schema.createTable("Payment", (table) => {
      table.string("k1", 255).notNullable().index()
      table.string("cardId").notNullable().index()
      table.boolean("paid").notNullable().defaultTo(false)
      table.timestamp("created_at").defaultTo(knex.fn.now())
    })

    console.log("Payment table created successfully!")
  } else {
    console.log("Payment table already exists, skipping table creation.")
  }

  const hasCardTable = await knex.schema.hasTable("Card")

  if (!hasCardTable) {
    await knex.schema.createTable("Card", (table) => {
      table.string("id").notNullable().index().unique()

      // if a card is reset, the uid would stay the same
      table.string("uid").notNullable().index()

      table.string("token").notNullable()

      // in case the token where to not be working anymore
      table.uuid("accountId").notNullable()

      // store this locally so we always have the same address (for print)
      table.string("onchainAddress").notNullable()

      // store this locally even though it's also fetchable with the token
      table.string("walletId").notNullable()

      table.integer("ctr").notNullable()
      table.boolean("enabled").notNullable().defaultTo(true)

      table.string("k0AuthKey").notNullable()
      table.string("k2CmacKey").notNullable()
      table.string("k3").notNullable()
      table.string("k4").notNullable()
      table.timestamp("created_at").defaultTo(knex.fn.now())
    })
    console.log("Card table created successfully!")
  } else {
    console.log("Card table already exists, skipping table creation.")
  }

  const hasCardKeysSetupTable = await knex.schema.hasTable("CardKeysSetup")

  if (!hasCardKeysSetupTable) {
    await knex.schema.createTable("CardKeysSetup", (table) => {
      table.string("cardId").notNullable().index().unique()

      table.timestamp("created_at").defaultTo(knex.fn.now())

      table.string("status").defaultTo("init") // init, fetched, used
      table.string("token").notNullable()

      table.string("k0AuthKey").notNullable()
      table.string("k2CmacKey").notNullable().unique()
      table.string("k3").notNullable()
      table.string("k4").notNullable()
    })
    console.log("CardKeysSetup table created successfully!")
  } else {
    console.log("CardKeysSetup table already exists, skipping table creation.")
  }
}

export default createTables
