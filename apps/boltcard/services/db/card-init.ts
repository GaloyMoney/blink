import { knex } from "./connection"

export interface CardInitInput {
  oneTimeCode: string
  k0AuthKey: string
  k2CmacKey: string
  k3: string
  k4: string
  token: string
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
