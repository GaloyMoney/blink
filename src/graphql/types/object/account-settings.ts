import { GT } from "@graphql/index"

const AccountSettings = GT.Object({
  name: "AccountSettings",
  fields: () => ({
    contactEnabled: {
      type: GT.NonNull(GT.Boolean),
      description: "True to save a contact after intraledger transaction",
    },
  }),
})

export default AccountSettings
