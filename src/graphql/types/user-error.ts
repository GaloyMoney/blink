import { GT } from "../index"

const UserError = new GT.Object({
  name: "UserError",
  fields: () => ({
    message: {
      type: GT.NonNull(GT.String),
    },
    // TODO: Add fields to errors where possible
    // fields: {
    //   type: GT.NonNullList(GT.String),
    // },
  }),
})

export default UserError
