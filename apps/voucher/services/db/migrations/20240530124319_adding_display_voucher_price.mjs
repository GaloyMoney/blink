export const up = async (knex) => {
  await knex.schema.table("WithdrawLinks", (table) => {
    table.text("displayVoucherPrice").nullable()
    table.text("displayCurrency").nullable()
  })

  await knex("WithdrawLinks").update({
    displayCurrency: "USD",
    displayVoucherPrice: knex.raw(
      `TO_CHAR("salesAmountInCents" / 100.0, 'FM999999990.00') || ' USD'`,
    ),
  })

  await knex.schema.table("WithdrawLinks", (table) => {
    table.text("displayVoucherPrice").notNullable().alter()
    table.text("displayCurrency").notNullable().alter()
  })
}

export const down = async (knex) => {
  await knex.schema.table("WithdrawLinks", (table) => {
    table.dropColumn("displayVoucherPrice")
    table.dropColumn("displayCurrency")
  })
}
