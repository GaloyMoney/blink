export const up = async (knex) => {
  await knex.schema.table("WithdrawLinks", (table) => {
    table.decimal("platformFee").notNullable().unsigned().defaultTo(0)
  })
}

export const down = async (knex) => {}
