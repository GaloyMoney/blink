import AccountContactUpsertPayload from "@/graphql/public/types/payload/account-contact-upsert"
import ContactIdentifier from "@/graphql/shared/types/scalar/contact-identifier"
import ContactAlias from "@/graphql/public/types/scalar/contact-alias"
import ContactType from "@/graphql/shared/types/scalar/contact-type"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"

import { Contacts } from "@/app"

const AccountContactUpsertInput = GT.Input({
  name: "AccountContactUpsertInput",
  fields: () => ({
    identifier: { type: ContactIdentifier },
    alias: { type: ContactAlias },
    type: { type: GT.NonNull(ContactType) },
  }),
})

const AccountContactUpsertMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AccountContactUpsertPayload),
  args: {
    input: { type: GT.NonNull(AccountContactUpsertInput) },
  },
  resolve: async (_, args, { domainAccount }: { domainAccount: Account }) => {
    const { identifier, alias, type } = args.input

    if (type instanceof Error) {
      return { errors: [{ message: type.message }] }
    }

    if (alias instanceof Error) {
      return { errors: [{ message: alias.message }] }
    }

    const result = await Contacts.upserContact({
      accountId: domainAccount.id,
      identifier,
      alias,
      type,
    })

    if (result instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(result)] }
    }

    return {
      errors: [],
      contact: result,
    }
  },
})

export default AccountContactUpsertMutation
