import { Accounts } from "@app"
import AccountDetailPayload from "@graphql/admin/types/payload/account-detail"
import AccountLevel from "@graphql/admin/types/scalar/account-level"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"

const AccountUpdateLevelInput = GT.Input({
  name: "AccountUpdateLevelInput",
  fields: () => ({
    // FIXME: should be account id
    uid: {
      type: GT.NonNullID,
    },
    level: {
      type: GT.NonNull(AccountLevel),
    },
  }),
})

const AccountUpdateLevelMutation = GT.Field<{
  input: {
    uid: string
    level: AccountLevel | Error
  }
}>({
  type: GT.NonNull(AccountDetailPayload),
  args: {
    input: { type: GT.NonNull(AccountUpdateLevelInput) },
  },
  resolve: async (_, args) => {
    // FIXME: should be account id
    const { uid, level } = args.input

    for (const input of [uid, level]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const account = await Accounts.updateAccountLevel({ id: uid, level } as {
      id: string
      level: AccountLevel // TODO: check if that is the case given graphql validation of GT.Enum({ name: "AccountLevel" })
    })

    if (account instanceof Error) {
      return { errors: [{ message: mapError(account).message }] }
    }
    return { errors: [], accountDetails: account }
  },
})

export default AccountUpdateLevelMutation
