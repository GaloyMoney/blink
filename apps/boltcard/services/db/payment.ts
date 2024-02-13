import { knex } from "./connection"

export async function insertPayment({ k1, cardId }: { k1: string; cardId: string }) {
  await knex("Payment").insert({ k1, cardId })
  console.log("k1 inserted successfully!")
}

export async function fetchByK1(k1: string) {
  const result = await knex("Payment").where("k1", k1).first()
  return result
}
