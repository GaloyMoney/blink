import { GT } from "@graphql/index"
import { getApiKeysForAccount } from "@app/accounts"
import AccountApiKeyHashed from "@graphql/types/object/account-api-key-hashed"
import { CouldNotFindError } from "@domain/errors"

const AccountApiKeysQuery = GT.Field({
  type: GT.List(AccountApiKeyHashed),
  resolve: async (_, __, { domainUser }): Promise<AccountApiKey[]> => {
    const accountId = domainUser.defaultAccountId

    const accountApiKeys = await getApiKeysForAccount(accountId)
    if (accountApiKeys instanceof CouldNotFindError) return []
    if (accountApiKeys instanceof Error) throw accountApiKeys

    return accountApiKeys
  },
})

export default AccountApiKeysQuery
