import { Knex } from "knex"

export default async function createTables(knex: Knex): Promise<void> {
  const withdrawLinksTableExist = await knex.schema.hasTable("WithdrawLinks")

  if (withdrawLinksTableExist) {
    console.log("Applicant table already exists, skipping table creation.")
    return
  }

  await knex.schema.createTable("withdrawLinks", (table) => {
    table.uuid("id").primary()
    table.uuid("userId").notNullable()
    table.text("paymentRequest").notNullable() // Invoice created by escrow account to take funds from user
    table.text("paymentHash").notNullable()
    table.text("paymentSecret").notNullable()
    table.decimal("salesAmount").notNullable() // Total sum of amount, used if multiple links are created at once like 10 links for 10 sats then this will be 100
    table.text("accountType").notNullable() // BTC or USD
    table.text("escrowWallet").notNullable() // Escrow account wallet USD or BTC
    table.text("title").notNullable() // Description or title of the link
    table.decimal("voucherAmount").notNullable()
    table.text("uniqueHash").notNullable()
    table.text("k1")
    table.timestamp("createdAt").defaultTo(knex.fn.now())
    table.timestamp("updatedAt").defaultTo(knex.fn.now())
    table.text("identifierCode").unique().notNullable()
    table.text("secretCode").unique().notNullable()
    table
      .enu("status", ["FUNDED", "UNFUNDED", "PAID"]) // FUNDED = can be used now, PAID = cannot be used now link used
      .notNullable()
      .defaultTo("UNFUNDED")
    table
      .timestamp("invoiceExpiration")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP + INTERVAL '5' MINUTE"))
    table
      .float("commissionPercentage")
      .notNullable()
      .unsigned()
      .defaultTo(0)
      .comment("min = 0 and max = 100")
  })
}
