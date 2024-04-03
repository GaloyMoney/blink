import { v4 as uuidv4 } from "uuid"
import { Knex } from "knex"
import knexConfig from "./connection"
const knex = require("knex")(knexConfig)

import { generateCode } from "@/utils/helpers"

// CREATE READ UPDATE DELETE functions
export async function getWithdrawLinkByIdQuery({ id }: { id: string }) {
  try {
    const query = knex.select().from("withdrawLinks").where({ id })
    return query.first()
  } catch (error) {
    throw error
  }
}

export async function getWithdrawLinkByUniqueHashQuery({
  uniqueHash,
}: {
  uniqueHash: string
}) {
  try {
    const query = knex.select().from("withdrawLinks").where({ uniqueHash })
    return query.first()
  } catch (error) {
    throw error
  }
}

export async function getWithdrawLinkByK1Query({ k1 }: { k1: string }) {
  try {
    const query = knex.select().from("withdrawLinks").where({ k1 })
    return query.first()
  } catch (error) {
    throw error
  }
}

export async function getWithdrawLinkBySecret({ secretCode }: { secretCode: string }) {
  try {
    const query = knex.select().from("withdrawLinks").where({ secretCode })
    return query.first()
  } catch (error) {
    throw error
  }
}

export async function getWithdrawLinkByPaymentHashQuery({
  paymentHash,
}: {
  paymentHash: string
}) {
  try {
    const query = knex.select().from("withdrawLinks").where({ paymentHash })
    return query.first()
  } catch (error) {
    throw error
  }
}

export async function getAllWithdrawLinksQuery() {
  try {
    return knex.select().from("withdrawLinks")
  } catch (error) {
    throw error
  }
}
export async function createWithdrawLinkMutation(input: any) {
  try {
    let identifierCode = generateCode(5)
    let exists = await knex("withdrawLinks").where({ identifierCode }).first()

    while (exists) {
      identifierCode = generateCode(5)
      exists = await knex("withdrawLinks").where({ identifierCode }).first()
    }

    let secretCode = generateCode(12)
    exists = await knex("withdrawLinks").where({ secretCode }).first()

    while (exists) {
      secretCode = generateCode(12)
      exists = await knex("withdrawLinks").where({ secretCode }).first()
    }

    const withdrawLink = {
      ...input,
      id: uuidv4(),
      identifierCode,
      secretCode,
    }

    const [createdWithdrawLink] = await knex("withdrawLinks")
      .insert(withdrawLink)
      .returning("*")

    console.log(createdWithdrawLink)

    return createdWithdrawLink
  } catch (error) {
    throw error
  }
}

export async function updateWithdrawLinkMutation({ id, input }: any) {
  try {
    const [withdrawLink] = await knex("withdrawLinks")
      .where({ id })
      .update(input)
      .returning("*")
    return withdrawLink
  } catch (error) {
    throw error
  }
}

export async function deleteWithdrawLinkMutation({ id }: { id: string }) {
  try {
    await knex("withdrawLinks").where({ id }).del()
    return id
  } catch (error) {
    throw error
  }
}

export async function getWithdrawLinksByUserIdQuery({
  userId,
  status,
  limit,
  offset,
}: {
  userId: string
  status?: string
  limit?: number
  offset?: number
}) {
  try {
    let query = knex
      .select()
      .from("withdrawLinks")
      .where({ userId })
      .andWhere(function (this: Knex.QueryBuilder) {
        this.where("status", "<>", "UNFUNDED").orWhere(
          "invoiceExpiration",
          ">",
          knex.fn.now(),
        )
      })

    if (status) {
      query = query.andWhere({ status })
    }
    if (limit) {
      query = query.limit(limit)
    }
    if (offset) {
      query = query.offset(offset)
    }

    const withdrawLinks = await query.orderBy("createdAt", "desc")

    let countQuery = knex
      .count()
      .from("withdrawLinks")
      .where({ userId })
      .andWhere(function (this: Knex.QueryBuilder) {
        this.where("status", "<>", "UNFUNDED").orWhere(
          "invoiceExpiration",
          ">",
          knex.fn.now(),
        )
      })

    if (status) {
      countQuery = countQuery.andWhere({ status })
    }
    const result = await countQuery
    const totalLinks = parseInt(String(result[0].count), 10)

    return { withdrawLinks, totalLinks }
  } catch (error) {
    throw error
  }
}

export async function updateWithdrawLinkStatus({
  id,
  status,
}: {
  id: string
  status: string
}) {
  try {
    return knex.transaction(async (trx: any) => {
      await trx("withdrawLinks").update({ status }).where({ id })
    })
  } catch (error) {
    throw error
  }
}
