import { GT } from "@graphql/index"
import { Accounts } from "@app"
import AccountApiKeyHashed from "@graphql/types/object/account-api-key-hashed"
import { CouldNotFindError } from "@domain/errors"

const AccountApiKeysQuery = GT.Field<null, null, GraphQLContextForUser>({
  type: GT.List(AccountApiKeyHashed),
  resolve: async (_, __, { domainUser }): Promise<AccountApiKey[]> => {
    const accountId = domainUser.defaultAccountId

    const accountApiKeys = await Accounts.getApiKeysForAccount(accountId)
    if (accountApiKeys instanceof CouldNotFindError) return []
    if (accountApiKeys instanceof Error) throw accountApiKeys

    return accountApiKeys
  },
})

export default AccountApiKeysQuery
