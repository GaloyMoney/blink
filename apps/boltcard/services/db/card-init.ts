import { knex } from "./connection"

export interface CardKeysSetupInput {
  oneTimeCode: string
  k0AuthKey: string
  k2CmacKey: string
  k3: string
  k4: string
  token: string
  cardId: string
}

export async function initiateCardKeysSetup(cardData: CardKeysSetupInput) {
  try {
    const { oneTimeCode, k0AuthKey, k2CmacKey, k3, k4, token, cardId } = cardData

    const result = await knex("CardKeysSetup").insert({
      oneTimeCode,
      k0AuthKey,
      k2CmacKey,
      k3,
      k4,
      token,
      cardId,
    })

    return result
  } catch (error) {
    if (error instanceof Error) console.error(`Error creating card: ${error.message}`)
    throw error
  }
}

export async function fetchByOneTimeCode(oneTimeCode: string) {
  const result = await knex("CardKeysSetup").where("oneTimeCode", oneTimeCode).first()

  if (result) {
    await knex("CardKeysSetup")
      .where("oneTimeCode", oneTimeCode)
      .update({ status: "fetched" })
  }

  return result
}

export async function fetchByCarksKeysSetupCardId(cardId: string) {
  const result = await knex("CardKeysSetup").where("cardId", cardId).first()

  return result
}

export async function markCardKeysSetupAsUsed(k2CmacKey: string) {
  await knex("CardKeysSetup").where("k2CmacKey", k2CmacKey).update({ status: "used" })
}

export async function fetchAllWithStatusFetched() {
  const results = await knex("CardKeysSetup").where("status", "fetched").select()
  return results
}
