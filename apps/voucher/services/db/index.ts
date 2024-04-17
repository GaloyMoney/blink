import { v4 as uuidV4 } from "uuid"

import { knex } from "./knex"

import { generateCode, generateRandomHash } from "@/utils/helpers"
import { Status } from "@/lib/graphql/generated"

type WithdrawLink = {
  id: string
  userId: string
  identifierCode: string
  voucherSecret: string
  k1: string
  uniqueHash: string
  createdAt?: Date
  paidAt?: Date
  status: Status
  voucherAmountInCents: number
  salesAmountInCents: number
  commissionPercentage: number
}

export async function getWithdrawLinkBySecret({
  voucherSecret,
}: {
  voucherSecret: string
}): Promise<WithdrawLink | undefined | Error> {
  try {
    const query = knex.select().from("WithdrawLinks").where({ voucherSecret })
    return await query.first()
  } catch (error) {
    return error instanceof Error
      ? error
      : new Error("Failed to get withdraw link by secret")
  }
}

export async function getWithdrawLinkByUniqueHashQuery({
  uniqueHash,
}: {
  uniqueHash: string
}): Promise<WithdrawLink | undefined | Error> {
  try {
    const query = knex.select().from("WithdrawLinks").where({ uniqueHash })
    return await query.first()
  } catch (error) {
    return error instanceof Error
      ? error
      : new Error("Failed to get withdraw link by unique hash")
  }
}

export async function getWithdrawLinkByK1Query({
  k1,
}: {
  k1: string
}): Promise<WithdrawLink | undefined | Error> {
  try {
    const query = knex.select().from("WithdrawLinks").where({ k1 })
    return await query.first()
  } catch (error) {
    return error instanceof Error ? error : new Error("Failed to get withdraw link by K1")
  }
}

export async function getWithdrawLinksByUserIdQuery({
  userId,
  status,
}: {
  userId: string
  status?: string
}): Promise<{ withdrawLinks: WithdrawLink[] } | Error> {
  try {
    let query = knex.select().from("WithdrawLinks").where({ userId })
    if (status) {
      query = query.andWhere({ status })
    }

    const withdrawLinks = await query.orderBy("createdAt", "desc")
    return { withdrawLinks }
  } catch (error) {
    return error instanceof Error
      ? error
      : new Error("Failed to get withdraw links by user ID")
  }
}

export async function createWithdrawLinkMutation(input: {
  userId: string
  voucherAmountInCents: number
  salesAmountInCents: number
  commissionPercentage: number
}): Promise<WithdrawLink | Error> {
  try {
    let identifierCode = generateCode(6)
    let retryIdentifierCode = 0
    let identifierExists = await knex("WithdrawLinks").where({ identifierCode }).first()

    while (identifierExists) {
      if (retryIdentifierCode > 10) {
        throw new Error("Failed to generate unique identifier code.")
      } else {
        retryIdentifierCode += 1
        identifierCode = generateCode(6)
        identifierExists = await knex("WithdrawLinks").where({ identifierCode }).first()
      }
    }

    let voucherSecret = generateCode(12)
    let retryVoucherSecret = 0
    let voucherSecretExists = await knex("WithdrawLinks").where({ voucherSecret }).first()

    while (retryVoucherSecret < 10 && voucherSecretExists) {
      retryVoucherSecret += 1
      if (retryVoucherSecret >= 10) {
        throw new Error("Failed to generate unique secret code.")
      }
      voucherSecret = generateCode(12)
      voucherSecretExists = await knex("WithdrawLinks").where({ voucherSecret }).first()
    }

    const withdrawLink: WithdrawLink = {
      id: uuidV4(),
      identifierCode,
      voucherSecret,
      status: Status.Pending,
      k1: generateRandomHash(),
      uniqueHash: generateRandomHash(),
      ...input,
    }

    const [createdWithdrawLink] = await knex("WithdrawLinks")
      .insert(withdrawLink)
      .returning("*")

    return createdWithdrawLink
  } catch (error) {
    return error instanceof Error ? error : new Error("Failed to create withdraw link")
  }
}

export async function updateWithdrawLinkStatus({
  id,
  status,
}: {
  id: string
  status: Status
}): Promise<WithdrawLink | Error> {
  try {
    const [withdrawLink] = await knex("WithdrawLinks")
      .where({ id })
      .update({
        status,
      })
      .returning("*")
    return withdrawLink
  } catch (error) {
    return error instanceof Error
      ? error
      : new Error("Failed to update withdraw link status")
  }
}
