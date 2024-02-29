import { GT } from "@/graphql/index"

const UserPermissions = GT.Object({
  name: "UserPermissions",
  fields: () => ({
    read: { type: GT.NonNull(GT.Boolean) },
    write: { type: GT.NonNull(GT.Boolean) },
    receive: { type: GT.NonNull(GT.Boolean) },
  }),
})

export default UserPermissions
