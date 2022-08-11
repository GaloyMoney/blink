import { GraphQLEnumValueConfigMap } from "graphql"

import { getAccountsConfig } from "@config"

import { Accounts } from "@app"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import GraphQLAccount from "@graphql/admin/types/object/account"

const { customFields: customFieldsSchema } = getAccountsConfig()

const fields: Readonly<GraphQLEnumValueConfigMap> = customFieldsSchema.reduce(
  (acc, val) => {
    if (!val.array) {
      acc[val.name] = { value: val.name }
    }
    return acc
  },
  {} as GraphQLEnumValueConfigMap,
)

const AccountsDetailsByCustomFieldQuery = GT.Field({
  type: GT.NonNullList(GraphQLAccount),
  args: {
    field: { type: GT.Enum({ name: "CustomField", values: fields }) },
    value: { type: GT.NonNull(GT.String) },
  },
  resolve: async (_, { field, value }) => {
    console.warn({ field, value })
    if (field instanceof Error) throw field
    if (value instanceof Error) throw value

    const accounts = await Accounts.getAccountsByCustomFields({ field, value })
    if (accounts instanceof Error) throw mapError(accounts)

    return accounts
  },
})

export default AccountsDetailsByCustomFieldQuery
