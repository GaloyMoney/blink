import { GT } from "@graphql/index"

const IError = new GT.Interface({
  name: "Error",
  fields: () => ({
    message: {
      type: GT.NonNull(GT.String),
    },
    path: {
      type: GT.List(GT.String),
    },
  }),
})

export default IError
