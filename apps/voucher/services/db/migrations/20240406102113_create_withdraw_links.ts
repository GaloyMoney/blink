import type { Knex } from "knex"
import { createWithdrawLinksTable } from "../schema"

export async function up(knex: Knex): Promise<void> {
  await createWithdrawLinksTable(knex)
}

export async function down(knex: Knex): Promise<void> {}
