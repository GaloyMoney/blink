import type { Knex } from "knex"

export const createWithdrawLinksTable = async (knex: Knex) => {
  await knex.schema.createTable("WithdrawLinks", (table) => {
    table.uuid("id").primary()
    table.text("userId").notNullable()

    table.text("identifierCode").unique().notNullable()
    table.text("voucherSecret").unique().notNullable()
    table.text("k1").unique().notNullable()
    table.text("uniqueHash").unique().notNullable()

    table.timestamp("createdAt").defaultTo(knex.fn.now())
    table.timestamp("paidAt")

    table.enu("status", ["ACTIVE", "PENDING", "PAID"]).notNullable().defaultTo("PENDING")

    table.decimal("voucherAmountInCents").notNullable()
    table.decimal("salesAmountInCents").notNullable()
    table
      .float("commissionPercentage")
      .notNullable()
      .unsigned()
      .defaultTo(0)
      .comment("min = 0 and max = 100")
  })
}
