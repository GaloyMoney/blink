import { GT } from "@graphql/index"

import UserUpdateContactByUsernamePayload from "@graphql/types/payload/user-update-language"
import FullName from "@graphql/types/scalar/full-name"

const UserUpdateContactByUsernameInput = new GT.Input({
  name: "UserUpdateContactByUsernameInput",
  fields: () => ({
    username: { type: GT.NonNull(GT.String) },
    fullName: { type: GT.NonNull(FullName) },
  }),
})

const UserUpdateContactByUsernameMutation = GT.Field({
  type: GT.NonNull(UserUpdateContactByUsernamePayload),
  args: {
    input: { type: GT.NonNull(UserUpdateContactByUsernameInput) },
  },
  resolve: async (_, args, { user }) => {
    const { username, fullName } = args.input

    if (fullName instanceof Error) {
      return { errors: [{ message: fullName.message }] }
    }

    // TODO: redo this with app use-case
    try {
      const contact = user.contacts.find((contact) => contact.id === username)
      if (!contact) {
        return { errors: [{ message: "Invalid request for contact update" }] }
      }
      contact.name = fullName
      await user.save()
    } catch (err) {
      return { errors: [{ message: err.message }] }
    }

    return {
      errors: [],
      user,
    }
  },
})

export default UserUpdateContactByUsernameMutation
