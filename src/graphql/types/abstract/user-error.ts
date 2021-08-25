import { GT } from "@graphql/index"

const UserError = new GT.Interface({
  name: "UserError",
  fields: () => ({
    message: {
      type: GT.NonNull(GT.String),
    },
    path: {
      type: GT.List(GT.String),
    },
  }),
})

export default UserError
