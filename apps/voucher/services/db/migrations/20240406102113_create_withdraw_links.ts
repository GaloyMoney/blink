import type { Knex } from "knex"

import { createWithdrawLinksTable } from "../schema"

export async function up(): Promise<void> {
  await createWithdrawLinksTable()
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty-function
export async function down(knex: Knex): Promise<void> {}
