import { knex } from "./connection"

export async function fetchByUid(uid: string) {
  const result = await knex("Card").where("uid", uid).first()
  return result
}

export async function fetchByCardId(cardId: string) {
  const result = await knex("Card").where("id", cardId).first()
  return result
}

interface CardInput {
  id: string
  uid: string
  k0AuthKey: string
  k2CmacKey: string
  k3: string
  k4: string
  ctr: number
  token: string
  accountId: string
}

export async function createCard(cardData: CardInput) {
  try {
    const { id, uid, k0AuthKey, k2CmacKey, k3, k4, ctr, token, accountId } = cardData

    const [result] = await knex("Card")
      .insert({
        id,
        uid,
        k0AuthKey,
        k2CmacKey,
        k3,
        k4,
        ctr,
        token,
        accountId,
      })
      .returning("*")

    return result
  } catch (error) {
    if (error instanceof Error) console.error(`Error creating card: ${error.message}`)
    throw error
  }
}
