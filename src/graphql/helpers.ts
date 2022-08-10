import { GraphQLFieldConfig, GraphQLInputFieldConfig, ThunkObjMap } from "graphql"

import { WalletCurrency } from "@domain/shared"
import { WalletsRepository } from "@services/mongoose"

import { GT } from "./index"
import { mapError } from "./error-map"

const QueryDoesNotMatchWalletCurrencyError = "QueryDoesNotMatchWalletCurrencyError"
const MutationDoesNotMatchWalletCurrencyError = "MutationDoesNotMatchWalletCurrencyError"

export const validateIsBtcWalletForMutation = async (
  walletId: WalletId,
): Promise<true | { errors: [{ message: string }] }> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return { errors: [{ message: mapError(wallet).message }] }

  if (wallet.currency === WalletCurrency.Usd) {
    return { errors: [{ message: MutationDoesNotMatchWalletCurrencyError }] }
  }
  return true
}

export const validateIsUsdWalletForMutation = async (
  walletId: WalletId,
): Promise<true | { errors: [{ message: string }] }> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return { errors: [{ message: mapError(wallet).message }] }

  if (wallet.currency === WalletCurrency.Btc) {
    return { errors: [{ message: MutationDoesNotMatchWalletCurrencyError }] }
  }
  return true
}

export const notBtcWalletForQueryError: { errors: [{ message: string }] } = {
  errors: [{ message: QueryDoesNotMatchWalletCurrencyError }],
}

export const parseCustomFieldsSchema = <TSource, TContext>({
  fields,
  onlyEditable = false,
}: {
  fields: CustomField[]
  onlyEditable?: boolean
}): ThunkObjMap<GraphQLFieldConfig<TSource, TContext>> => {
  const result: ThunkObjMap<GraphQLFieldConfig<TSource, TContext>> = {}
  for (const field of fields) {
    if (result[field.name] || (onlyEditable && !field.editable)) continue
    result[field.name] = { type: translateCustomFieldToGT(field) }
  }
  return result
}

export const parseCustomFieldsInputSchema = ({
  fields,
  onlyEditable = false,
}: {
  fields: CustomField[]
  onlyEditable?: boolean
}): ThunkObjMap<GraphQLInputFieldConfig> => {
  const result: ThunkObjMap<GraphQLInputFieldConfig> = {}
  for (const field of fields) {
    if (result[field.name] || (onlyEditable && !field.editable)) continue
    result[field.name] = {
      type: translateCustomFieldToGT(field),
      defaultValue: field.defaultValue,
    }
  }
  return result
}

const translateCustomFieldToGT = (field: CustomField) => {
  let baseType = GT.String
  if (field.type === "integer") {
    baseType = GT.Int
  }

  if (field.type === "float") {
    baseType = GT.Float
  }

  if (field.type === "boolean") {
    baseType = GT.Boolean
  }

  if (field.array) {
    return field.required ? GT.NonNullList(baseType) : GT.List(baseType)
  }

  return field.required ? GT.NonNull(baseType) : baseType
}
