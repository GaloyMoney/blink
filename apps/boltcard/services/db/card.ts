import { lightningDomain } from "../config"

import { knex } from "./connection"

export async function fetchByUid(uid: string) {
  const result = await knex("Card").where("uid", uid).first()
  return result
}

export async function fetchByCardId(cardId: string) {
  const result = await knex("Card").where("id", cardId).first()
  return result
}

export async function fetchPublicByCardUid(uid: string) {
  const result = await knex("Card")
    .where("uid", uid)
    .select("id", "uid", "onchainAddress", "enabled")
    .first()
  return result
}

export async function fetchPublicByCardId(cardId: string) {
  const result = await knex("Card")
    .where("id", cardId)
    .select("id", "uid", "onchainAddress", "enabled")
    .first()

  // TODO: refactor with a card service !== db
  const username = `card_${result.id}`
  const lightningAddress = `${username}@${lightningDomain}`

  return { ...result, username, lightningAddress }
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
  onchainAddress: string
  walletId: string
}

export async function createCard(cardData: CardInput) {
  try {
    const {
      id,
      uid,
      k0AuthKey,
      k2CmacKey,
      k3,
      k4,
      ctr,
      token,
      accountId,
      onchainAddress,
      walletId,
    } = cardData

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
        onchainAddress,
        walletId,
      })
      .returning("*")

    return result
  } catch (error) {
    if (error instanceof Error) console.error(`Error creating card: ${error.message}`)
    throw error
  }
}
