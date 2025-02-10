export const up = async (knex) => {
  await knex.schema.table("WithdrawLinks", (table) => {
    table.bigInteger("voucherAmountInSats").unsigned().nullable()
    table.timestamp("voucherAmountInSatsAt")
  })
}

export const down = async (knex) => {}
