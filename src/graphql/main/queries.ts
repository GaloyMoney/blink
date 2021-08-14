import * as Users from "@app/users"
import User from "@graphql/types/object/user"
import { GT } from "../index"

const QueryType = new GT.Object({
  name: "Query",
  fields: () => ({
    me: {
      type: User,
      resolve: async (_, __, { uid }) => {
        const user = await Users.getUser(uid)
        if (user instanceof Error) {
          throw user
        }
        return user
      },
    },
  }),
})

export default QueryType
