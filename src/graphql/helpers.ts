import { GraphQLFieldConfig, GraphQLScalarType, ThunkObjMap } from "graphql"

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
    const type = getGT(field.type)
    result[field.name] = {
      type: field.required ? GT.NonNull(type) : type,
    }
  }
  return result
}

const getGT = (type?: string): GraphQLScalarType => {
  switch (type) {
    case "integer":
      return GT.Int
    case "float":
      return GT.Float
    case "boolean":
      return GT.Boolean
    default:
      return GT.String
  }
}
