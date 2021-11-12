import { GT } from "@graphql/index"
import IError from "@graphql/types/abstract/error"
import GraphQLUser from "../object/user"

const UserDetailPayload = new GT.Object({
  name: "UserDetailPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    userDetails: {
      type: GraphQLUser,
    },
  }),
})

export default UserDetailPayload
