import { GT } from "@graphql/index"

const UserError = new GT.Object({
  name: "UserError",
  fields: () => ({
    message: {
      type: GT.NonNull(GT.String),
    },
    fields: {
      type: GT.NonNullList(GT.String),
    },
  }),
})

export default UserError
